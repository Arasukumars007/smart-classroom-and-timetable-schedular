from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    code = Column(String(20), nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.id"), nullable=False)
    hours_per_week = Column(Integer, default=3)
    credit_hours = Column(Integer, default=3)
    is_lab = Column(Boolean, default=False)
    lab_hours = Column(Integer, default=0)  # hours per lab session (consecutive)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    semester = relationship("Semester", back_populates="subjects")
    faculty_assignments = relationship("FacultySubject", back_populates="subject")
    timetable_slots = relationship("TimetableSlot", back_populates="subject")
