import { useQuery } from '@tanstack/react-query'
import { timetableAPI, notificationAPI } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { Calendar, Clock, BookOpen, Bell, CheckCircle, MapPin, Users } from 'lucide-react'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8]
const PERIOD_TIMES = [
  '8:00–8:50', '8:55–9:45', '9:50–10:40', '10:45–11:35',
  '11:40–12:30', '1:15–2:05', '2:10–3:00', '3:05–3:55',
]

// 0=Mon, 1=Tue, ... — JS getDay() returns 0=Sun, so we offset
const todayIndex = () => {
  const d = new Date().getDay()
  return d === 0 || d === 6 ? 0 : d - 1  // weekdays only
}

export default function FacultyDashboard() {
  const { user } = useAuthStore()

  const { data: facultyList = [] } = useQuery({
    queryKey: ['faculty-list'],
    queryFn: () => import('../../services/api').then(m => m.facultyAPI.list().then(r => r.data)),
  })
  const facultyProfile = facultyList.find(f => f.user_id === user?.id)

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['faculty-timetable', facultyProfile?.id],
    queryFn: () => timetableAPI.getSlots({ faculty_id: facultyProfile.id }).then(r => r.data),
    enabled: !!facultyProfile?.id,
  })

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationAPI.list().then(r => r.data),
  })

  const slotMap = {}
  slots.forEach(s => { slotMap[`${s.day_of_week}-${s.period_number}`] = s })

  const today = todayIndex()
  const todaySlots = PERIODS.map(p => slotMap[`${today}-${p}`]).filter(Boolean)
  const totalClasses = slots.filter(s => !s.is_lab_continuation).length
  const uniqueSubjects = [...new Set(slots.map(s => s.subject_id).filter(Boolean))].length
  const unreadNotifs = notifications.filter(n => !n.is_read).length

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Teaching Dashboard</h1>
          <p className="section-subtitle">Welcome back, {user?.full_name}</p>
        </div>
        {unreadNotifs > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/20 border border-primary-500/30">
            <Bell className="w-4 h-4 text-primary-400" />
            <span className="text-sm text-primary-300">{unreadNotifs} new notification{unreadNotifs > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{totalClasses}</p>
            <p className="text-xs text-slate-500">Total Classes/Week</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-500/20 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-accent-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{uniqueSubjects}</p>
            <p className="text-xs text-slate-500">Subjects Teaching</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{facultyProfile?.max_hours_per_week ?? '—'}</p>
            <p className="text-xs text-slate-500">Max hrs/week</p>
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="card p-5">
        <h3 className="text-white font-medium mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary-400" />
          Today's Classes
          <span className="ml-auto text-xs text-slate-500">{DAYS[today]}</span>
        </h3>
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-slate-500">Loading schedule…</div>
        ) : todaySlots.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No classes scheduled today</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todaySlots.map(slot => (
              <div key={slot.id} className={`flex items-center gap-4 p-3 rounded-xl border ${slot.slot_type === 'lab' ? 'bg-accent-500/10 border-accent-500/25' : 'bg-primary-500/10 border-primary-500/25'}`}>
                <div className="text-xs text-slate-400 w-20 shrink-0 font-mono">{PERIOD_TIMES[slot.period_number - 1]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{slot.subject_name}</p>
                  <p className="text-xs text-slate-500 truncate">Sem {slot.semester_id} · Section {slot.section}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
                  <MapPin className="w-3 h-3" />
                  {slot.classroom_name || '—'}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${slot.slot_type === 'lab' ? 'bg-accent-500/20 text-accent-300' : 'bg-primary-500/20 text-primary-300'}`}>
                  {slot.slot_type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full Weekly Timetable */}
      <div className="card p-5">
        <h3 className="text-white font-medium mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary-400" /> Weekly Teaching Schedule
        </h3>
        <div className="overflow-x-auto rounded-xl border border-slate-700/50">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-800/80">
                <th className="px-3 py-2.5 text-left text-slate-400 font-semibold w-28">Period</th>
                {DAYS.map((d, i) => (
                  <th key={d} className={`px-2 py-2.5 text-left font-semibold ${i === today ? 'text-primary-400' : 'text-slate-400'}`}>
                    {d}{i === today ? ' ✦' : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map(p => (
                <tr key={p} className="border-t border-slate-700/30">
                  <td className="px-3 py-2 text-slate-500">
                    <div className="font-medium text-slate-300">P{p}</div>
                    <div className="text-slate-600">{PERIOD_TIMES[p - 1]}</div>
                  </td>
                  {DAYS.map((_, d) => {
                    const slot = slotMap[`${d}-${p}`]
                    if (!slot) {
                      return <td key={d} className="px-2 py-2"><div className="timetable-cell empty rounded-lg p-1.5 text-center text-slate-600">—</div></td>
                    }
                    if (slot.is_lab_continuation) {
                      return <td key={d} className="px-2 py-2"><div className="timetable-cell lab rounded-lg p-2 opacity-50 text-center text-xs text-slate-500 italic">↳ cont.</div></td>
                    }
                    return (
                      <td key={d} className="px-2 py-2">
                        <div className={`timetable-cell ${slot.slot_type} rounded-lg p-2`}>
                          <div className="font-semibold text-white truncate">{slot.subject_name}</div>
                          <div className="text-slate-400 truncate">Sec {slot.section}</div>
                          <div className="text-slate-500 truncate">{slot.classroom_name}</div>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
