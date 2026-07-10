from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import List, Optional
import io

from app.db.session import get_db
from app.models.timetable import TimetableSlot
from app.models.subject import Subject
from app.models.faculty import Faculty
from app.models.classroom import Classroom
from app.models.user import User
from app.schemas.timetable import (
    TimetableSlotCreate, TimetableSlotUpdate, TimetableSlotOut,
    TimetableSlotDetail, GenerateTimetableRequest, TimetableGenerationResult, ConflictInfo
)
from app.services.timetable_service import TimetableService
from app.core.dependencies import get_current_admin, get_current_user

router = APIRouter()
timetable_service = TimetableService()


@router.post("/generate", response_model=TimetableGenerationResult)
async def generate_timetable(
    request: GenerateTimetableRequest,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin)
):
    result = await timetable_service.generate_timetable(request, db)
    return result


@router.get("/slots", response_model=List[TimetableSlotDetail])
async def get_timetable_slots(
    semester_id: Optional[int] = None,
    section: Optional[str] = None,
    faculty_id: Optional[int] = None,
    classroom_id: Optional[int] = None,
    day_of_week: Optional[int] = None,
    academic_year: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user)
):
    query = select(TimetableSlot)
    filters = []
    if semester_id:
        filters.append(TimetableSlot.semester_id == semester_id)
    if section:
        filters.append(TimetableSlot.section == section)
    if faculty_id:
        filters.append(TimetableSlot.faculty_id == faculty_id)
    if classroom_id:
        filters.append(TimetableSlot.classroom_id == classroom_id)
    if day_of_week is not None:
        filters.append(TimetableSlot.day_of_week == day_of_week)
    if academic_year:
        filters.append(TimetableSlot.academic_year == academic_year)
    if filters:
        query = query.where(and_(*filters))
    query = query.order_by(TimetableSlot.day_of_week, TimetableSlot.period_number)

    result = await db.execute(query)
    slots = result.scalars().all()

    detail_slots = []
    for slot in slots:
        subject = await db.get(Subject, slot.subject_id) if slot.subject_id else None
        faculty = await db.get(Faculty, slot.faculty_id) if slot.faculty_id else None
        faculty_user = await db.get(User, faculty.user_id) if faculty else None
        classroom = await db.get(Classroom, slot.classroom_id) if slot.classroom_id else None

        detail_slots.append(TimetableSlotDetail(
            id=slot.id,
            semester_id=slot.semester_id,
            section=slot.section,
            day_of_week=slot.day_of_week,
            period_number=slot.period_number,
            subject_id=slot.subject_id,
            faculty_id=slot.faculty_id,
            classroom_id=slot.classroom_id,
            slot_type=slot.slot_type,
            is_lab_continuation=slot.is_lab_continuation,
            academic_year=slot.academic_year,
            generated_by=slot.generated_by,
            created_at=slot.created_at,
            subject_name=subject.name if subject else None,
            subject_code=subject.code if subject else None,
            faculty_name=faculty_user.full_name if faculty_user else None,
            classroom_name=classroom.name if classroom else None,
        ))
    return detail_slots


@router.post("/slots", response_model=TimetableSlotOut, status_code=201)
async def create_slot(
    data: TimetableSlotCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin)
):
    slot = TimetableSlot(**data.model_dump(), generated_by="manual")
    db.add(slot)
    await db.flush()
    await db.refresh(slot)
    return slot


@router.put("/slots/{slot_id}", response_model=TimetableSlotOut)
async def update_slot(
    slot_id: int,
    data: TimetableSlotUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin)
):
    slot = await db.get(TimetableSlot, slot_id)
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(slot, k, v)
    slot.generated_by = "manual"
    await db.flush()
    return slot


@router.delete("/slots/{slot_id}", status_code=204)
async def delete_slot(slot_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_admin)):
    slot = await db.get(TimetableSlot, slot_id)
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    await db.delete(slot)


@router.get("/conflicts")
async def get_conflicts(
    semester_id: int,
    section: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user)
):
    conflicts = await timetable_service.detect_conflicts(semester_id, section, db)
    return {"conflicts": conflicts, "count": len(conflicts)}
