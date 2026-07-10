# API Documentation

The RESTful API is built with FastAPI. Interactive documentation is available locally via:
- Swagger UI: [http://localhost:8000/api/docs](http://localhost:8000/api/docs)
- ReDoc: [http://localhost:8000/api/redoc](http://localhost:8000/api/redoc)

## Core Endpoints

### Authentication
- `POST /api/v1/auth/login` - Authenticate user, returns access and refresh JWT tokens.
- `POST /api/v1/auth/register` - Create a new user account.
- `POST /api/v1/auth/refresh` - Refresh active access token.
- `GET /api/v1/auth/me` - Get profile details of the currently authenticated user.

### Academic Management
- `GET /api/v1/academic/departments` - List all departments.
- `POST /api/v1/academic/departments` - Create a department (Admin only).
- `GET /api/v1/academic/courses` - List all courses.
- `GET /api/v1/academic/semesters` - List semesters.
- `GET /api/v1/academic/subjects` - List subjects filtered by semester.

### Resource Allocation
- `GET /api/v1/resources/classrooms` - List all classrooms.
- `POST /api/v1/resources/classrooms` - Add a classroom.
- `GET /api/v1/resources/faculty` - List all faculty members.
- `POST /api/v1/resources/faculty/availability` - Set faculty availability slots.

### Timetable Scheduler
- `POST /api/v1/timetable/generate` - Generate conflict-free timetable slots using AI CSP or Genetic algorithms.
- `GET /api/v1/timetable/slots` - Query slots filtered by faculty, semester, or classroom.
- `GET /api/v1/timetable/conflicts` - Audit timetable for double-bookings.

### Analytics
- `GET /api/v1/analytics/overview` - Fetch counts and institutional efficiency.
- `GET /api/v1/analytics/classroom-utilization` - Fetch utilization percentage for each room.
- `GET /api/v1/analytics/faculty-workload` - Fetch teaching workload per instructor.
