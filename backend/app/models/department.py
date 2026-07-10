from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    description = Column(String(500), nullable=True)
    head_faculty_id = Column(Integer, ForeignKey("faculty.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    courses = relationship("Course", back_populates="department")
    faculty_members = relationship("Faculty", back_populates="department", foreign_keys="Faculty.department_id")
    head_faculty = relationship("Faculty", foreign_keys=[head_faculty_id])
