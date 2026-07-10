import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// Auth
import LoginPage from './pages/LoginPage'

// Admin Pages
import AdminLayout from './components/layout/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import DepartmentsPage from './pages/admin/DepartmentsPage'
import CoursesPage from './pages/admin/CoursesPage'
import SubjectsPage from './pages/admin/SubjectsPage'
import ClassroomsPage from './pages/admin/ClassroomsPage'
import FacultyPage from './pages/admin/FacultyPage'
import StudentsPage from './pages/admin/StudentsPage'
import AdminsPage from './pages/admin/AdminsPage'
import TimetableGeneratorPage from './pages/admin/TimetableGeneratorPage'
import AnalyticsPage from './pages/admin/AnalyticsPage'

// Faculty Pages
import FacultyLayout from './components/layout/FacultyLayout'
import FacultyDashboard from './pages/faculty/FacultyDashboard'

// Student Pages
import StudentLayout from './components/layout/StudentLayout'
import StudentDashboard from './pages/student/StudentDashboard'

function ProtectedRoute({ children, allowedRoles }) {
  const { user, token } = useAuthStore()
  if (!token || !user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />
  }
  return children
}

function RoleRouter() {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin') return <Navigate to="/admin" replace />
  if (user.role === 'faculty') return <Navigate to="/faculty" replace />
  return <Navigate to="/student" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<RoleRouter />} />

        {/* Admin */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="departments" element={<DepartmentsPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="subjects" element={<SubjectsPage />} />
          <Route path="classrooms" element={<ClassroomsPage />} />
          <Route path="faculty" element={<FacultyPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="admins" element={<AdminsPage />} />
          <Route path="timetable" element={<TimetableGeneratorPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
        </Route>

        {/* Faculty */}
        <Route path="/faculty" element={
          <ProtectedRoute allowedRoles={['admin', 'faculty']}>
            <FacultyLayout />
          </ProtectedRoute>
        }>
          <Route index element={<FacultyDashboard />} />
        </Route>

        {/* Student */}
        <Route path="/student" element={
          <ProtectedRoute allowedRoles={['admin', 'faculty', 'student']}>
            <StudentLayout />
          </ProtectedRoute>
        }>
          <Route index element={<StudentDashboard />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
