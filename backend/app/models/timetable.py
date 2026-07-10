from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base


class TimetableSlot(Base):
    __tablename__ = "timetable_slots"

    id = Column(Integer, primary_key=True, index=True)
    semester_id = Column(Integer, ForeignKey("semesters.id"), nullable=False)
    section = Column(String(5), nullable=False)
    day_of_week = Column(Integer, nullable=False)   # 0=Mon, 1=Tue,...4=Fri
    period_number = Column(Integer, nullable=False)  # 1-8
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)
    faculty_id = Column(Integer, ForeignKey("faculty.id"), nullable=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"), nullable=True)
    slot_type = Column(String(20), default="theory")  # theory | lab | free
    is_lab_continuation = Column(Boolean, default=False)
    academic_year = Column(String(10), nullable=False, default="2024-25")
    generated_by = Column(String(20), default="manual")  # csp | genetic | manual
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    semester = relationship("Semester", back_populates="timetable_slots")
    subject = relationship("Subject", back_populates="timetable_slots")
    faculty = relationship("Faculty", back_populates="timetable_slots")
    classroom = relationship("Classroom", back_populates="timetable_slots")
