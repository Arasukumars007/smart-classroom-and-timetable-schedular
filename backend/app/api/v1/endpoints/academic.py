from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.db.session import get_db
from app.models.department import Department
from app.models.course import Course
from app.models.semester import Semester
from app.models.subject import Subject
from app.schemas.academic import (
    DepartmentCreate, DepartmentUpdate, DepartmentOut,
    CourseCreate, CourseUpdate, CourseOut,
    SemesterCreate, SemesterUpdate, SemesterOut,
    SubjectCreate, SubjectUpdate, SubjectOut,
)
from app.core.dependencies import get_current_admin, get_current_user

router = APIRouter()


# ─── Departments ─────────────────────────────────────────────────────────────
@router.get("/departments", response_model=List[DepartmentOut])
async def list_departments(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    result = await db.execute(select(Department))
    return result.scalars().all()


@router.post("/departments", response_model=DepartmentOut, status_code=201)
async def create_department(data: DepartmentCreate, db: AsyncSession = Depends(get_db), _=Depends(get_current_admin)):
    dept = Department(**data.model_dump())
    db.add(dept)
    await db.flush()
    await db.refresh(dept)
    return dept


@router.put("/departments/{dept_id}", response_model=DepartmentOut)
async def update_department(dept_id: int, data: DepartmentUpdate, db: AsyncSession = Depends(get_db), _=Depends(get_current_admin)):
    dept = await db.get(Department, dept_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(dept, k, v)
    await db.flush()
    return dept


@router.delete("/departments/{dept_id}", status_code=204)
async def delete_department(dept_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_admin)):
    dept = await db.get(Department, dept_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    await db.delete(dept)


# ─── Courses ──────────────────────────────────────────────────────────────────
@router.get("/courses", response_model=List[CourseOut])
async def list_courses(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    result = await db.execute(select(Course))
    return result.scalars().all()


@router.post("/courses", response_model=CourseOut, status_code=201)
async def create_course(data: CourseCreate, db: AsyncSession = Depends(get_db), _=Depends(get_current_admin)):
    course = Course(**data.model_dump())
    db.add(course)
    await db.flush()
    await db.refresh(course)
    return course


@router.put("/courses/{course_id}", response_model=CourseOut)
async def update_course(course_id: int, data: CourseUpdate, db: AsyncSession = Depends(get_db), _=Depends(get_current_admin)):
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(course, k, v)
    await db.flush()
    return course


@router.delete("/courses/{course_id}", status_code=204)
async def delete_course(course_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_admin)):
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    await db.delete(course)


# ─── Semesters ────────────────────────────────────────────────────────────────
@router.get("/semesters", response_model=List[SemesterOut])
async def list_semesters(course_id: int = None, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    query = select(Semester)
    if course_id:
        query = query.where(Semester.course_id == course_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/semesters", response_model=SemesterOut, status_code=201)
async def create_semester(data: SemesterCreate, db: AsyncSession = Depends(get_db), _=Depends(get_current_admin)):
    sem = Semester(**data.model_dump())
    db.add(sem)
    await db.flush()
    await db.refresh(sem)
    return sem


@router.put("/semesters/{sem_id}", response_model=SemesterOut)
async def update_semester(sem_id: int, data: SemesterUpdate, db: AsyncSession = Depends(get_db), _=Depends(get_current_admin)):
    sem = await db.get(Semester, sem_id)
    if not sem:
        raise HTTPException(status_code=404, detail="Semester not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(sem, k, v)
    await db.flush()
    return sem


# ─── Subjects ─────────────────────────────────────────────────────────────────
@router.get("/subjects", response_model=List[SubjectOut])
async def list_subjects(semester_id: int = None, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    query = select(Subject)
    if semester_id:
        query = query.where(Subject.semester_id == semester_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/subjects", response_model=SubjectOut, status_code=201)
async def create_subject(data: SubjectCreate, db: AsyncSession = Depends(get_db), _=Depends(get_current_admin)):
    subj = Subject(**data.model_dump())
    db.add(subj)
    await db.flush()
    await db.refresh(subj)
    return subj


@router.put("/subjects/{subj_id}", response_model=SubjectOut)
async def update_subject(subj_id: int, data: SubjectUpdate, db: AsyncSession = Depends(get_db), _=Depends(get_current_admin)):
    subj = await db.get(Subject, subj_id)
    if not subj:
        raise HTTPException(status_code=404, detail="Subject not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(subj, k, v)
    await db.flush()
    return subj


@router.delete("/subjects/{subj_id}", status_code=204)
async def delete_subject(subj_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_admin)):
    subj = await db.get(Subject, subj_id)
    if not subj:
        raise HTTPException(status_code=404, detail="Subject not found")
    await db.delete(subj)
