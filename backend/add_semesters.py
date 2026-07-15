"""
Script to manually update semesters 4 to 8, along with corresponding subjects,
faculty mappings, and students for Years 2, 3, and 4.
Run: python add_semesters.py
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

import app.db.base
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.models.semester import Semester
from app.models.subject import Subject
from app.models.faculty import Faculty, FacultySubject
from app.models.student import Student
from app.models.user import User
from app.models.course import Course
from sqlalchemy import select

async def add_sems():
    async with AsyncSessionLocal() as db:
        # Load course
        res = await db.execute(select(Course).where(Course.code == "BTCSE"))
        course = res.scalar_one_or_none()
        if not course:
            print("CSE Course not found!")
            return
            
        # Get all faculty profiles
        res_fac = await db.execute(select(Faculty))
        faculties = res_fac.scalars().all()
        if not faculties:
            print("No faculty found!")
            return
            
        # Create semesters 4 to 8 if they don't exist
        created_semesters = {}
        for num in range(4, 9):
            res_sem = await db.execute(select(Semester).where(Semester.number == num, Semester.course_id == course.id))
            sem = res_sem.scalar_one_or_none()
            if not sem:
                sem = Semester(
                    number=num,
                    course_id=course.id,
                    academic_year="2024-25",
                    sections="A,B"
                )
                db.add(sem)
                await db.flush()
                print(f"Added Semester {num}")
            else:
                print(f"Semester {num} already exists")
            created_semesters[num] = sem.id
            
        # Add subjects for each new semester
        # Sem 4
        s4 = [
            Subject(name="Design & Analysis of Algorithms", code="CS401", semester_id=created_semesters[4], hours_per_week=4, credit_hours=4),
            Subject(name="Computer Organization", code="CS402", semester_id=created_semesters[4], hours_per_week=3, credit_hours=3),
            Subject(name="Software Engineering", code="CS403", semester_id=created_semesters[4], hours_per_week=3, credit_hours=3),
            Subject(name="DAA Lab", code="CS401L", semester_id=created_semesters[4], hours_per_week=2, credit_hours=1, is_lab=True, lab_hours=2),
        ]
        # Sem 5
        s5 = [
            Subject(name="Computer Networks", code="CS501", semester_id=created_semesters[5], hours_per_week=3, credit_hours=3),
            Subject(name="Theory of Computation", code="CS502", semester_id=created_semesters[5], hours_per_week=4, credit_hours=4),
            Subject(name="Microprocessors", code="CS503", semester_id=created_semesters[5], hours_per_week=3, credit_hours=3),
            Subject(name="Networks Lab", code="CS501L", semester_id=created_semesters[5], hours_per_week=2, credit_hours=1, is_lab=True, lab_hours=2),
        ]
        # Sem 6
        s6 = [
            Subject(name="Compiler Design", code="CS601", semester_id=created_semesters[6], hours_per_week=4, credit_hours=4),
            Subject(name="Web Technology", code="CS602", semester_id=created_semesters[6], hours_per_week=3, credit_hours=3),
            Subject(name="Artificial Intelligence", code="CS603", semester_id=created_semesters[6], hours_per_week=3, credit_hours=3),
            Subject(name="Web Tech Lab", code="CS602L", semester_id=created_semesters[6], hours_per_week=2, credit_hours=1, is_lab=True, lab_hours=2),
        ]
        # Sem 7
        s7 = [
            Subject(name="Cryptography & Security", code="CS701", semester_id=created_semesters[7], hours_per_week=3, credit_hours=3),
            Subject(name="Cloud Computing", code="CS702", semester_id=created_semesters[7], hours_per_week=3, credit_hours=3),
            Subject(name="Security Lab", code="CS701L", semester_id=created_semesters[7], hours_per_week=2, credit_hours=1, is_lab=True, lab_hours=2),
        ]
        # Sem 8
        s8 = [
            Subject(name="Professional Elective VII", code="CS801", semester_id=created_semesters[8], hours_per_week=3, credit_hours=3),
            Subject(name="Project Work", code="CS802L", semester_id=created_semesters[8], hours_per_week=6, credit_hours=6, is_lab=True, lab_hours=3),
        ]

        all_new_subjects = s4 + s5 + s6 + s7 + s8
        for s in all_new_subjects:
            res_sub = await db.execute(select(Subject).where(Subject.code == s.code))
            if not res_sub.scalar_one_or_none():
                db.add(s)
                await db.flush()
                print(f"Added Subject {s.name} ({s.code})")
                
                # Map to a faculty member
                fac_idx = int(s.code[2]) % len(faculties)
                fs = FacultySubject(faculty_id=faculties[fac_idx].id, subject_id=s.id)
                db.add(fs)
                
        # Add students for semesters 4-8
        for num in range(4, 9):
            sid = created_semesters[num]
            res_stu = await db.execute(select(Student).where(Student.semester_id == sid))
            if not res_stu.scalars().all():
                for i in range(1, 3):
                    username = f"Student Sem{num}_{i}"
                    email = f"student_s{num}_{i}@smartclass.edu"
                    res_user = await db.execute(select(User).where(User.email == email))
                    user = res_user.scalar_one_or_none()
                    if not user:
                        from app.core.security import get_password_hash
                        user = User(
                            full_name=username,
                            email=email,
                            password_hash=get_password_hash("student123"),
                            role="student"
                        )
                        db.add(user)
                        await db.flush()
                    
                    student = Student(
                        user_id=user.id,
                        roll_number=f"CSE{num}2024{i:03d}",
                        semester_id=sid,
                        section="A"
                    )
                    db.add(student)
                    print(f"Added Student {username} for Semester {num}")
                    
        await db.commit()
        print("Successfully updated database with Year 3/4 and Semesters 4 to 8!")

if __name__ == "__main__":
    asyncio.run(add_sems())
