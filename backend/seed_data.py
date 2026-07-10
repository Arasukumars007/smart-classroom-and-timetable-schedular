"""
Seed the database with sample data for testing.
Run: python seed_data.py
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.db.base import Base
from app.db.session import engine
from app.core.security import get_password_hash
from app.models.user import User
from app.models.department import Department
from app.models.course import Course
from app.models.semester import Semester
from app.models.subject import Subject
from app.models.classroom import Classroom
from app.models.faculty import Faculty, FacultySubject
from app.models.student import Student


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # Check if already seeded
        from sqlalchemy import select
        existing = await db.execute(select(User).limit(1))
        if existing.scalar_one_or_none():
            print("Database already seeded. Skipping.")
            return

        print("Seeding database...")

        # ── Users ─────────────────────────────────────────────────────────────
        admin = User(full_name="Admin User", email="admin@smartclass.edu",
                     password_hash=get_password_hash("admin123"), role="admin")
        db.add(admin)

        faculty_users = [
            User(full_name="Dr. Rajesh Kumar", email="rajesh@smartclass.edu",
                 password_hash=get_password_hash("faculty123"), role="faculty"),
            User(full_name="Dr. Priya Sharma", email="priya@smartclass.edu",
                 password_hash=get_password_hash("faculty123"), role="faculty"),
            User(full_name="Prof. Arun Patel", email="arun@smartclass.edu",
                 password_hash=get_password_hash("faculty123"), role="faculty"),
            User(full_name="Dr. Meena Nair", email="meena@smartclass.edu",
                 password_hash=get_password_hash("faculty123"), role="faculty"),
            User(full_name="Prof. Suresh Babu", email="suresh@smartclass.edu",
                 password_hash=get_password_hash("faculty123"), role="faculty"),
        ]
        for u in faculty_users:
            db.add(u)

        student_users = [
            User(full_name=f"Student {i:02d}", email=f"student{i:02d}@smartclass.edu",
                 password_hash=get_password_hash("student123"), role="student")
            for i in range(1, 11)
        ]
        for u in student_users:
            db.add(u)

        await db.flush()

        # ── Departments ───────────────────────────────────────────────────────
        cse = Department(name="Computer Science & Engineering", code="CSE", description="Software & Systems")
        ece = Department(name="Electronics & Communication", code="ECE", description="Electronics & Signals")
        mech = Department(name="Mechanical Engineering", code="MECH", description="Machines & Manufacturing")
        for d in [cse, ece, mech]:
            db.add(d)
        await db.flush()

        # ── Courses ───────────────────────────────────────────────────────────
        btech_cse = Course(name="B.Tech Computer Science", code="BTCSE", department_id=cse.id, duration_years=4)
        btech_ece = Course(name="B.Tech Electronics", code="BTECE", department_id=ece.id, duration_years=4)
        for c in [btech_cse, btech_ece]:
            db.add(c)
        await db.flush()

        # ── Semesters ─────────────────────────────────────────────────────────
        sem1 = Semester(number=1, course_id=btech_cse.id, academic_year="2024-25", sections="A,B")
        sem2 = Semester(number=2, course_id=btech_cse.id, academic_year="2024-25", sections="A,B")
        sem3 = Semester(number=3, course_id=btech_cse.id, academic_year="2024-25", sections="A")
        for s in [sem1, sem2, sem3]:
            db.add(s)
        await db.flush()

        # ── Subjects ──────────────────────────────────────────────────────────
        subjects_data = [
            # Sem 1
            Subject(name="Engineering Mathematics I", code="MA101", semester_id=sem1.id, hours_per_week=4, credit_hours=4),
            Subject(name="Engineering Physics", code="PH101", semester_id=sem1.id, hours_per_week=3, credit_hours=3),
            Subject(name="Programming in C", code="CS101", semester_id=sem1.id, hours_per_week=3, credit_hours=3),
            Subject(name="C Programming Lab", code="CS101L", semester_id=sem1.id, hours_per_week=2, credit_hours=1, is_lab=True, lab_hours=2),
            Subject(name="Basic Electronics", code="EC101", semester_id=sem1.id, hours_per_week=3, credit_hours=3),
            # Sem 3
            Subject(name="Data Structures", code="CS301", semester_id=sem3.id, hours_per_week=4, credit_hours=4),
            Subject(name="Database Management", code="CS302", semester_id=sem3.id, hours_per_week=3, credit_hours=3),
            Subject(name="Operating Systems", code="CS303", semester_id=sem3.id, hours_per_week=3, credit_hours=3),
            Subject(name="DS Lab", code="CS301L", semester_id=sem3.id, hours_per_week=2, credit_hours=1, is_lab=True, lab_hours=2),
            Subject(name="DBMS Lab", code="CS302L", semester_id=sem3.id, hours_per_week=2, credit_hours=1, is_lab=True, lab_hours=2),
        ]
        for s in subjects_data:
            db.add(s)
        await db.flush()

        # ── Classrooms ────────────────────────────────────────────────────────
        classrooms_data = [
            Classroom(name="Room 101", building="Block A", room_number="101", capacity=60, has_projector=True),
            Classroom(name="Room 102", building="Block A", room_number="102", capacity=60, has_projector=True),
            Classroom(name="Room 201", building="Block B", room_number="201", capacity=80, has_projector=True, has_ac=True),
            Classroom(name="Room 202", building="Block B", room_number="202", capacity=80, has_projector=True, has_ac=True),
            Classroom(name="CS Lab 1", building="Block C", room_number="301", capacity=40, is_lab=True, lab_type="Computer Lab"),
            Classroom(name="CS Lab 2", building="Block C", room_number="302", capacity=40, is_lab=True, lab_type="Computer Lab"),
            Classroom(name="Electronics Lab", building="Block D", room_number="401", capacity=30, is_lab=True, lab_type="Electronics Lab"),
        ]
        for r in classrooms_data:
            db.add(r)
        await db.flush()

        # ── Faculty Profiles ──────────────────────────────────────────────────
        faculty_profiles = [
            Faculty(user_id=faculty_users[0].id, employee_id="EMP001", department_id=cse.id, designation="Professor", max_hours_per_week=20),
            Faculty(user_id=faculty_users[1].id, employee_id="EMP002", department_id=cse.id, designation="Associate Professor", max_hours_per_week=18),
            Faculty(user_id=faculty_users[2].id, employee_id="EMP003", department_id=cse.id, designation="Assistant Professor", max_hours_per_week=18),
            Faculty(user_id=faculty_users[3].id, employee_id="EMP004", department_id=ece.id, designation="Associate Professor", max_hours_per_week=18),
            Faculty(user_id=faculty_users[4].id, employee_id="EMP005", department_id=cse.id, designation="Assistant Professor", max_hours_per_week=16),
        ]
        for f in faculty_profiles:
            db.add(f)
        await db.flush()

        # ── Faculty-Subject Assignments ───────────────────────────────────────
        # subjects_data indices: 0=Math, 1=Physics, 2=ProgC, 3=ProgCLab, 4=BasicElec, 5=DS, 6=DBMS, 7=OS, 8=DSLab, 9=DBMSLab
        fs_assignments = [
            FacultySubject(faculty_id=faculty_profiles[0].id, subject_id=subjects_data[0].id),  # Rajesh -> Math
            FacultySubject(faculty_id=faculty_profiles[3].id, subject_id=subjects_data[1].id),  # Meena -> Physics
            FacultySubject(faculty_id=faculty_profiles[1].id, subject_id=subjects_data[2].id),  # Priya -> ProgC
            FacultySubject(faculty_id=faculty_profiles[1].id, subject_id=subjects_data[3].id),  # Priya -> ProgCLab
            FacultySubject(faculty_id=faculty_profiles[3].id, subject_id=subjects_data[4].id),  # Meena -> BasicElec
            FacultySubject(faculty_id=faculty_profiles[2].id, subject_id=subjects_data[5].id),  # Arun -> DS
            FacultySubject(faculty_id=faculty_profiles[4].id, subject_id=subjects_data[6].id),  # Suresh -> DBMS
            FacultySubject(faculty_id=faculty_profiles[0].id, subject_id=subjects_data[7].id),  # Rajesh -> OS
            FacultySubject(faculty_id=faculty_profiles[2].id, subject_id=subjects_data[8].id),  # Arun -> DSLab
            FacultySubject(faculty_id=faculty_profiles[4].id, subject_id=subjects_data[9].id),  # Suresh -> DBMSLab
        ]
        for fs in fs_assignments:
            db.add(fs)

        # ── Students ──────────────────────────────────────────────────────────
        for i, su in enumerate(student_users):
            section = "A" if i < 5 else "B"
            student = Student(
                user_id=su.id,
                roll_number=f"CSE2024{i+1:03d}",
                semester_id=sem1.id,
                section=section,
            )
            db.add(student)

        await db.commit()
        print("Database seeded successfully!")
        print("\nDefault Credentials:")
        print("  Admin:   admin@smartclass.edu / admin123")
        print("  Faculty: rajesh@smartclass.edu / faculty123")
        print("  Student: student01@smartclass.edu / student123")


if __name__ == "__main__":
    asyncio.run(seed())
