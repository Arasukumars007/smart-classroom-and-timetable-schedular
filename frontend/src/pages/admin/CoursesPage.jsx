import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { courseAPI, departmentAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, BookOpen, Search } from 'lucide-react'

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

export default function CoursesPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // null | 'create' | {id, ...}
  const [form, setForm] = useState({ name: '', code: '', department_id: '', duration_years: 4, description: '' })

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => courseAPI.list().then(r => r.data),
  })

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentAPI.list().then(r => r.data),
  })

  const createMut = useMutation({
    mutationFn: (d) => courseAPI.create(d),
    onSuccess: () => { qc.invalidateQueries(['courses']); toast.success('Course created!'); setModal(null) },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to create'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => courseAPI.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['courses']); toast.success('Course updated!'); setModal(null) },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to update'),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => courseAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries(['courses']); toast.success('Course deleted') },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to delete'),
  })

  const openCreate = () => { setForm({ name: '', code: '', department_id: departments[0]?.id || '', duration_years: 4, description: '' }); setModal('create') }
  const openEdit = (c) => { setForm({ name: c.name, code: c.code, department_id: c.department_id, duration_years: c.duration_years, description: c.description || '' }); setModal(c) }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = { ...form, department_id: Number(form.department_id), duration_years: Number(form.duration_years) }
    if (modal === 'create') createMut.mutate(payload)
    else updateMut.mutate({ id: modal.id, data: payload })
  }

  const filtered = courses.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  )

  const getDeptCode = (deptId) => {
    const dept = departments.find(d => d.id === deptId)
    return dept ? dept.code : '—'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Courses</h1>
          <p className="section-subtitle">{courses.length} courses registered</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Course
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input className="input pl-9" placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Course Name</th>
                <th>Code</th>
                <th>Department</th>
                <th>Duration (Years)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-500"><span className="spinner" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-500">No courses found</td></tr>
              ) : filtered.map((c, i) => (
                <tr key={c.id}>
                  <td className="text-slate-500">{i + 1}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-accent-600/20 flex items-center justify-center">
                        <BookOpen className="w-3.5 h-3.5 text-accent-400" />
                      </div>
                      <span className="font-medium text-white">{c.name}</span>
                    </div>
                  </td>
                  <td><span className="badge-primary">{c.code}</span></td>
                  <td><span className="badge-info">{getDeptCode(c.department_id)}</span></td>
                  <td>{c.duration_years} Years</td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEdit(c)} className="btn-ghost p-1.5 rounded-lg text-slate-400 hover:text-primary-400">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { if (confirm('Delete this course?')) deleteMut.mutate(c.id) }}
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

      {/* Modal */}
      {modal !== null && (
        <Modal title={modal === 'create' ? 'Add Course' : 'Edit Course'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Course Name *</label>
              <input className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. B.Tech Computer Science" />
            </div>
            <div>
              <label className="label">Code *</label>
              <input className="input" required value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. BTCSE" maxLength={10} />
            </div>
            <div>
              <label className="label">Department *</label>
              <select className="select" required value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })}>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Duration (Years)</label>
              <input className="input" type="number" min={1} max={6} value={form.duration_years} onChange={e => setForm({ ...form, duration_years: e.target.value })} />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input resize-none" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description..." />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button type="submit" className="btn-primary flex-1 justify-center" disabled={createMut.isPending || updateMut.isPending}>
                {(createMut.isPending || updateMut.isPending) ? <span className="spinner" /> : modal === 'create' ? 'Create' : 'Update'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
