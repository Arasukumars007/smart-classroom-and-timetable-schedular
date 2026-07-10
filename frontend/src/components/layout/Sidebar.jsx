import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
  LayoutDashboard, Building2, BookOpen, BookMarked, DoorOpen,
  Users, GraduationCap, Calendar, BarChart3, Cpu, ChevronLeft, LogOut,
  Clock, CalendarDays, Shield
} from 'lucide-react'
import clsx from 'clsx'

const NAV = {
  admin: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/admin' },
    { label: 'Departments', icon: Building2, to: '/admin/departments' },
    { label: 'Courses', icon: BookOpen, to: '/admin/courses' },
    { label: 'Subjects', icon: BookMarked, to: '/admin/subjects' },
    { label: 'Classrooms', icon: DoorOpen, to: '/admin/classrooms' },
    { label: 'Faculty', icon: Users, to: '/admin/faculty' },
    { label: 'Students', icon: GraduationCap, to: '/admin/students' },
    { label: 'Admins', icon: Shield, to: '/admin/admins' },
    { label: 'Timetable', icon: Calendar, to: '/admin/timetable' },
    { label: 'Analytics', icon: BarChart3, to: '/admin/analytics' },
  ],
  faculty: [
    { label: 'My Schedule', icon: CalendarDays, to: '/faculty' },
  ],
  student: [
    { label: 'My Timetable', icon: CalendarDays, to: '/student' },
  ],
}

export default function Sidebar({ open, role }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!open) return null

  return (
    <aside className="w-64 h-screen bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow shrink-0">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-display font-bold text-white text-sm">SmartClass</p>
            <p className="text-xs text-slate-500 capitalize">{role} Portal</p>
          </div>
        </div>
      </div>

      {/* User */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {(NAV[role] || []).map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            end={to === `/${role}`}
            className={({ isActive }) =>
              clsx('sidebar-link', isActive && 'active')
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-slate-700/50">
        <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
