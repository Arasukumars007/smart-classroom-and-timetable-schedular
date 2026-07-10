import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { subjectAPI, semesterAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, BookMarked, Search } from 'lucide-react'

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

export default function SubjectsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [selectedSemId, setSelectedSemId] = useState('')
  const [form, setForm] = useState({ name: '', code: '', semester_id: '', hours_per_week: 3, credit_hours: 3, is_lab: false, lab_hours: 0 })

  const { data: semesters = [] } = useQuery({
    queryKey: ['semesters-all'],
    queryFn: () => semesterAPI.list().then(r => r.data),
    onSuccess: (data) => {
      if (data.length > 0 && !selectedSemId) setSelectedSemId(data[0].id)
    }
  })

  // Set default semester for search dropdown
  const currentSemId = selectedSemId || semesters[0]?.id

  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ['subjects', currentSemId],
    queryFn: () => subjectAPI.list(currentSemId).then(r => r.data),
    enabled: !!currentSemId,
  })

  const createMut = useMutation({
    mutationFn: (d) => subjectAPI.create(d),
    onSuccess: () => { qc.invalidateQueries(['subjects']); toast.success('Subject created!'); setModal(null) },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to create'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => subjectAPI.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['subjects']); toast.success('Subject updated!'); setModal(null) },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to update'),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => subjectAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries(['subjects']); toast.success('Subject deleted') },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to delete'),
  })

  const openCreate = () => { setForm({ name: '', code: '', semester_id: currentSemId || '', hours_per_week: 3, credit_hours: 3, is_lab: false, lab_hours: 0 }); setModal('create') }
  const openEdit = (s) => { setForm({ name: s.name, code: s.code, semester_id: s.semester_id, hours_per_week: s.hours_per_week, credit_hours: s.credit_hours, is_lab: s.is_lab, lab_hours: s.lab_hours }); setModal(s) }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      semester_id: Number(form.semester_id),
      hours_per_week: Number(form.hours_per_week),
      credit_hours: Number(form.credit_hours),
      lab_hours: Number(form.lab_hours)
    }
    if (modal === 'create') createMut.mutate(payload)
    else updateMut.mutate({ id: modal.id, data: payload })
  }

  const filtered = subjects.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Subjects</h1>
          <p className="section-subtitle">Manage curriculum subjects & labs</p>
        </div>
        <button onClick={openCreate} className="btn-primary" disabled={!currentSemId}>
          <Plus className="w-4 h-4" /> Add Subject
        </button>
      </div>

      {/* Filters */}
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
            <input className="input pl-9" placeholder="Search subjects..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Subject Name</th>
                <th>Type</th>
                <th>Weekly Hours</th>
                <th>Credits</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-500"><span className="spinner" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-500">No subjects found for this semester</td></tr>
              ) : filtered.map((s) => (
                <tr key={s.id}>
                  <td><span className="badge-primary">{s.code}</span></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600/20 flex items-center justify-center">
                        <BookMarked className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <span className="font-medium text-white">{s.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className={s.is_lab ? 'badge-lab' : 'badge-primary'}>
                      {s.is_lab ? 'Lab Session' : 'Theory'}
                    </span>
                  </td>
                  <td>{s.hours_per_week} hrs/week</td>
                  <td>{s.credit_hours} Credits</td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEdit(s)} className="btn-ghost p-1.5 rounded-lg text-slate-400 hover:text-primary-400">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { if (confirm('Delete this subject?')) deleteMut.mutate(s.id) }}
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
        <Modal title={modal === 'create' ? 'Add Subject' : 'Edit Subject'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Subject Name *</label>
              <input className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Data Structures" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Code *</label>
                <input className="input" required value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. CS301" maxLength={10} />
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
                <label className="label">Hours per week *</label>
                <input className="input" type="number" min={1} max={10} value={form.hours_per_week} onChange={e => setForm({ ...form, hours_per_week: e.target.value })} />
              </div>
              <div>
                <label className="label">Credit Hours</label>
                <input className="input" type="number" min={1} max={5} value={form.credit_hours} onChange={e => setForm({ ...form, credit_hours: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input type="checkbox" checked={form.is_lab} onChange={e => setForm({ ...form, is_lab: e.target.checked })} className="rounded bg-slate-800" />
                This is a Practical / Lab Subject
              </label>
            </div>
            {form.is_lab && (
              <div>
                <label className="label">Lab Session Duration (Consecutive Hours)</label>
                <input className="input" type="number" min={2} max={4} value={form.lab_hours} onChange={e => setForm({ ...form, lab_hours: e.target.value })} placeholder="e.g. 2 or 3" />
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button type="submit" className="btn-primary flex-1 justify-center">
                {modal === 'create' ? 'Create' : 'Update'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
