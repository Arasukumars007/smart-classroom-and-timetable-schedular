import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { classroomAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, DoorOpen, Search, Projector, Wind, FlaskConical } from 'lucide-react'

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal p-6"><div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-display font-semibold text-white">{title}</h2>
        <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">✕</button>
      </div>{children}</div>
    </div>
  )
}

const EMPTY = { name: '', building: '', room_number: '', capacity: 60, has_projector: true, has_ac: false, is_lab: false, lab_type: '', is_active: true }

export default function ClassroomsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [filter, setFilter] = useState('all')

  const { data = [], isLoading } = useQuery({ queryKey: ['classrooms'], queryFn: () => classroomAPI.list().then(r => r.data) })

  const createMut = useMutation({ mutationFn: d => classroomAPI.create(d), onSuccess: () => { qc.invalidateQueries(['classrooms']); toast.success('Classroom added!'); setModal(null) } })
  const updateMut = useMutation({ mutationFn: ({ id, data }) => classroomAPI.update(id, data), onSuccess: () => { qc.invalidateQueries(['classrooms']); toast.success('Updated!'); setModal(null) } })
  const deleteMut = useMutation({ mutationFn: id => classroomAPI.delete(id), onSuccess: () => { qc.invalidateQueries(['classrooms']); toast.success('Deleted') } })

  const openCreate = () => { setForm(EMPTY); setModal('create') }
  const openEdit = d => { setForm({ ...d, lab_type: d.lab_type || '' }); setModal(d) }

  const handleSubmit = e => {
    e.preventDefault()
    const payload = { ...form, capacity: Number(form.capacity) }
    if (modal === 'create') createMut.mutate(payload)
    else updateMut.mutate({ id: modal.id, data: payload })
  }

  const filtered = data
    .filter(r => filter === 'all' || (filter === 'lab' ? r.is_lab : !r.is_lab))
    .filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || (r.building || '').toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="section-title">Classrooms</h1><p className="section-subtitle">{data.length} rooms registered</p></div>
        <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> Add Room</button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input className="input pl-9 w-52" placeholder="Search rooms..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {['all', 'classroom', 'lab'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`btn-sm capitalize ${filter === f ? 'btn-primary' : 'btn-secondary'}`}>{f}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading ? <div className="col-span-4 py-20 text-center"><span className="spinner" /></div>
          : filtered.map(r => (
            <div key={r.id} className="card p-4 hover:border-primary-500/40 group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600/20 to-accent-600/20 flex items-center justify-center">
                  {r.is_lab ? <FlaskConical className="w-5 h-5 text-violet-400" /> : <DoorOpen className="w-5 h-5 text-primary-400" />}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(r)} className="btn-ghost p-1 rounded-lg text-slate-400 hover:text-primary-400"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => { if (confirm('Delete?')) deleteMut.mutate(r.id) }} className="btn-ghost p-1 rounded-lg text-slate-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <h3 className="font-semibold text-white">{r.name}</h3>
              <p className="text-xs text-slate-500 mb-3">{r.building} {r.room_number && `· ${r.room_number}`}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={r.is_lab ? 'badge-lab' : 'badge-primary'}>{r.is_lab ? r.lab_type || 'Lab' : 'Classroom'}</span>
                <span className="text-xs text-slate-400">Cap: {r.capacity}</span>
              </div>
              <div className="flex items-center gap-3 mt-3 text-slate-500">
                {r.has_projector && <span title="Projector" className="text-blue-400"><Projector className="w-3.5 h-3.5" /></span>}
                {r.has_ac && <span title="AC" className="text-cyan-400"><Wind className="w-3.5 h-3.5" /></span>}
                <span className={`ml-auto text-xs ${r.is_active ? 'text-emerald-400' : 'text-red-400'}`}>{r.is_active ? '● Active' : '○ Inactive'}</span>
              </div>
            </div>
          ))}
      </div>

      {modal !== null && (
        <Modal title={modal === 'create' ? 'Add Classroom' : 'Edit Classroom'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Name *</label><input className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="label">Room No.</label><input className="input" value={form.room_number} onChange={e => setForm({ ...form, room_number: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Building</label><input className="input" value={form.building} onChange={e => setForm({ ...form, building: e.target.value })} /></div>
              <div><label className="label">Capacity</label><input className="input" type="number" min={1} value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} /></div>
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input type="checkbox" checked={form.has_projector} onChange={e => setForm({ ...form, has_projector: e.target.checked })} className="rounded" /> Projector
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input type="checkbox" checked={form.has_ac} onChange={e => setForm({ ...form, has_ac: e.target.checked })} className="rounded" /> Air Conditioned
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input type="checkbox" checked={form.is_lab} onChange={e => setForm({ ...form, is_lab: e.target.checked })} className="rounded" /> Is Lab
              </label>
            </div>
            {form.is_lab && <div><label className="label">Lab Type</label><input className="input" value={form.lab_type} onChange={e => setForm({ ...form, lab_type: e.target.value })} placeholder="e.g. Computer Lab" /></div>}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button type="submit" className="btn-primary flex-1 justify-center">{modal === 'create' ? 'Add Room' : 'Update'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
