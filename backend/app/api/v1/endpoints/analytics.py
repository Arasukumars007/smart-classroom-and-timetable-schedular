from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List

from app.db.session import get_db
from app.models.timetable import TimetableSlot
from app.models.faculty import Faculty
from app.models.classroom import Classroom
from app.models.student import Student
from app.models.subject import Subject
from app.core.dependencies import get_current_user

router = APIRouter()


@router.get("/overview")
async def analytics_overview(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    # Total counts
    total_slots = (await db.execute(select(func.count(TimetableSlot.id)))).scalar()
    total_faculty = (await db.execute(select(func.count(Faculty.id)))).scalar()
    total_classrooms = (await db.execute(select(func.count(Classroom.id)))).scalar()
    total_students = (await db.execute(select(func.count(Student.id)))).scalar()

    # Slot type breakdown
    theory_slots = (await db.execute(
        select(func.count(TimetableSlot.id)).where(TimetableSlot.slot_type == "theory")
    )).scalar()
    lab_slots = (await db.execute(
        select(func.count(TimetableSlot.id)).where(TimetableSlot.slot_type == "lab")
    )).scalar()

    return {
        "total_slots": total_slots,
        "total_faculty": total_faculty,
        "total_classrooms": total_classrooms,
        "total_students": total_students,
        "theory_slots": theory_slots,
        "lab_slots": lab_slots,
        "efficiency_score": round((theory_slots + lab_slots) / max(total_classrooms * 5 * 8, 1) * 100, 1),
    }


@router.get("/classroom-utilization")
async def classroom_utilization(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    result = await db.execute(select(Classroom))
    classrooms = result.scalars().all()

    utilization = []
    max_possible = 5 * 8  # 5 days * 8 periods

    for room in classrooms:
        slot_count = (await db.execute(
            select(func.count(TimetableSlot.id)).where(TimetableSlot.classroom_id == room.id)
        )).scalar()
        rate = round(slot_count / max_possible * 100, 1)
        utilization.append({
            "classroom_id": room.id,
            "classroom_name": room.name,
            "building": room.building,
            "capacity": room.capacity,
            "is_lab": room.is_lab,
            "slots_used": slot_count,
            "total_possible": max_possible,
            "utilization_rate": rate,
            "status": "High" if rate > 70 else "Medium" if rate > 40 else "Low",
        })

    return {"classrooms": utilization}


@router.get("/faculty-workload")
async def faculty_workload(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    from app.models.user import User
    result = await db.execute(select(Faculty))
    faculty_list = result.scalars().all()

    workload = []
    for f in faculty_list:
        hours_assigned = (await db.execute(
            select(func.count(TimetableSlot.id)).where(
                and_(TimetableSlot.faculty_id == f.id, TimetableSlot.is_lab_continuation == False)
            )
        )).scalar()
        user = await db.get(User, f.user_id)
        workload.append({
            "faculty_id": f.id,
            "faculty_name": user.full_name if user else f"Faculty {f.id}",
            "employee_id": f.employee_id,
            "department_id": f.department_id,
            "hours_assigned": hours_assigned,
            "max_hours": f.max_hours_per_week,
            "utilization_pct": round(hours_assigned / max(f.max_hours_per_week, 1) * 100, 1),
            "status": "Overloaded" if hours_assigned > f.max_hours_per_week else "Balanced" if hours_assigned >= f.max_hours_per_week * 0.7 else "Underloaded",
        })

    return {"faculty": workload}


@router.get("/department-summary")
async def department_summary(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    from app.models.department import Department
    result = await db.execute(select(Department))
    departments = result.scalars().all()

    summary = []
    for dept in departments:
        faculty_count = (await db.execute(
            select(func.count(Faculty.id)).where(Faculty.department_id == dept.id)
        )).scalar()
        summary.append({
            "department_id": dept.id,
            "department_name": dept.name,
            "department_code": dept.code,
            "faculty_count": faculty_count,
        })
    return {"departments": summary}
