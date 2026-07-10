import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { studentAPI, semesterAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, GraduationCap, Search } from 'lucide-react'

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

export default function StudentsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [selectedSemId, setSelectedSemId] = useState('')
  const [form, setForm] = useState({ roll_number: '', semester_id: '', section: 'A', phone: '', full_name: '', email: '', password: 'student123' })

  const { data: semesters = [] } = useQuery({
    queryKey: ['semesters-all'],
    queryFn: () => semesterAPI.list().then(r => r.data),
  })

  // Set default selected semester once data loads
  useEffect(() => {
    if (semesters.length > 0 && !selectedSemId) setSelectedSemId(semesters[0].id)
  }, [semesters, selectedSemId])

  const currentSemId = selectedSemId || semesters[0]?.id

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students', currentSemId],
    queryFn: () => studentAPI.list(currentSemId).then(r => r.data),
    enabled: !!currentSemId,
  })

  const createMut = useMutation({
    mutationFn: async (payload) => {
      // Single unified endpoint: creates User + Student profile in one transaction
      return studentAPI.create({
        full_name: payload.full_name,
        email: payload.email,
        password: payload.password,
        roll_number: payload.roll_number,
        semester_id: Number(payload.semester_id),
        section: payload.section,
        phone: payload.phone || null,
      })
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['students'] }); toast.success('Student registered!'); setModal(null) },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to register student'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => studentAPI.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['students'] }); toast.success('Student updated!'); setModal(null) },
  })

  const deleteMut = useMutation({
    mutationFn: (id) => studentAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['students'] }); toast.success('Student deleted') },
  })

  const openCreate = () => {
    setForm({ roll_number: '', semester_id: currentSemId || '', section: 'A', phone: '', full_name: '', email: '', password: 'student123' })
    setModal('create')
  }

  const openEdit = (s) => {
    setForm({ roll_number: s.roll_number, semester_id: s.semester_id, section: s.section, phone: s.phone || '', full_name: s.full_name || '', email: s.email || '', password: '' })
    setModal(s)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (modal === 'create') createMut.mutate(form)
    else updateMut.mutate({ id: modal.id, data: { semester_id: Number(form.semester_id), section: form.section, phone: form.phone } })
  }

  const filtered = students.filter(s =>
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.roll_number.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Students</h1>
          <p className="section-subtitle">Manage enrolled students by semester</p>
        </div>
        <button onClick={openCreate} className="btn-primary" disabled={semesters.length === 0}>
          <Plus className="w-4 h-4" /> Add Student
        </button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="w-64">
          <label className="label">Filter by Semester</label>
          <select className="select" value={currentSemId || ''} onChange={e => setSelectedSemId(e.target.value)}>
            {semesters.map(s => (
              <option key={s.id} value={s.id}>Semester {s.number} ({s.academic_year})</option>
            ))}
          </select>
        </div>
        <div className="flex-1 max-w-xs mt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input className="input pl-9" placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Name</th>
                <th>Section</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-12 text-slate-500"><span className="spinner" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-slate-500">No students found</td></tr>
              ) : filtered.map((s) => (
                <tr key={s.id}>
                  <td><span className="badge-primary">{s.roll_number}</span></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center text-white text-xs font-bold">
                        {s.full_name?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <p className="font-medium text-white">{s.full_name}</p>
                        <p className="text-xs text-slate-500">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge-info">Section {s.section}</span></td>
                  <td className="text-slate-400">{s.phone || '—'}</td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEdit(s)} className="btn-ghost p-1.5 rounded-lg text-slate-400 hover:text-primary-400">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { if (confirm('Delete this student?')) deleteMut.mutate(s.id) }}
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
        <Modal title={modal === 'create' ? 'Add Student' : 'Edit Student'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {modal === 'create' && (
              <>
                <div>
                  <label className="label">Full Name *</label>
                  <input className="input" required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="e.g. Student Name" />
                </div>
                <div>
                  <label className="label">Email Address *</label>
                  <input className="input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="student@institution.edu" />
                </div>
                <div>
                  <label className="label">Portal Password *</label>
                  <input className="input" type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                </div>
              </>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Roll Number *</label>
                <input className="input" required value={form.roll_number} onChange={e => setForm({ ...form, roll_number: e.target.value.toUpperCase() })} placeholder="CSE2024001" disabled={modal !== 'create'} />
              </div>
              <div>
                <label className="label">Semester *</label>
                <select className="select" required value={form.semester_id} onChange={e => setForm({ ...form, semester_id: e.target.value })}>
                  {semesters.map(s => (
                    <option key={s.id} value={s.id}>Semester {s.number}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Section</label>
                <select className="select" value={form.section} onChange={e => setForm({ ...form, section: e.target.value })}>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              </div>
              <div>
                <label className="label">Phone Number</label>
                <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91..." />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button type="submit" className="btn-primary flex-1 justify-center">
                {modal === 'create' ? 'Register Student' : 'Update'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
