from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Time
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base


class Faculty(Base):
    __tablename__ = "faculty"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    employee_id = Column(String(50), unique=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    designation = Column(String(100), default="Assistant Professor")
    max_hours_per_week = Column(Integer, default=18)
    phone = Column(String(20), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="faculty_profile")
    department = relationship("Department", back_populates="faculty_members", foreign_keys=[department_id])
    subject_assignments = relationship("FacultySubject", back_populates="faculty")
    availability = relationship("FacultyAvailability", back_populates="faculty")
    timetable_slots = relationship("TimetableSlot", back_populates="faculty")


class FacultySubject(Base):
    """Maps which faculty teaches which subject."""
    __tablename__ = "faculty_subjects"

    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(Integer, ForeignKey("faculty.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)

    faculty = relationship("Faculty", back_populates="subject_assignments")
    subject = relationship("Subject", back_populates="faculty_assignments")


class FacultyAvailability(Base):
    """Faculty availability windows per day of week."""
    __tablename__ = "faculty_availability"

    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(Integer, ForeignKey("faculty.id"), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Monday ... 4=Friday
    start_period = Column(Integer, nullable=False, default=1)  # Period number
    end_period = Column(Integer, nullable=False, default=8)
    is_available = Column(Boolean, default=True)

    faculty = relationship("Faculty", back_populates="availability")
