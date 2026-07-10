from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    roll_number = Column(String(50), unique=True, nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.id"), nullable=False)
    section = Column(String(5), default="A")
    phone = Column(String(20), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="student_profile")
    semester = relationship("Semester", back_populates="students")
