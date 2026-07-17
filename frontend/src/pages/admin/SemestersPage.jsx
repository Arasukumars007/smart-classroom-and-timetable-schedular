import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { semesterAPI, courseAPI } from "../../services/api"
import toast from "react-hot-toast"
import { Plus, Pencil, CalendarDays, Search, BookOpen } from "lucide-react"

const ACADEMIC_YEARS = ["2022-23", "2023-24", "2024-25", "2025-26"]
const SEM_NUMS = [1, 2, 3, 4, 5, 6, 7, 8]

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-display font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg text-slate-400">X</button>
        </div>
        {children}
      </div>
    </div>
  )
}

const semToYear = (num) => Math.ceil(num / 2)

export default function SemestersPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const [modal, setModal] = useState(null)
  const [filterYear, setFilterYear] = useState("")
  const [form, setForm] = useState({ number: 1, course_id: "", academic_year: "2024-25", sections: "A" })

  const { data: semesters = [], isLoading } = useQuery({
    queryKey: ["semesters-all"],
    queryFn: () => semesterAPI.list().then(r => r.data),
  })

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: () => courseAPI.list().then(r => r.data),
  })

  const createMut = useMutation({
    mutationFn: (d) => semesterAPI.create(d),
    onSuccess: () => { qc.invalidateQueries(["semesters-all"]); toast.success("Semester created!"); setModal(null) },
    onError: (e) => toast.error(e.response?.data?.detail || "Failed to create semester"),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => semesterAPI.update(id, data),
    onSuccess: () => { qc.invalidateQueries(["semesters-all"]); toast.success("Semester updated!"); setModal(null) },
    onError: (e) => toast.error(e.response?.data?.detail || "Failed to update semester"),
  })

  const openCreate = () => {
    setForm({ number: 1, course_id: courses[0]?.id || "", academic_year: "2024-25", sections: "A" })
    setModal("create")
  }

  const openEdit = (sem) => {
    setForm({ number: sem.number, course_id: sem.course_id, academic_year: sem.academic_year, sections: sem.sections })
    setModal(sem)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = { ...form, number: Number(form.number), course_id: Number(form.course_id) }
    if (modal === "create") createMut.mutate(payload)
    else updateMut.mutate({ id: modal.id, data: { academic_year: payload.academic_year, sections: payload.sections } })
  }

  const getCourseName = (courseId) => {
    const c = courses.find(c => c.id === courseId)
    return c ? `${c.name} (${c.code})` : "-"
  }

  const filtered = semesters.filter(s => {
    const courseName = getCourseName(s.course_id).toLowerCase()
    const matchSearch = !search || courseName.includes(search.toLowerCase()) || `semester ${s.number}`.includes(search.toLowerCase())
    const matchYear = !filterYear || s.academic_year === filterYear
    return matchSearch && matchYear
  }).sort((a, b) => a.number - b.number)

  const yearGroups = ACADEMIC_YEARS.reduce((acc, yr) => {
    const items = filtered.filter(s => s.academic_year === yr)
    if (items.length > 0) acc[yr] = items
    return acc
  }, {})

  const unclassified = filtered.filter(s => !ACADEMIC_YEARS.includes(s.academic_year))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Semesters</h1>
          <p className="section-subtitle">{semesters.length} semesters registered</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Semester
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-xs flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input className="input pl-9" placeholder="Search semesters..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterYear("")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-200 ${!filterYear ? "bg-primary-600 border-primary-500 text-white" : "bg-slate-800/60 border-slate-700/50 text-slate-400 hover:border-primary-500/50"}`}>
            All Years
          </button>
          {ACADEMIC_YEARS.map(yr => (
            <button key={yr} onClick={() => setFilterYear(filterYear === yr ? "" : yr)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-200 ${filterYear === yr ? "bg-accent-600 border-accent-500 text-white" : "bg-slate-800/60 border-slate-700/50 text-slate-400 hover:border-accent-500/50"}`}>
              {yr}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {ACADEMIC_YEARS.map(yr => {
          const count = semesters.filter(s => s.academic_year === yr).length
          return (
            <div key={yr} className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-600/20 flex items-center justify-center shrink-0">
                <CalendarDays className="w-5 h-5 text-accent-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">{yr}</p>
                <p className="text-xl font-bold text-white">{count}</p>
                <p className="text-xs text-slate-600">semesters</p>
              </div>
            </div>
          )
        })}
      </div>

      {isLoading ? (
        <div className="card p-12 text-center"><span className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">
          <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No semesters found. Click <strong>Add Semester</strong> to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(yearGroups).map(([yr, sems]) => (
            <div key={yr} className="card overflow-hidden">
              <div className="px-5 py-3 bg-slate-800/60 border-b border-slate-700/50 flex items-center gap-3">
                <CalendarDays className="w-4 h-4 text-accent-400" />
                <span className="font-semibold text-white">Academic Year {yr}</span>
                <span className="ml-auto badge-info">{sems.length} semester{sems.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Semester</th>
                      <th>Study Year</th>
                      <th>Course</th>
                      <th>Academic Year</th>
                      <th>Sections</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sems.map(s => (
                      <tr key={s.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-primary-600/20 flex items-center justify-center text-primary-400 font-bold text-sm">{s.number}</div>
                            <span className="font-medium text-white">Semester {s.number}</span>
                          </div>
                        </td>
                        <td><span className="badge-primary">Year {semToYear(s.number)}</span></td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="text-slate-300 text-sm">{getCourseName(s.course_id)}</span>
                          </div>
                        </td>
                        <td><span className="badge-info">{s.academic_year}</span></td>
                        <td>
                          <div className="flex gap-1 flex-wrap">
                            {s.sections?.split(",").map(sec => (
                              <span key={sec} className="badge-success">{sec.trim()}</span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <button onClick={() => openEdit(s)} className="btn-ghost p-1.5 rounded-lg text-slate-400 hover:text-primary-400">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          {unclassified.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3 bg-slate-800/60 border-b border-slate-700/50">
                <span className="font-semibold text-slate-400">Other Academic Years</span>
              </div>
              <div className="table-wrapper">
                <table className="table">
                  <thead><tr><th>Semester</th><th>Study Year</th><th>Course</th><th>Academic Year</th><th>Sections</th><th>Actions</th></tr></thead>
                  <tbody>
                    {unclassified.map(s => (
                      <tr key={s.id}>
                        <td><span className="font-medium text-white">Semester {s.number}</span></td>
                        <td><span className="badge-primary">Year {semToYear(s.number)}</span></td>
                        <td><span className="text-slate-300 text-sm">{getCourseName(s.course_id)}</span></td>
                        <td><span className="badge-info">{s.academic_year}</span></td>
                        <td>{s.sections?.split(",").map(sec => <span key={sec} className="badge-success mr-1">{sec.trim()}</span>)}</td>
                        <td><button onClick={() => openEdit(s)} className="btn-ghost p-1.5 rounded-lg text-slate-400 hover:text-primary-400"><Pencil className="w-3.5 h-3.5" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {modal !== null && (
        <Modal title={modal === "create" ? "Add Semester" : `Edit Semester ${modal.number}`} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {modal === "create" && (
              <>
                <div>
                  <label className="label">Semester Number *</label>
                  <select className="select" required value={form.number} onChange={e => setForm({ ...form, number: e.target.value })}>
                    {SEM_NUMS.map(n => <option key={n} value={n}>Semester {n} — Year {semToYear(n)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Course *</label>
                  <select className="select" required value={form.course_id} onChange={e => setForm({ ...form, course_id: e.target.value })}>
                    <option value="">— Select Course —</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                  </select>
                </div>
              </>
            )}
            <div>
              <label className="label">Academic Year *</label>
              <select className="select" required value={form.academic_year} onChange={e => setForm({ ...form, academic_year: e.target.value })}>
                {ACADEMIC_YEARS.map(yr => <option key={yr} value={yr}>{yr}</option>)}
              </select>
              <p className="text-xs text-slate-500 mt-1">Select the academic year for this semester</p>
            </div>
            <div>
              <label className="label">Sections *</label>
              <input className="input" required value={form.sections} onChange={e => setForm({ ...form, sections: e.target.value })} placeholder="e.g. A,B or A" />
              <p className="text-xs text-slate-500 mt-1">Comma-separated section names (e.g. A,B)</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button type="submit" className="btn-primary flex-1 justify-center" disabled={createMut.isPending || updateMut.isPending}>
                {(createMut.isPending || updateMut.isPending) ? <span className="spinner" /> : modal === "create" ? "Create Semester" : "Update Semester"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
