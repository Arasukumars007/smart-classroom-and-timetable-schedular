import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { facultyAPI, departmentAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Users, Search, GraduationCap, Calendar } from 'lucide-react'

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-display font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg text-slate-400">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function FacultyPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ employee_id: '', department_id: '', designation: 'Assistant Professor', max_hours_per_week: 18, phone: '', full_name: '', email: '', password: 'faculty123' })

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentAPI.list().then(r => r.data),
  })

  const { data: faculty = [], isLoading } = useQuery({
    queryKey: ['faculty'],
    queryFn: () => facultyAPI.list().then(r => r.data),
  })

  const createMut = useMutation({
    mutationFn: async (payload) => {
      // Single unified endpoint: creates User + Faculty in one transaction
      return facultyAPI.create({
        full_name: payload.full_name,
        email: payload.email,
        password: payload.password,
        employee_id: payload.employee_id,
        department_id: Number(payload.department_id),
        designation: payload.designation,
        max_hours_per_week: Number(payload.max_hours_per_week),
        phone: payload.phone || null,
      })
    },
    onSuccess: () => { qc.invalidateQueries(['faculty']); toast.success('Faculty added!'); setModal(null) },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to add faculty'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => facultyAPI.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['faculty']); toast.success('Profile updated!'); setModal(null) },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to update profile'),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => facultyAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries(['faculty']); toast.success('Faculty deleted') },
  })

  const openCreate = () => {
    setForm({ employee_id: '', department_id: departments[0]?.id || '', designation: 'Assistant Professor', max_hours_per_week: 18, phone: '', full_name: '', email: '', password: 'faculty123' })
    setModal('create')
  }

  const openEdit = (f) => {
    setForm({ employee_id: f.employee_id, department_id: f.department_id, designation: f.designation, max_hours_per_week: f.max_hours_per_week, phone: f.phone || '', full_name: f.full_name || '', email: f.email || '', password: '' })
    setModal(f)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (modal === 'create') createMut.mutate(form)
    else updateMut.mutate({ id: modal.id, data: { designation: form.designation, max_hours_per_week: Number(form.max_hours_per_week), phone: form.phone, department_id: Number(form.department_id) } })
  }

  const filtered = faculty.filter(f =>
    f.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    f.employee_id.toLowerCase().includes(search.toLowerCase())
  )

  const getDeptCode = (deptId) => {
    return departments.find(d => d.id === deptId)?.code || '—'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Faculty</h1>
          <p className="section-subtitle">{faculty.length} faculty members registered</p>
        </div>
        <button onClick={openCreate} className="btn-primary" disabled={departments.length === 0}>
          <Plus className="w-4 h-4" /> Add Faculty
        </button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input className="input pl-9" placeholder="Search faculty..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Max Hours</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-500"><span className="spinner" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-500">No faculty members found</td></tr>
              ) : filtered.map((f) => (
                <tr key={f.id}>
                  <td><span className="badge-primary">{f.employee_id}</span></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center text-white text-xs font-bold">
                        {f.full_name?.charAt(0) || 'F'}
                      </div>
                      <div>
                        <p className="font-medium text-white">{f.full_name}</p>
                        <p className="text-xs text-slate-500">{f.email}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge-info">{getDeptCode(f.department_id)}</span></td>
                  <td>{f.designation}</td>
                  <td>{f.max_hours_per_week} hrs/wk</td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEdit(f)} className="btn-ghost p-1.5 rounded-lg text-slate-400 hover:text-primary-400">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { if (confirm('Delete this faculty profile?')) deleteMut.mutate(f.id) }}
                        className="btn-ghost p-1.5 rounded-lg text-slate-400 hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal !== null && (
        <Modal title={modal === 'create' ? 'Add Faculty Profile' : 'Edit Faculty Profile'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {modal === 'create' && (
              <>
                <div>
                  <label className="label">Full Name *</label>
                  <input className="input" required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="e.g. Dr. Rajesh Kumar" />
                </div>
                <div>
                  <label className="label">Email Address *</label>
                  <input className="input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="rajesh@institution.edu" />
                </div>
                <div>
                  <label className="label">Portal Password *</label>
                  <input className="input" type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                </div>
              </>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Employee ID *</label>
                <input className="input" required value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value.toUpperCase() })} placeholder="EMP001" disabled={modal !== 'create'} />
              </div>
              <div>
                <label className="label">Department *</label>
                <select className="select" required value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })}>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Designation</label>
                <input className="input" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} />
              </div>
              <div>
                <label className="label">Max Hours / Week</label>
                <input className="input" type="number" min={1} max={40} value={form.max_hours_per_week} onChange={e => setForm({ ...form, max_hours_per_week: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91..." />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button type="submit" className="btn-primary flex-1 justify-center">
                {modal === 'create' ? 'Create Profile' : 'Update'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
