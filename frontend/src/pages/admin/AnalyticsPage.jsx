import { useQuery } from '@tanstack/react-query'
import { analyticsAPI } from '../../services/api'
import { BarChart3, Users, DoorOpen, GraduationCap, Cpu, TrendingUp, Activity, BookOpen } from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

// ─── Register ALL Chart.js components (required before any chart renders) ────
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
)

const CHART_OPTS = {
  responsive: true,
  plugins: {
    legend: {
      labels: { color: '#94a3b8', font: { size: 12 } },
    },
  },
  scales: {
    x: {
      ticks: { color: '#64748b', maxRotation: 30 },
      grid: { color: 'rgba(100,116,139,0.15)' },
    },
    y: {
      ticks: { color: '#64748b' },
      grid: { color: 'rgba(100,116,139,0.15)' },
    },
  },
}

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
        <p className="text-sm text-slate-400">{label}</p>
        {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const { data: overview } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => analyticsAPI.overview().then(r => r.data),
  })
  const { data: utilization } = useQuery({
    queryKey: ['classroom-utilization'],
    queryFn: () => analyticsAPI.classroomUtilization().then(r => r.data),
  })
  const { data: workload } = useQuery({
    queryKey: ['faculty-workload'],
    queryFn: () => analyticsAPI.facultyWorkload().then(r => r.data),
  })
  const { data: deptSummary } = useQuery({
    queryKey: ['department-summary'],
    queryFn: () => analyticsAPI.departmentSummary().then(r => r.data),
  })

  // ─── Classroom utilization bar chart data ──────────────────────────────────
  const utilizationData = {
    labels: utilization?.classrooms?.map(c => c.classroom_name) || [],
    datasets: [{
      label: 'Utilization %',
      data: utilization?.classrooms?.map(c => c.utilization_rate) || [],
      backgroundColor: utilization?.classrooms?.map(c =>
        c.utilization_rate > 70 ? 'rgba(239,68,68,0.75)' :
        c.utilization_rate > 40 ? 'rgba(245,158,11,0.75)' : 'rgba(99,102,241,0.75)'
      ) || [],
      borderColor: 'transparent',
      borderRadius: 6,
    }],
  }

  // ─── Faculty workload bar chart data ──────────────────────────────────────
  const workloadData = {
    labels: workload?.faculty?.map(f => f.faculty_name.split(' ').slice(-1)[0]) || [],
    datasets: [
      {
        label: 'Assigned Hours',
        data: workload?.faculty?.map(f => f.hours_assigned) || [],
        backgroundColor: 'rgba(99,102,241,0.75)',
        borderColor: 'transparent',
        borderRadius: 6,
      },
      {
        label: 'Max Allowed',
        data: workload?.faculty?.map(f => f.max_hours) || [],
        backgroundColor: 'rgba(217,70,239,0.3)',
        borderColor: 'rgba(217,70,239,0.7)',
        borderRadius: 6,
      },
    ],
  }

  // ─── Slot type doughnut chart ─────────────────────────────────────────────
  const slotTypeData = {
    labels: ['Theory', 'Lab', 'Free'],
    datasets: [{
      data: [
        overview?.theory_slots ?? 0,
        overview?.lab_slots ?? 0,
        Math.max(0, (overview?.total_slots ?? 0) - (overview?.theory_slots ?? 0) - (overview?.lab_slots ?? 0)),
      ],
      backgroundColor: ['rgba(99,102,241,0.8)', 'rgba(217,70,239,0.8)', 'rgba(100,116,139,0.4)'],
      borderWidth: 0,
    }],
  }

  // ─── Department faculty count doughnut ────────────────────────────────────
  const deptData = {
    labels: deptSummary?.departments?.map(d => d.department_code) || [],
    datasets: [{
      data: deptSummary?.departments?.map(d => d.faculty_count) || [],
      backgroundColor: [
        'rgba(99,102,241,0.8)', 'rgba(217,70,239,0.8)',
        'rgba(20,184,166,0.8)', 'rgba(245,158,11,0.8)', 'rgba(239,68,68,0.8)',
      ],
      borderWidth: 0,
    }],
  }

  const doughnutOpts = {
    responsive: true,
    plugins: {
      legend: { labels: { color: '#94a3b8', font: { size: 12 } } },
    },
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="section-title">Institutional Analytics</h1>
        <p className="section-subtitle">Resource allocation, efficiency tracking, and workload balance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Faculty Members" value={overview?.total_faculty} color="bg-primary-600" />
        <StatCard icon={GraduationCap} label="Students Enrolled" value={overview?.total_students} color="bg-accent-600" />
        <StatCard icon={DoorOpen} label="Classrooms" value={overview?.total_classrooms} color="bg-teal-600" />
        <StatCard
          icon={Activity}
          label="Efficiency Score"
          value={overview?.efficiency_score != null ? `${overview.efficiency_score}%` : '—'}
          color={overview?.efficiency_score > 70 ? "bg-emerald-600" : overview?.efficiency_score > 40 ? "bg-amber-600" : "bg-red-600"}
          sub="Slot fill rate"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classroom Utilization - wide */}
        <div className="lg:col-span-2 card p-5">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <DoorOpen className="w-5 h-5 text-primary-400" />
            Classroom Utilization
            <span className="ml-auto text-xs text-slate-500 flex gap-3">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />High (&gt;70%)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />Medium</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />Low</span>
            </span>
          </h3>
          <Bar data={utilizationData} options={CHART_OPTS} />
        </div>

        {/* Slot Distribution */}
        <div className="card p-5">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-accent-400" />
            Slot Distribution
          </h3>
          <Doughnut data={slotTypeData} options={doughnutOpts} />
          <div className="mt-4 grid grid-cols-3 text-center text-xs gap-2">
            <div className="rounded-lg bg-primary-500/10 p-2">
              <p className="text-white font-bold">{overview?.theory_slots ?? 0}</p>
              <p className="text-slate-500">Theory</p>
            </div>
            <div className="rounded-lg bg-accent-500/10 p-2">
              <p className="text-white font-bold">{overview?.lab_slots ?? 0}</p>
              <p className="text-slate-500">Lab</p>
            </div>
            <div className="rounded-lg bg-slate-700/30 p-2">
              <p className="text-white font-bold">{overview?.total_slots ?? 0}</p>
              <p className="text-slate-500">Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Faculty Workload */}
        <div className="lg:col-span-2 card p-5">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-accent-400" />
            Faculty Workload
          </h3>
          <Bar data={workloadData} options={CHART_OPTS} />
        </div>

        {/* Department Distribution */}
        <div className="card p-5">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-400" />
            Faculty by Department
          </h3>
          <Doughnut data={deptData} options={doughnutOpts} />
          <div className="mt-4 space-y-2">
            {deptSummary?.departments?.map(d => (
              <div key={d.department_id} className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{d.department_name}</span>
                <span className="text-white font-medium">{d.faculty_count} faculty</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Classroom Detail Table */}
      {utilization?.classrooms?.length > 0 && (
        <div className="card p-5">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-400" />
            Classroom Detail
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left py-2 px-3 text-slate-400 font-semibold">Room</th>
                  <th className="text-left py-2 px-3 text-slate-400 font-semibold">Building</th>
                  <th className="text-left py-2 px-3 text-slate-400 font-semibold">Capacity</th>
                  <th className="text-left py-2 px-3 text-slate-400 font-semibold">Type</th>
                  <th className="text-left py-2 px-3 text-slate-400 font-semibold">Slots Used</th>
                  <th className="text-left py-2 px-3 text-slate-400 font-semibold">Utilization</th>
                  <th className="text-left py-2 px-3 text-slate-400 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {utilization.classrooms.map(c => (
                  <tr key={c.classroom_id} className="border-b border-slate-700/30 hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 text-white font-medium">{c.classroom_name}</td>
                    <td className="py-2.5 px-3 text-slate-400">{c.building || '—'}</td>
                    <td className="py-2.5 px-3 text-slate-400">{c.capacity}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.is_lab ? 'bg-accent-500/20 text-accent-300' : 'bg-primary-500/20 text-primary-300'}`}>
                        {c.is_lab ? 'Lab' : 'Theory'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{c.slots_used}/{c.total_possible}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 rounded-full bg-slate-700">
                          <div
                            className={`h-1.5 rounded-full ${c.utilization_rate > 70 ? 'bg-red-500' : c.utilization_rate > 40 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                            style={{ width: `${Math.min(c.utilization_rate, 100)}%` }}
                          />
                        </div>
                        <span className="text-slate-300 text-xs">{c.utilization_rate}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        c.status === 'High' ? 'bg-red-500/20 text-red-400' :
                        c.status === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>{c.status}</span>
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
