# 🎓 Smart Classroom & Timetable Scheduler

An AI-powered, constraint-based timetable scheduling and smart classroom management system for educational institutions.

## ✨ Features

- **Automated Conflict-Free Timetable Generation** — Constraint-based scheduling engine
- **Smart Classroom Allocation** — Capacity, projector, and lab room tracking
- **Role-Based Portals** — Separate interfaces for Admins, Faculty, and Students
- **Analytics Dashboards** — Classroom utilization, faculty workload, department summaries
- **Export Schedules** — Download timetables as PDF or Excel

---

## 🔑 Default Login Credentials

> **Important:** On the login page, select the correct **tab** (Admin / Faculty / Student) before signing in.

| Role    | Email                          | Password     |
|---------|--------------------------------|--------------|
| Admin   | `admin@smartclass.edu`         | `admin123`   |
| Faculty | `rajesh@smartclass.edu`        | `faculty123` |
| Student | `student01@smartclass.edu`     | `student123` |

---

## 🚀 How to Run (Local Development — Windows)

This project has two parts that must **both** be running at the same time:
- **Backend** (FastAPI) → runs on `http://localhost:8000`
- **Frontend** (React + Vite) → runs on `http://localhost:3000`

Open **two separate terminals** (PowerShell or Command Prompt) and follow the steps below.

---

### Prerequisites

Make sure the following are installed on your Windows machine:

| Tool | Minimum Version | Download |
|------|-----------------|----------|
| Python | 3.10+ | https://www.python.org/downloads/ |
| Node.js | 18+ | https://nodejs.org/ |
| npm | 8+ | Included with Node.js |

Verify your versions by running:
```powershell
python --version
node --version
npm --version
```

---

### Terminal 1 — Backend Setup (First-time only, then Step 4 every time)

**Step 1 — Open a terminal and go to the backend folder:**
```powershell
cd "c:\Users\Mr.Arasu Kumar.S\OneDrive\Documents\Project\SMART CLASSROOM AND TIMETABLE SCHEDULAR\backend"
```

**Step 2 — Create and activate a Python virtual environment:**
```powershell
python -m venv venv
.\venv\Scripts\activate
```
> You should see `(venv)` appear at the start of your prompt.

**Step 3 — Install Python dependencies:**
```powershell
pip install -r requirements.txt
```

**Step 3b — Set up the database and seed sample data (first time only):**
```powershell
.\venv\Scripts\alembic.exe upgrade head
.\venv\Scripts\python.exe seed_data.py
```
> This creates the SQLite database and adds sample users, departments, courses, and classrooms.

**Step 4 — Start the backend server:**
```powershell
.\venv\Scripts\activate
.\venv\Scripts\uvicorn.exe app.main:app --reload --port 8000
```
> ✅ Backend is ready when you see: `Application startup complete.`
> 
> API Docs available at: http://localhost:8000/api/docs

---

### Terminal 2 — Frontend Setup (First-time only, then Step 2 every time)

**Step 1 — Open a NEW terminal and go to the frontend folder:**
```powershell
cd "c:\Users\Mr.Arasu Kumar.S\OneDrive\Documents\Project\SMART CLASSROOM AND TIMETABLE SCHEDULAR\frontend"
```

**Step 1b — Install Node packages (first time only):**
```powershell
npm install
```

**Step 2 — Start the frontend dev server:**
```powershell
npm run dev
```
> ✅ Frontend is ready when you see: `Local: http://localhost:3000/`

---

### ✅ Open the App

Once **both** terminals are running, open your browser and go to:

**http://localhost:3000**

Log in using any of the credentials from the table above.

---

## 🐳 Quick Start with Docker (Alternative)

If you have **Docker Desktop** installed, you can run everything with a single command.

**Step 1 — Go to the project root:**
```powershell
cd "c:\Users\Mr.Arasu Kumar.S\OneDrive\Documents\Project\SMART CLASSROOM AND TIMETABLE SCHEDULAR"
```

**Step 2 — Build and start all services:**
```powershell
docker-compose up --build -d
```

**Step 3 — Access the app:**
- Web App: http://localhost:3000
- API Docs: http://localhost:8000/api/docs

**To stop Docker services:**
```powershell
docker-compose down
```

---

## 📁 Project Structure

```
SMART CLASSROOM AND TIMETABLE SCHEDULAR/
├── backend/                  # FastAPI Python backend
│   ├── app/
│   │   ├── api/v1/endpoints/ # Route handlers (auth, academic, resources, timetable)
│   │   ├── core/             # Config, security, dependencies
│   │   ├── db/               # Database session and base
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   └── main.py           # FastAPI app entry point
│   ├── alembic/              # Database migrations
│   ├── seed_data.py          # Sample data seeder
│   ├── requirements.txt      # Python dependencies
│   └── .env                  # Environment variables (DB, JWT secret, CORS)
│
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── pages/            # Login, Admin, Faculty, Student pages
│   │   ├── components/       # Reusable UI components
│   │   ├── services/api.js   # Axios API client
│   │   └── store/            # Zustand global state
│   └── package.json
│
├── docker-compose.yml        # Docker orchestration
└── README.md
```

---

## 🛠️ Troubleshooting

### ❌ "Invalid credentials" on login
- Make sure the **correct tab** (Admin / Faculty / Student) is selected on the login page.
- Make sure you ran `seed_data.py` (Step 3b above).

### ❌ Backend fails to start — port already in use
```powershell
# Find and kill the process using port 8000
netstat -ano | findstr :8000
taskkill /PID <PID_NUMBER> /F
```

### ❌ Frontend can't reach the backend (network errors)
- Confirm the backend is running on port `8000`.
- The Vite dev server proxies all `/api` requests to `http://localhost:8000` automatically.

### ❌ `venv\Scripts\activate` is not recognized
Run this first in PowerShell to allow script execution:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### ❌ Database errors after code changes
```powershell
# Re-run migrations
.\venv\Scripts\alembic.exe upgrade head
```
