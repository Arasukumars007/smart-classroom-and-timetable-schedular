import { useQuery } from '@tanstack/react-query'
import { analyticsAPI } from '../../services/api'
import {
  Users, BookOpen, DoorOpen, GraduationCap, Calendar,
  TrendingUp, Activity, Zap, BarChart2, Clock
} from 'lucide-react'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title,
  Tooltip, Legend, ArcElement, PointElement, LineElement
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement)

const CHART_OPTS = {
  responsive: true,
  plugins: { legend: { labels: { color: '#94a3b8', font: { size: 12 } } } },
  scales: {
    x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(99,102,241,0.08)' } },
    y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(99,102,241,0.08)' } },
  },
}

function StatCard({ icon: Icon, label, value, sub, color, gradient }) {
  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{label}</p>
          <p className={`text-3xl font-display font-bold mt-1 ${gradient || 'text-white'}`}>{value ?? '—'}</p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="mt-4 progress">
        <div className="progress-bar" style={{ width: '60%' }} />
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { data: overview } = useQuery({ queryKey: ['analytics-overview'], queryFn: () => analyticsAPI.overview().then(r => r.data) })
  const { data: utilization } = useQuery({ queryKey: ['classroom-utilization'], queryFn: () => analyticsAPI.classroomUtilization().then(r => r.data) })
  const { data: workload } = useQuery({ queryKey: ['faculty-workload'], queryFn: () => analyticsAPI.facultyWorkload().then(r => r.data) })

  const classroomChartData = {
    labels: utilization?.classrooms?.slice(0, 8).map(c => c.classroom_name) || [],
    datasets: [{
      label: 'Utilization %',
      data: utilization?.classrooms?.slice(0, 8).map(c => c.utilization_rate) || [],
      backgroundColor: 'rgba(99,102,241,0.7)',
      borderColor: '#6366f1',
      borderWidth: 1,
      borderRadius: 6,
    }],
  }

  const workloadChartData = {
    labels: workload?.faculty?.slice(0, 6).map(f => f.faculty_name?.split(' ').slice(-1)[0]) || [],
    datasets: [
      {
        label: 'Assigned Hours',
        data: workload?.faculty?.slice(0, 6).map(f => f.hours_assigned) || [],
        backgroundColor: 'rgba(217,70,239,0.7)',
        borderRadius: 6,
      },
      {
        label: 'Max Hours',
        data: workload?.faculty?.slice(0, 6).map(f => f.max_hours) || [],
        backgroundColor: 'rgba(99,102,241,0.3)',
        borderRadius: 6,
      },
    ],
  }

  const slotTypeData = {
    labels: ['Theory', 'Lab', 'Free'],
    datasets: [{
      data: [overview?.theory_slots || 0, overview?.lab_slots || 0, 40],
      backgroundColor: ['rgba(99,102,241,0.8)', 'rgba(217,70,239,0.8)', 'rgba(51,65,85,0.8)'],
      borderColor: ['#6366f1', '#d946ef', '#334155'],
      borderWidth: 2,
    }],
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="section-title">Admin Dashboard</h1>
        <p className="section-subtitle">System overview and real-time analytics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Faculty" value={overview?.total_faculty} sub="Teaching staff" color="bg-primary-600" />
        <StatCard icon={GraduationCap} label="Students" value={overview?.total_students} sub="Enrolled" color="bg-accent-600" />
        <StatCard icon={DoorOpen} label="Classrooms" value={overview?.total_classrooms} sub="Active rooms" color="bg-emerald-600" />
        <StatCard icon={Calendar} label="Total Slots" value={overview?.total_slots} sub="Timetable slots" color="bg-amber-600" />
      </div>

      {/* Efficiency Banner */}
      <div className="card p-5 flex items-center gap-4 border-primary-500/30">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-slate-400">Timetable Efficiency Score</p>
          <p className="text-2xl font-display font-bold gradient-text">{overview?.efficiency_score ?? 0}%</p>
        </div>
        <div className="w-48 progress">
          <div className="progress-bar h-3" style={{ width: `${overview?.efficiency_score || 0}%` }} />
        </div>
        <div className="text-right">
          <span className={`badge ${(overview?.efficiency_score || 0) > 70 ? 'badge-success' : 'badge-warning'}`}>
            {(overview?.efficiency_score || 0) > 70 ? 'Excellent' : 'Needs Improvement'}
          </span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Classroom Utilization */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-white">Classroom Utilization</h3>
              <p className="text-xs text-slate-500">Usage rate per classroom</p>
            </div>
            <BarChart2 className="w-5 h-5 text-primary-400" />
          </div>
          <Bar data={classroomChartData} options={CHART_OPTS} height={180} />
        </div>

        {/* Slot Distribution */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-white">Slot Distribution</h3>
              <p className="text-xs text-slate-500">Theory vs Lab</p>
            </div>
            <Activity className="w-5 h-5 text-accent-400" />
          </div>
          <Doughnut
            data={slotTypeData}
            options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 } } } } }}
          />
        </div>
      </div>

      {/* Faculty Workload */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-semibold text-white">Faculty Workload</h3>
            <p className="text-xs text-slate-500">Assigned vs Maximum hours per week</p>
          </div>
          <TrendingUp className="w-5 h-5 text-emerald-400" />
        </div>
        <Bar data={workloadChartData} options={{ ...CHART_OPTS, plugins: { legend: { labels: { color: '#94a3b8' } } } }} height={120} />
      </div>

      {/* Classroom Utilization Table */}
      {utilization?.classrooms && (
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-slate-700/50">
            <h3 className="font-display font-semibold text-white">Classroom Status</h3>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Classroom</th>
                  <th>Building</th>
                  <th>Capacity</th>
                  <th>Slots Used</th>
                  <th>Utilization</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {utilization.classrooms.map(c => (
                  <tr key={c.classroom_id}>
                    <td className="font-medium text-white">{c.classroom_name}</td>
                    <td className="text-slate-400">{c.building || '—'}</td>
                    <td>{c.capacity}</td>
                    <td>{c.slots_used}/{c.total_possible}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-20 progress">
                          <div className="progress-bar h-1.5" style={{ width: `${c.utilization_rate}%` }} />
                        </div>
                        <span className="text-xs">{c.utilization_rate}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${c.status === 'High' ? 'badge-success' : c.status === 'Medium' ? 'badge-warning' : 'badge-info'}`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
