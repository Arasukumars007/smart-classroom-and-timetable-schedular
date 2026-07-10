from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# ─── Department ─────────────────────────────────────────────────────────────
class DepartmentBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    head_faculty_id: Optional[int] = None


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    head_faculty_id: Optional[int] = None


class DepartmentOut(DepartmentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Course ──────────────────────────────────────────────────────────────────
class CourseBase(BaseModel):
    name: str
    code: str
    department_id: int
    duration_years: int = 4
    description: Optional[str] = None


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    department_id: Optional[int] = None
    duration_years: Optional[int] = None
    description: Optional[str] = None


class CourseOut(CourseBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Semester ─────────────────────────────────────────────────────────────────
class SemesterBase(BaseModel):
    number: int
    course_id: int
    academic_year: str
    sections: str = "A"


class SemesterCreate(SemesterBase):
    pass


class SemesterUpdate(BaseModel):
    academic_year: Optional[str] = None
    sections: Optional[str] = None


class SemesterOut(SemesterBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Subject ─────────────────────────────────────────────────────────────────
class SubjectBase(BaseModel):
    name: str
    code: str
    semester_id: int
    hours_per_week: int = 3
    credit_hours: int = 3
    is_lab: bool = False
    lab_hours: int = 0


class SubjectCreate(SubjectBase):
    pass


class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    hours_per_week: Optional[int] = None
    credit_hours: Optional[int] = None
    is_lab: Optional[bool] = None
    lab_hours: Optional[int] = None


class SubjectOut(SubjectBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
