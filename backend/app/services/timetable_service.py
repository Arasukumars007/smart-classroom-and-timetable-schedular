"""
Timetable service: orchestrates CSP/Genetic generation, DB persistence,
and conflict detection.
"""
from typing import List, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, and_
from sqlalchemy.orm import selectinload

from app.models.timetable import TimetableSlot
from app.models.subject import Subject
from app.models.faculty import Faculty, FacultySubject, FacultyAvailability
from app.models.classroom import Classroom
from app.models.semester import Semester
from app.models.student import Student
from app.models.notification import Notification
from app.schemas.timetable import GenerateTimetableRequest, TimetableGenerationResult
from app.services.scheduler.csp_scheduler import CSPScheduler, SchedulingContext
from app.services.scheduler.genetic_scheduler import GeneticScheduler


class TimetableService:

    async def generate_timetable(
        self,
        request: GenerateTimetableRequest,
        db: AsyncSession,
    ) -> TimetableGenerationResult:
        # 1. Load semester data
        semester = await db.get(Semester, request.semester_id)
        if not semester:
            return TimetableGenerationResult(
                success=False, slots_created=0, message="Semester not found", algorithm_used=request.algorithm
            )

        # 2. Load subjects for this semester with faculty assignments
        subj_result = await db.execute(
            select(Subject).where(Subject.semester_id == request.semester_id)
        )
        subjects_db = subj_result.scalars().all()

        # 3. Load faculty assignments
        fa_result = await db.execute(
            select(FacultySubject).where(
                FacultySubject.subject_id.in_([s.id for s in subjects_db])
            )
        )
        faculty_assignments = {fs.subject_id: fs.faculty_id for fs in fa_result.scalars().all()}

        # 4. Build subject dicts
        subjects_data = []
        for s in subjects_db:
            subjects_data.append({
                "id": s.id,
                "name": s.name,
                "hours_per_week": s.hours_per_week,
                "is_lab": s.is_lab,
                "lab_hours": s.lab_hours or 2,
                "credit_hours": s.credit_hours,
                "faculty_id": faculty_assignments.get(s.id),
            })

        # 5. Load classrooms
        room_result = await db.execute(select(Classroom).where(Classroom.is_active == True))
        classrooms_data = [
            {"id": r.id, "capacity": r.capacity, "is_lab": r.is_lab, "lab_type": r.lab_type}
            for r in room_result.scalars().all()
        ]

        # 6. Build faculty availability map
        all_faculty_ids = list(set(faculty_assignments.values()))
        avail_result = await db.execute(
            select(FacultyAvailability).where(
                FacultyAvailability.faculty_id.in_(all_faculty_ids)
            )
        )
        faculty_avail: Dict[int, set] = {}
        for avail in avail_result.scalars().all():
            if avail.is_available:
                faculty_avail.setdefault(avail.faculty_id, set())
                for p in range(avail.start_period, avail.end_period + 1):
                    faculty_avail[avail.faculty_id].add((avail.day_of_week, p))

        # Default: all periods available if no specific constraint
        for fid in all_faculty_ids:
            if fid not in faculty_avail:
                faculty_avail[fid] = {(d, p) for d in range(5) for p in range(1, 9)}

        # 7. Count students for capacity checks
        student_result = await db.execute(
            select(Student).where(Student.semester_id == request.semester_id)
        )
        student_count = len(student_result.scalars().all()) or 30

        all_slots = []
        all_conflicts = []

        for section in request.sections:
            context = SchedulingContext(
                semester_id=request.semester_id,
                section=section,
                subjects=subjects_data,
                classrooms=classrooms_data,
                faculty_availability=faculty_avail,
                student_count=max(student_count // len(request.sections), 20),
            )

            if request.algorithm == "genetic":
                scheduler = GeneticScheduler(population_size=15, generations=30)
                slots, conflicts = scheduler.optimize(context)
            else:
                scheduler = CSPScheduler()
                slots, conflicts = scheduler.generate(context)

            all_slots.extend(slots)
            all_conflicts.extend(conflicts)

        # 8. Clear existing if requested
        if request.clear_existing:
            await db.execute(
                delete(TimetableSlot).where(
                    and_(
                        TimetableSlot.semester_id == request.semester_id,
                        TimetableSlot.academic_year == request.academic_year,
                        TimetableSlot.section.in_(request.sections),
                    )
                )
            )

        # 9. Persist new slots
        db_slots = []
        for slot in all_slots:
            db_slot = TimetableSlot(
                semester_id=slot.semester_id,
                section=slot.section,
                day_of_week=slot.day,
                period_number=slot.period,
                subject_id=slot.subject_id,
                faculty_id=slot.faculty_id,
                classroom_id=slot.classroom_id,
                slot_type=slot.slot_type,
                is_lab_continuation=slot.is_lab_continuation,
                academic_year=request.academic_year,
                generated_by=request.algorithm,
            )
            db.add(db_slot)
            db_slots.append(db_slot)

        await db.flush()

        # 10. Create notifications for affected faculty
        notified = set()
        for slot in all_slots:
            if slot.faculty_id not in notified:
                notif = Notification(
                    user_id=0,  # Will be updated when we link faculty user
                    title="Timetable Updated",
                    message=f"Your timetable for Semester {semester.number} has been generated.",
                    notification_type="info",
                )
                # We skip DB insert here to avoid user_id=0 issues; handle via notification service

        return TimetableGenerationResult(
            success=True,
            slots_created=len(db_slots),
            conflicts=all_conflicts,
            algorithm_used=request.algorithm,
            message=f"Successfully generated {len(db_slots)} timetable slots for {len(request.sections)} section(s).",
        )

    async def detect_conflicts(self, semester_id: int, section: str, db: AsyncSession) -> List[Dict]:
        result = await db.execute(
            select(TimetableSlot).where(
                and_(
                    TimetableSlot.semester_id == semester_id,
                    TimetableSlot.section == section,
                )
            )
        )
        slots = result.scalars().all()
        conflicts = []

        faculty_slots: Dict = {}
        room_slots: Dict = {}

        for slot in slots:
            if slot.faculty_id:
                fk = (slot.faculty_id, slot.day_of_week, slot.period_number)
                if fk in faculty_slots:
                    conflicts.append({
                        "type": "faculty_conflict",
                        "day": slot.day_of_week,
                        "period": slot.period_number,
                        "description": f"Faculty double-booked at day {slot.day_of_week} period {slot.period_number}",
                    })
                faculty_slots[fk] = slot.id

            if slot.classroom_id:
                rk = (slot.classroom_id, slot.day_of_week, slot.period_number)
                if rk in room_slots:
                    conflicts.append({
                        "type": "classroom_conflict",
                        "day": slot.day_of_week,
                        "period": slot.period_number,
                        "description": f"Classroom double-booked at day {slot.day_of_week} period {slot.period_number}",
                    })
                room_slots[rk] = slot.id

        return conflicts
