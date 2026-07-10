from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ─── Classroom ────────────────────────────────────────────────────────────────
class ClassroomBase(BaseModel):
    name: str
    building: Optional[str] = None
    room_number: Optional[str] = None
    capacity: int = 60
    has_projector: bool = True
    has_ac: bool = False
    is_lab: bool = False
    lab_type: Optional[str] = None
    is_active: bool = True


class ClassroomCreate(ClassroomBase):
    pass


class ClassroomUpdate(BaseModel):
    name: Optional[str] = None
    capacity: Optional[int] = None
    has_projector: Optional[bool] = None
    has_ac: Optional[bool] = None
    is_lab: Optional[bool] = None
    lab_type: Optional[str] = None
    is_active: Optional[bool] = None


class ClassroomOut(ClassroomBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Faculty ──────────────────────────────────────────────────────────────────
class FacultyBase(BaseModel):
    employee_id: str
    department_id: int
    designation: str = "Assistant Professor"
    max_hours_per_week: int = 18
    phone: Optional[str] = None


class FacultyCreate(FacultyBase):
    user_id: int


class FacultyUpdate(BaseModel):
    designation: Optional[str] = None
    max_hours_per_week: Optional[int] = None
    phone: Optional[str] = None
    department_id: Optional[int] = None


class FacultyOut(FacultyBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class FacultyWithUserOut(FacultyOut):
    full_name: Optional[str] = None
    email: Optional[str] = None
    department_name: Optional[str] = None


# ─── Faculty Availability ─────────────────────────────────────────────────────
class AvailabilityBase(BaseModel):
    day_of_week: int
    start_period: int = 1
    end_period: int = 8
    is_available: bool = True


class AvailabilityCreate(AvailabilityBase):
    faculty_id: int


class AvailabilityOut(AvailabilityBase):
    id: int
    faculty_id: int

    class Config:
        from_attributes = True


# ─── Student ──────────────────────────────────────────────────────────────────
class StudentBase(BaseModel):
    roll_number: str
    semester_id: int
    section: str = "A"
    phone: Optional[str] = None


class StudentCreate(StudentBase):
    user_id: int


class StudentUpdate(BaseModel):
    semester_id: Optional[int] = None
    section: Optional[str] = None
    phone: Optional[str] = None


class StudentOut(StudentBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class StudentWithUserOut(StudentOut):
    full_name: Optional[str] = None
    email: Optional[str] = None
