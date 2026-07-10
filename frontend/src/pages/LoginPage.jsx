import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'
import { BookOpen, Lock, Mail, Eye, EyeOff, Cpu, Shield, UserCheck } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [selectedRole, setSelectedRole] = useState('admin') // 'admin', 'faculty', 'student'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await authAPI.login(form.email, form.password)
      // Set the token first so that request interceptor can read it
      setAuth(data.access_token, data.refresh_token, null)
      // Now fetch user info
      const { data: user } = await authAPI.me()

      // Validate that the user role matches the selected role
      if (user.role !== selectedRole) {
        toast.error(
          `Wrong portal selected! Your account is a "${user.role}" account. Please click the "${user.role}" tab above and try again.`,
          { duration: 6000 }
        )
        setAuth(null, null, null)
        setSelectedRole(user.role) // Auto-switch to the correct tab
        return
      }

      // Save full user info
      setAuth(data.access_token, data.refresh_token, user)
      toast.success(`Welcome back, ${user.full_name}!`)
      if (user.role === 'admin') navigate('/admin')
      else if (user.role === 'faculty') navigate('/faculty')
      else navigate('/student')
    } catch (err) {
      const message = err.response?.data?.detail || 'Login failed. Please check your email and password.'
      toast.error(message, { duration: 5000 })
      setAuth(null, null, null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-mesh relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="w-full max-w-md animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 mb-4 shadow-glow-lg">
            <Cpu className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold gradient-text">SmartClass</h1>
          <p className="text-slate-400 text-sm mt-1">AI-Powered Timetable Scheduler</p>
        </div>

        {/* Card */}
        <div className="card-glass p-8">
          {/* Role selector tabs */}
          <div className="flex bg-slate-900/60 p-1 rounded-xl mb-6 border border-slate-700/30">
            {['admin', 'faculty', 'student'].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRole(role)}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg capitalize transition-all duration-200 ${
                  selectedRole === role
                    ? 'bg-primary-600 text-white shadow-glow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          {/* Heading */}
          <div className="flex items-center gap-3 mb-6 border-b border-slate-700/30 pb-4">
            <div className="p-2 rounded-lg bg-primary-500/10 text-primary-400 border border-primary-500/20">
              {selectedRole === 'admin' && <Shield className="w-5 h-5" />}
              {selectedRole === 'faculty' && <UserCheck className="w-5 h-5" />}
              {selectedRole === 'student' && <BookOpen className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white capitalize">{selectedRole} Portal</h2>
              <p className="text-xs text-slate-400">
                {selectedRole === 'admin' && 'Access timetables, classrooms & generator'}
                {selectedRole === 'faculty' && 'Manage schedules & availability slots'}
                {selectedRole === 'student' && 'Access student timetables & schedules'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  className="input pl-10"
                  placeholder="you@institution.edu"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full justify-center py-3" disabled={loading}>
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Authenticating...' : `Sign In to ${selectedRole} Portal`}
            </button>

            {/* Credential hints */}
            <div className="mt-4 p-3 rounded-lg bg-slate-900/60 border border-slate-700/30">
              <p className="text-xs text-slate-500 font-medium mb-1.5">🔑 Default Credentials</p>
              {selectedRole === 'admin' && (
                <p className="text-xs text-slate-400 font-mono">admin@smartclass.edu / admin123</p>
              )}
              {selectedRole === 'faculty' && (
                <p className="text-xs text-slate-400 font-mono">rajesh@smartclass.edu / faculty123</p>
              )}
              {selectedRole === 'student' && (
                <p className="text-xs text-slate-400 font-mono">student01@smartclass.edu / student123</p>
              )}
            </div>
          </form>

        </div>

        {/* System info */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-4 text-xs text-slate-600">
            <span className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> System Online
            </span>
            <span>Version 1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  )
}
