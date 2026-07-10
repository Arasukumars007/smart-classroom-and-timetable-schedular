import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Shield, Search } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

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

export default function AdminsPage() {
  const qc = useQueryClient()
  const { user: currentUser } = useAuthStore()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ full_name: '', email: '', password: '' })

  const { data: admins = [], isLoading } = useQuery({
    queryKey: ['admins'],
    queryFn: () => userAPI.listAdmins().then(r => r.data),
  })

  const createMut = useMutation({
    mutationFn: (payload) => userAPI.createAdmin(payload),
    onSuccess: () => { qc.invalidateQueries(['admins']); toast.success('Admin registered!'); setModal(null) },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to register admin'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => userAPI.updateAdmin(id, data),
    onSuccess: () => { qc.invalidateQueries(['admins']); toast.success('Admin updated!'); setModal(null) },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to update admin'),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => userAPI.deleteAdmin(id),
    onSuccess: () => { qc.invalidateQueries(['admins']); toast.success('Admin deleted') },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to delete admin'),
  })

  const openCreate = () => {
    setForm({ full_name: '', email: '', password: 'adminpassword123' })
    setModal('create')
  }

  const openEdit = (a) => {
    setForm({ full_name: a.full_name || '', email: a.email || '', password: '' })
    setModal(a)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (modal === 'create') {
      createMut.mutate({ ...form, role: 'admin' })
    } else {
      updateMut.mutate({ id: modal.id, data: { full_name: form.full_name, email: form.email } })
    }
  }

  const filtered = admins.filter(a =>
    a.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Administrators</h1>
          <p className="section-subtitle">Manage system access and admin accounts</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Admin
        </button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input className="input pl-9" placeholder="Search admins..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Admin Name</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={4} className="text-center py-12 text-slate-500"><span className="spinner" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-12 text-slate-500">No administrators found</td></tr>
              ) : filtered.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {a.full_name} 
                          {currentUser?.id === a.id && <span className="text-xs text-primary-400 ml-2">(You)</span>}
                        </p>
                        <p className="text-xs text-slate-500">{a.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    {a.is_active ? (
                      <span className="badge-primary">Active</span>
                    ) : (
                      <span className="badge-error bg-red-500/10 text-red-400 border border-red-500/20">Disabled</span>
                    )}
                  </td>
                  <td className="text-slate-400">
                    {new Date(a.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEdit(a)} className="btn-ghost p-1.5 rounded-lg text-slate-400 hover:text-primary-400">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => { if (confirm('Delete this administrator account?')) deleteMut.mutate(a.id) }}
                        disabled={currentUser?.id === a.id}
                        className="btn-ghost p-1.5 rounded-lg text-slate-400 hover:text-red-400 disabled:opacity-30 disabled:hover:text-slate-400"
                        title={currentUser?.id === a.id ? "Cannot delete your own account" : "Delete"}
                      >
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
        <Modal title={modal === 'create' ? 'Add Administrator' : 'Edit Administrator'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name *</label>
              <input className="input" required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="e.g. Admin User" />
            </div>
            <div>
              <label className="label">Email Address *</label>
              <input className="input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="admin@institution.edu" />
            </div>
            {modal === 'create' && (
              <div>
                <label className="label">Portal Password *</label>
                <input className="input" type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button type="submit" className="btn-primary flex-1 justify-center" disabled={createMut.isPending || updateMut.isPending}>
                {modal === 'create' ? 'Create Admin' : 'Update'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
