from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class TimetableSlotBase(BaseModel):
    semester_id: int
    section: str
    day_of_week: int
    period_number: int
    subject_id: Optional[int] = None
    faculty_id: Optional[int] = None
    classroom_id: Optional[int] = None
    slot_type: str = "theory"
    is_lab_continuation: bool = False
    academic_year: str = "2024-25"


class TimetableSlotCreate(TimetableSlotBase):
    pass


class TimetableSlotUpdate(BaseModel):
    subject_id: Optional[int] = None
    faculty_id: Optional[int] = None
    classroom_id: Optional[int] = None
    slot_type: Optional[str] = None


class TimetableSlotOut(TimetableSlotBase):
    id: int
    generated_by: str
    created_at: datetime

    class Config:
        from_attributes = True


class TimetableSlotDetail(TimetableSlotOut):
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    faculty_name: Optional[str] = None
    classroom_name: Optional[str] = None


class GenerateTimetableRequest(BaseModel):
    semester_id: int
    sections: List[str]
    academic_year: str = "2024-25"
    algorithm: str = "csp"  # csp | genetic
    clear_existing: bool = True


class ConflictInfo(BaseModel):
    conflict_type: str
    day: int
    period: int
    description: str


class TimetableGenerationResult(BaseModel):
    success: bool
    slots_created: int
    conflicts: List[ConflictInfo] = []
    algorithm_used: str
    message: str


# ─── Notification ─────────────────────────────────────────────────────────────
class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    notification_type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
