import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor: inject JWT
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor: handle 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ─── Auth ───────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
}

// ─── Users (Admin) ──────────────────────────────────────────────────────────
export const userAPI = {
  listAdmins: () => api.get('/users/admins'),
  createAdmin: (data) => api.post('/users/admins', data),
  updateAdmin: (id, data) => api.put(`/users/admins/${id}`, data),
  deleteAdmin: (id) => api.delete(`/users/admins/${id}`),
}

// ─── Academic ────────────────────────────────────────────────────────────────
export const departmentAPI = {
  list: () => api.get('/academic/departments'),
  create: (data) => api.post('/academic/departments', data),
  update: (id, data) => api.put(`/academic/departments/${id}`, data),
  delete: (id) => api.delete(`/academic/departments/${id}`),
}

export const courseAPI = {
  list: () => api.get('/academic/courses'),
  create: (data) => api.post('/academic/courses', data),
  update: (id, data) => api.put(`/academic/courses/${id}`, data),
  delete: (id) => api.delete(`/academic/courses/${id}`),
}

export const semesterAPI = {
  list: (courseId) => api.get('/academic/semesters', { params: { course_id: courseId } }),
  create: (data) => api.post('/academic/semesters', data),
  update: (id, data) => api.put(`/academic/semesters/${id}`, data),
}

export const subjectAPI = {
  list: (semesterId) => api.get('/academic/subjects', { params: { semester_id: semesterId } }),
  create: (data) => api.post('/academic/subjects', data),
  update: (id, data) => api.put(`/academic/subjects/${id}`, data),
  delete: (id) => api.delete(`/academic/subjects/${id}`),
}

// ─── Resources ───────────────────────────────────────────────────────────────
export const classroomAPI = {
  list: () => api.get('/resources/classrooms'),
  create: (data) => api.post('/resources/classrooms', data),
  update: (id, data) => api.put(`/resources/classrooms/${id}`, data),
  delete: (id) => api.delete(`/resources/classrooms/${id}`),
}

export const facultyAPI = {
  list: (deptId) => api.get('/resources/faculty', { params: { department_id: deptId } }),
  create: (data) => api.post('/resources/faculty', data),
  update: (id, data) => api.put(`/resources/faculty/${id}`, data),
  delete: (id) => api.delete(`/resources/faculty/${id}`),
  assignSubject: (fId, sId) => api.post(`/resources/faculty/${fId}/subjects/${sId}`),
  removeSubject: (fId, sId) => api.delete(`/resources/faculty/${fId}/subjects/${sId}`),
  getAvailability: (id) => api.get(`/resources/faculty/${id}/availability`),
  setAvailability: (data) => api.post('/resources/faculty/availability', data),
}

export const studentAPI = {
  list: (semesterId) => api.get('/resources/students', { params: { semester_id: semesterId } }),
  create: (data) => api.post('/resources/students', data),
  update: (id, data) => api.put(`/resources/students/${id}`, data),
  delete: (id) => api.delete(`/resources/students/${id}`),
}

// ─── Timetable ────────────────────────────────────────────────────────────────
export const timetableAPI = {
  generate: (data) => api.post('/timetable/generate', data),
  getSlots: (params) => api.get('/timetable/slots', { params }),
  createSlot: (data) => api.post('/timetable/slots', data),
  updateSlot: (id, data) => api.put(`/timetable/slots/${id}`, data),
  deleteSlot: (id) => api.delete(`/timetable/slots/${id}`),
  getConflicts: (semesterId, section) =>
    api.get('/timetable/conflicts', { params: { semester_id: semesterId, section } }),
}

// ─── Analytics ───────────────────────────────────────────────────────────────
export const analyticsAPI = {
  overview: () => api.get('/analytics/overview'),
  classroomUtilization: () => api.get('/analytics/classroom-utilization'),
  facultyWorkload: () => api.get('/analytics/faculty-workload'),
  departmentSummary: () => api.get('/analytics/department-summary'),
}

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationAPI = {
  list: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
}

export default api
