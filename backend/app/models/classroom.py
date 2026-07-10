from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base


class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    building = Column(String(100), nullable=True)
    room_number = Column(String(20), nullable=True)
    capacity = Column(Integer, default=60)
    has_projector = Column(Boolean, default=True)
    has_ac = Column(Boolean, default=False)
    is_lab = Column(Boolean, default=False)
    lab_type = Column(String(50), nullable=True)  # e.g. "Computer Lab", "Physics Lab"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    timetable_slots = relationship("TimetableSlot", back_populates="classroom")
