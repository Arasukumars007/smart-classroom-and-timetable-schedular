from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base


class Semester(Base):
    __tablename__ = "semesters"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(Integer, nullable=False)  # 1-8
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    academic_year = Column(String(10), nullable=False)  # e.g. 2024-25
    sections = Column(String(50), default="A")  # comma-separated: A,B,C
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    course = relationship("Course", back_populates="semesters")
    subjects = relationship("Subject", back_populates="semester")
    students = relationship("Student", back_populates="semester")
    timetable_slots = relationship("TimetableSlot", back_populates="semester")
