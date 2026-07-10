import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { departmentAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Building2, Search } from 'lucide-react'

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

export default function DepartmentsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // null | 'create' | {id, ...}
  const [form, setForm] = useState({ name: '', code: '', description: '' })

  const { data = [], isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentAPI.list().then(r => r.data),
  })

  const createMut = useMutation({
    mutationFn: (d) => departmentAPI.create(d),
    onSuccess: () => { qc.invalidateQueries(['departments']); toast.success('Department created!'); setModal(null) },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to create'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => departmentAPI.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['departments']); toast.success('Department updated!'); setModal(null) },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to update'),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => departmentAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries(['departments']); toast.success('Department deleted') },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to delete'),
  })

  const openCreate = () => { setForm({ name: '', code: '', description: '' }); setModal('create') }
  const openEdit = (d) => { setForm({ name: d.name, code: d.code, description: d.description || '' }); setModal(d) }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (modal === 'create') createMut.mutate(form)
    else updateMut.mutate({ id: modal.id, data: form })
  }

  const filtered = data.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Departments</h1>
          <p className="section-subtitle">{data.length} departments registered</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Department
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input className="input pl-9" placeholder="Search departments..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Department Name</th>
                <th>Code</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-12 text-slate-500"><span className="spinner" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-slate-500">No departments found</td></tr>
              ) : filtered.map((d, i) => (
                <tr key={d.id}>
                  <td className="text-slate-500">{i + 1}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary-600/20 flex items-center justify-center">
                        <Building2 className="w-3.5 h-3.5 text-primary-400" />
                      </div>
                      <span className="font-medium text-white">{d.name}</span>
                    </div>
                  </td>
                  <td><span className="badge-primary">{d.code}</span></td>
                  <td className="text-slate-400 max-w-xs truncate">{d.description || '—'}</td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEdit(d)} className="btn-ghost p-1.5 rounded-lg text-slate-400 hover:text-primary-400">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { if (confirm('Delete this department?')) deleteMut.mutate(d.id) }}
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
        <Modal title={modal === 'create' ? 'Add Department' : 'Edit Department'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Department Name *</label>
              <input className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Computer Science" />
            </div>
            <div>
              <label className="label">Code *</label>
              <input className="input" required value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. CSE" maxLength={10} />
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
