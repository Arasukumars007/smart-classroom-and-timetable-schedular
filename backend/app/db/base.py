from app.db.base_class import Base


# Import all models here so Alembic can discover them
from app.models.user import User  # noqa
from app.models.department import Department  # noqa
from app.models.course import Course  # noqa
from app.models.semester import Semester  # noqa
from app.models.subject import Subject  # noqa
from app.models.classroom import Classroom  # noqa
from app.models.faculty import Faculty, FacultySubject, FacultyAvailability  # noqa
from app.models.student import Student  # noqa
from app.models.timetable import TimetableSlot  # noqa
from app.models.notification import Notification  # noqa
