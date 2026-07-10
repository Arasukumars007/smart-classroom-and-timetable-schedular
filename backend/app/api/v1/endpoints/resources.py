from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional

from app.db.session import get_db
from app.models.classroom import Classroom
from app.models.faculty import Faculty, FacultySubject, FacultyAvailability
from app.models.student import Student
from app.models.user import User
from app.schemas.resources import (
    ClassroomCreate, ClassroomUpdate, ClassroomOut,
    FacultyCreate, FacultyUpdate, FacultyOut, FacultyWithUserOut,
    AvailabilityCreate, AvailabilityOut,
    StudentCreate, StudentUpdate, StudentOut, StudentWithUserOut,
)
from app.schemas.user import UserCreate
from app.core.dependencies import get_current_admin, get_current_user, get_current_faculty
from app.core.security import get_password_hash
from pydantic import BaseModel, EmailStr

router = APIRouter()


# ─── Composite schemas for creating user + profile in one call ─────────────────
class FacultyFullCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    employee_id: str
    department_id: int
    designation: str = "Assistant Professor"
    max_hours_per_week: int = 18
    phone: Optional[str] = None


class StudentFullCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    roll_number: str
    semester_id: int
    section: str = "A"
    phone: Optional[str] = None


# ─── Classrooms ──────────────────────────────────────────────────────────────
@router.get("/classrooms", response_model=List[ClassroomOut])
async def list_classrooms(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    result = await db.execute(select(Classroom))
    return result.scalars().all()


@router.post("/classrooms", response_model=ClassroomOut, status_code=201)
async def create_classroom(data: ClassroomCreate, db: AsyncSession = Depends(get_db), _=Depends(get_current_admin)):
    room = Classroom(**data.model_dump())
    db.add(room)
    await db.flush()
    await db.refresh(room)
    return room


@router.put("/classrooms/{room_id}", response_model=ClassroomOut)
async def update_classroom(room_id: int, data: ClassroomUpdate, db: AsyncSession = Depends(get_db), _=Depends(get_current_admin)):
    room = await db.get(Classroom, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Classroom not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(room, k, v)
    await db.flush()
    return room


@router.delete("/classrooms/{room_id}", status_code=204)
async def delete_classroom(room_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_admin)):
    room = await db.get(Classroom, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Classroom not found")
    await db.delete(room)


# ─── Faculty ──────────────────────────────────────────────────────────────────
@router.get("/faculty", response_model=List[FacultyWithUserOut])
async def list_faculty(department_id: Optional[int] = None, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    query = select(Faculty)
    if department_id:
        query = query.where(Faculty.department_id == department_id)
    result = await db.execute(query)
    faculty_list = result.scalars().all()

    out = []
    for f in faculty_list:
        user = await db.get(User, f.user_id)
        out.append(FacultyWithUserOut(
            id=f.id, user_id=f.user_id, employee_id=f.employee_id,
            department_id=f.department_id, designation=f.designation,
            max_hours_per_week=f.max_hours_per_week, phone=f.phone,
            created_at=f.created_at,
            full_name=user.full_name if user else None,
            email=user.email if user else None,
        ))
    return out


@router.post("/faculty", response_model=FacultyWithUserOut, status_code=201)
async def create_faculty_with_user(data: FacultyFullCreate, db: AsyncSession = Depends(get_db), _=Depends(get_current_admin)):
    """Create a User account + Faculty profile in a single transaction."""
    # Check email uniqueness
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    user = User(
        full_name=data.full_name,
        email=data.email,
        password_hash=get_password_hash(data.password),
        role="faculty",
    )
    db.add(user)
    await db.flush()

    # Create faculty profile
    faculty = Faculty(
        user_id=user.id,
        employee_id=data.employee_id,
        department_id=data.department_id,
        designation=data.designation,
        max_hours_per_week=data.max_hours_per_week,
        phone=data.phone,
    )
    db.add(faculty)
    await db.flush()
    await db.refresh(faculty)

    return FacultyWithUserOut(
        id=faculty.id, user_id=faculty.user_id, employee_id=faculty.employee_id,
        department_id=faculty.department_id, designation=faculty.designation,
        max_hours_per_week=faculty.max_hours_per_week, phone=faculty.phone,
        created_at=faculty.created_at,
        full_name=user.full_name,
        email=user.email,
    )


@router.put("/faculty/{faculty_id}", response_model=FacultyOut)
async def update_faculty(faculty_id: int, data: FacultyUpdate, db: AsyncSession = Depends(get_db), _=Depends(get_current_admin)):
    faculty = await db.get(Faculty, faculty_id)
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(faculty, k, v)
    await db.flush()
    return faculty


@router.delete("/faculty/{faculty_id}", status_code=204)
async def delete_faculty(faculty_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_admin)):
    faculty = await db.get(Faculty, faculty_id)
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")
    await db.delete(faculty)


@router.post("/faculty/{faculty_id}/subjects/{subject_id}", status_code=201)
async def assign_subject(faculty_id: int, subject_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_admin)):
    existing = await db.execute(
        select(FacultySubject).where(
            FacultySubject.faculty_id == faculty_id,
            FacultySubject.subject_id == subject_id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already assigned")
    fs = FacultySubject(faculty_id=faculty_id, subject_id=subject_id)
    db.add(fs)
    await db.flush()
    return {"message": "Subject assigned to faculty"}


@router.delete("/faculty/{faculty_id}/subjects/{subject_id}", status_code=204)
async def remove_subject(faculty_id: int, subject_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_admin)):
    result = await db.execute(
        select(FacultySubject).where(
            FacultySubject.faculty_id == faculty_id,
            FacultySubject.subject_id == subject_id
        )
    )
    fs = result.scalar_one_or_none()
    if fs:
        await db.delete(fs)


@router.get("/faculty/{faculty_id}/availability", response_model=List[AvailabilityOut])
async def get_availability(faculty_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    result = await db.execute(
        select(FacultyAvailability).where(FacultyAvailability.faculty_id == faculty_id)
    )
    return result.scalars().all()


@router.post("/faculty/availability", response_model=AvailabilityOut, status_code=201)
async def set_availability(data: AvailabilityCreate, db: AsyncSession = Depends(get_db), _=Depends(get_current_faculty)):
    avail = FacultyAvailability(**data.model_dump())
    db.add(avail)
    await db.flush()
    await db.refresh(avail)
    return avail


# ─── Students ─────────────────────────────────────────────────────────────────
@router.get("/students", response_model=List[StudentWithUserOut])
async def list_students(semester_id: Optional[int] = None, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    query = select(Student)
    if semester_id:
        query = query.where(Student.semester_id == semester_id)
    result = await db.execute(query)
    students = result.scalars().all()
    out = []
    for s in students:
        user = await db.get(User, s.user_id)
        out.append(StudentWithUserOut(
            id=s.id, user_id=s.user_id, roll_number=s.roll_number,
            semester_id=s.semester_id, section=s.section, phone=s.phone,
            created_at=s.created_at,
            full_name=user.full_name if user else None,
            email=user.email if user else None,
        ))
    return out


@router.post("/students", response_model=StudentWithUserOut, status_code=201)
async def create_student_with_user(data: StudentFullCreate, db: AsyncSession = Depends(get_db), _=Depends(get_current_admin)):
    """Create a User account + Student profile in a single transaction."""
    # Check email uniqueness
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    user = User(
        full_name=data.full_name,
        email=data.email,
        password_hash=get_password_hash(data.password),
        role="student",
    )
    db.add(user)
    await db.flush()

    # Create student profile
    student = Student(
        user_id=user.id,
        roll_number=data.roll_number,
        semester_id=data.semester_id,
        section=data.section,
        phone=data.phone,
    )
    db.add(student)
    await db.flush()
    await db.refresh(student)

    return StudentWithUserOut(
        id=student.id, user_id=student.user_id, roll_number=student.roll_number,
        semester_id=student.semester_id, section=student.section, phone=student.phone,
        created_at=student.created_at,
        full_name=user.full_name,
        email=user.email,
    )


@router.put("/students/{student_id}", response_model=StudentOut)
async def update_student(student_id: int, data: StudentUpdate, db: AsyncSession = Depends(get_db), _=Depends(get_current_admin)):
    student = await db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(student, k, v)
    await db.flush()
    return student


@router.delete("/students/{student_id}", status_code=204)
async def delete_student(student_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_admin)):
    student = await db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    await db.delete(student)
