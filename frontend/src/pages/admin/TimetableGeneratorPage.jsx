import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { timetableAPI, semesterAPI, courseAPI, subjectAPI, facultyAPI, classroomAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { Zap, AlertTriangle, CheckCircle, Calendar, Settings, Download, Plus, Edit } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8]
const PERIOD_TIMES = ['8:00–8:50', '8:55–9:45', '9:50–10:40', '10:45–11:35', '11:40–12:30', '1:15–2:05', '2:10–3:00', '3:05–3:55']

// Derive year from semester number  (1-2 → Yr1, 3-4 → Yr2, 5-6 → Yr3, 7-8 → Yr4)
const semToYear = (num) => Math.ceil(num / 2)
const YEARS = [1, 2, 3, 4]

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

function TimetableGrid({ slots, section, onSlotClick }) {
  const slotMap = {}
  slots?.forEach(s => { slotMap[`${s.day_of_week}-${s.period_number}`] = s })

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' })
    doc.setFontSize(16)
    doc.text(`Timetable — Section ${section}`, 14, 15)
    const rows = PERIODS.map(p => [
      `P${p}\n${PERIOD_TIMES[p-1]}`,
      ...DAYS.map((_, d) => {
        const s = slotMap[`${d}-${p}`]
        if (!s || !s.subject_name) return 'FREE'
        return `${s.subject_name}\n${s.faculty_name || ''}\n${s.classroom_name || ''}`
      })
    ])
    autoTable(doc, {
      head: [['Period', ...DAYS]],
      body: rows,
      startY: 25,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [99, 102, 241] },
      alternateRowStyles: { fillColor: [30, 41, 59] },
    })
    doc.save(`timetable_section_${section}.pdf`)
    toast.success('PDF downloaded!')
  }

  const exportExcel = () => {
    const rows = [['Period/Time', ...DAYS]]
    PERIODS.forEach(p => {
      rows.push([
        `P${p} ${PERIOD_TIMES[p-1]}`,
        ...DAYS.map((_, d) => {
          const s = slotMap[`${d}-${p}`]
          return s?.subject_name ? `${s.subject_name} (${s.faculty_name || ''})` : 'FREE'
        })
      ])
    })
    const ws = XLSX.utils.aoa_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `Section ${section}`)
    XLSX.writeFile(wb, `timetable_section_${section}.xlsx`)
    toast.success('Excel downloaded!')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-semibold text-white flex items-center gap-2">
          Section {section}
          <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">Interactive Mode</span>
        </h3>
        <div className="flex gap-2">
          <button onClick={exportPDF} className="btn-secondary btn-sm"><Download className="w-3.5 h-3.5" /> PDF</button>
          <button onClick={exportExcel} className="btn-secondary btn-sm"><Download className="w-3.5 h-3.5" /> Excel</button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-700/50">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-800/80">
              <th className="px-3 py-2.5 text-left text-slate-400 font-semibold w-28">Period</th>
              {DAYS.map(d => (
                <th key={d} className="px-2 py-2.5 text-left text-slate-400 font-semibold">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map(p => (
              <tr key={p} className="border-t border-slate-700/30">
                <td className="px-3 py-2 text-slate-500">
                  <div className="font-medium text-slate-300">P{p}</div>
                  <div className="text-slate-600">{PERIOD_TIMES[p-1]}</div>
                </td>
                {DAYS.map((_, d) => {
                  const slot = slotMap[`${d}-${p}`]

                  if (!slot || !slot.subject_id) {
                    return (
                      <td key={d} className="px-2 py-2">
                        <div
                          onClick={() => onSlotClick(d, p, null)}
                          className="timetable-cell empty rounded-lg p-1.5 text-center text-slate-600 text-xs cursor-pointer hover:bg-slate-800/50 hover:border-slate-700 transition-colors border border-transparent flex flex-col items-center justify-center min-h-[70px] group"
                        >
                          <span className="group-hover:hidden">—</span>
                          <Plus className="w-4 h-4 text-primary-400 hidden group-hover:block" />
                        </div>
                      </td>
                    )
                  }

                  if (slot.is_lab_continuation) {
                    return (
                      <td key={d} className="px-2 py-2">
                        <div
                           onClick={() => onSlotClick(d, p, slot)}
                           className="timetable-cell lab rounded-lg p-1.5 text-center text-xs text-violet-400 italic cursor-pointer hover:brightness-110 min-h-[70px] flex items-center justify-center"
                        >
                          ↑ Lab cont.
                        </div>
                      </td>
                    )
                  }

                  return (
                    <td key={d} className="px-2 py-2">
                      <div
                        onClick={() => onSlotClick(d, p, slot)}
                        className={`timetable-cell ${slot.slot_type} rounded-lg p-2 cursor-pointer hover:brightness-110 min-h-[70px] relative group`}
                      >
                        <div className="font-semibold text-white truncate pr-4">{slot.subject_name || slot.subject_code}</div>
                        <div className="text-slate-400 truncate">{slot.faculty_name}</div>
                        <div className="text-slate-500 truncate">{slot.classroom_name}</div>
                        <span className={`badge mt-1 ${slot.slot_type === 'lab' ? 'badge-lab' : 'badge-primary'} text-[10px]`}>{slot.slot_type}</span>
                        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                           <Edit className="w-3.5 h-3.5 text-white/70" />
                        </div>
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function TimetableGeneratorPage() {
  const qc = useQueryClient()
  const [selectedYear, setSelectedYear] = useState(1)   // Year 1–4
  const [config, setConfig] = useState({
    semester_id: '',
    sections: ['A'],
    academic_year: '2024-25',
    algorithm: 'csp',
    clear_existing: true,
  })
  const [activeSection, setActiveSection] = useState('A')
  const [generating, setGenerating] = useState(false)
  const [genResult, setGenResult] = useState(null)

  const [editModal, setEditModal] = useState(null)
  const [slotForm, setSlotForm] = useState({ subject_id: '', faculty_id: '', classroom_id: '', slot_type: 'theory' })

  // Fetch all semesters (no course_id filter so we get everything)
  const { data: allSemesters = [] } = useQuery({
    queryKey: ['semesters-all'],
    queryFn: () => semesterAPI.list().then(r => r.data),
  })

  // Filter semesters for selected year: Year 1 → sems 1&2, Year 2 → 3&4, etc.
  const semestersForYear = useMemo(() => {
    const semNums = selectedYear === 1 ? [1, 2]
      : selectedYear === 2 ? [3, 4]
      : selectedYear === 3 ? [5, 6]
      : [7, 8]
    return allSemesters.filter(s => semNums.includes(s.number))
  }, [allSemesters, selectedYear])

  const selectedSem = allSemesters.find(s => s.id === Number(config.semester_id))
  const availSections = selectedSem?.sections?.split(',').map(s => s.trim()) || ['A']

  // When year changes, reset semester selection if it no longer belongs to this year
  const handleYearChange = (yr) => {
    setSelectedYear(yr)
    const semNums = yr === 1 ? [1, 2] : yr === 2 ? [3, 4] : yr === 3 ? [5, 6] : [7, 8]
    const stillValid = allSemesters.find(
      s => s.id === Number(config.semester_id) && semNums.includes(s.number)
    )
    if (!stillValid) {
      setConfig(c => ({ ...c, semester_id: '' }))
      setGenResult(null)
    }
  }

  const { data: slots = [] } = useQuery({
    queryKey: ['timetable-slots', config.semester_id, activeSection],
    queryFn: () => config.semester_id
      ? timetableAPI.getSlots({ semester_id: config.semester_id, section: activeSection, academic_year: config.academic_year }).then(r => r.data)
      : [],
    enabled: !!config.semester_id,
  })

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects', config.semester_id],
    queryFn: () => subjectAPI.list(config.semester_id).then(r => r.data),
    enabled: !!config.semester_id,
  })

  const { data: faculty = [] } = useQuery({
    queryKey: ['faculty'],
    queryFn: () => facultyAPI.list().then(r => r.data),
  })

  const { data: classrooms = [] } = useQuery({
    queryKey: ['classrooms'],
    queryFn: () => classroomAPI.list().then(r => r.data),
  })

  // Mutations
  const generateMut = useMutation({
    mutationFn: () => timetableAPI.generate({
      ...config,
      semester_id: Number(config.semester_id),
    }),
    onMutate: () => setGenerating(true),
    onSuccess: (res) => {
      setGenResult(res.data)
      qc.invalidateQueries(['timetable-slots'])
      toast.success(res.data.message || 'Timetable generated!')
      setGenerating(false)
    },
    onError: (e) => {
      toast.error(e.response?.data?.detail || 'Generation failed')
      setGenerating(false)
    },
  })

  const createSlotMut = useMutation({
    mutationFn: (data) => timetableAPI.createSlot(data),
    onSuccess: () => {
      qc.invalidateQueries(['timetable-slots'])
      toast.success('Slot added successfully')
      setEditModal(null)
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to add slot')
  })

  const updateSlotMut = useMutation({
    mutationFn: ({ id, data }) => timetableAPI.updateSlot(id, data),
    onSuccess: () => {
      qc.invalidateQueries(['timetable-slots'])
      toast.success('Slot updated successfully')
      setEditModal(null)
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to update slot')
  })

  const deleteSlotMut = useMutation({
    mutationFn: (id) => timetableAPI.deleteSlot(id),
    onSuccess: () => {
      qc.invalidateQueries(['timetable-slots'])
      toast.success('Slot cleared')
      setEditModal(null)
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to clear slot')
  })

  const toggleSection = (sec) => {
    setConfig(c => ({
      ...c,
      sections: c.sections.includes(sec) ? c.sections.filter(s => s !== sec) : [...c.sections, sec]
    }))
  }

  const handleSlotClick = (day, period, existingSlot) => {
    if (existingSlot) {
      setSlotForm({
        subject_id: existingSlot.subject_id || '',
        faculty_id: existingSlot.faculty_id || '',
        classroom_id: existingSlot.classroom_id || '',
        slot_type: existingSlot.slot_type || 'theory'
      })
    } else {
      setSlotForm({ subject_id: '', faculty_id: '', classroom_id: '', slot_type: 'theory' })
    }
    setEditModal({ day, period, existingSlot })
  }

  const handleSlotSubmit = (e) => {
    e.preventDefault()
    const payloadData = {
      subject_id: slotForm.subject_id ? Number(slotForm.subject_id) : null,
      faculty_id: slotForm.faculty_id ? Number(slotForm.faculty_id) : null,
      classroom_id: slotForm.classroom_id ? Number(slotForm.classroom_id) : null,
      slot_type: slotForm.slot_type
    }
    if (editModal.existingSlot) {
      updateSlotMut.mutate({ id: editModal.existingSlot.id, data: payloadData })
    } else {
      createSlotMut.mutate({
        semester_id: Number(config.semester_id),
        section: activeSection,
        day_of_week: editModal.day,
        period_number: editModal.period,
        academic_year: config.academic_year,
        ...payloadData
      })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title">Timetable Management</h1>
        <p className="section-subtitle">Generate or manually assign classes to timetable slots</p>
      </div>

      {/* Configuration Card */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Settings className="w-5 h-5 text-primary-400" />
          <h3 className="font-display font-semibold text-white">Select Scope &amp; Generate</h3>
        </div>

        {/* ── Year Selector ── */}
        <div className="mb-5">
          <label className="label mb-2">Academic Year</label>
          <div className="flex gap-2 flex-wrap">
            {YEARS.map(yr => (
              <button
                key={yr}
                type="button"
                onClick={() => handleYearChange(yr)}
                className={`px-5 py-2 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                  selectedYear === yr
                    ? 'bg-primary-600 border-primary-500 text-white shadow-glow'
                    : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:border-primary-500/50 hover:text-slate-200'
                }`}
              >
                Year {yr}
                <span className="ml-2 text-xs font-normal opacity-70">
                  (Sem {yr * 2 - 1} &amp; {yr * 2})
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Semester */}
          <div>
            <label className="label">
              Semester *
              {selectedSem && (
                <span className="ml-2 text-xs text-primary-400 font-normal">
                  Year {semToYear(selectedSem.number)} · Sem {selectedSem.number}
                </span>
              )}
            </label>
            <select
              className="select"
              value={config.semester_id}
              onChange={e => {
                setConfig({ ...config, semester_id: e.target.value })
                setGenResult(null)
              }}
            >
              <option value="">— Select Semester —</option>
              {semestersForYear.length === 0 ? (
                <option disabled>No semesters for Year {selectedYear}</option>
              ) : (
                semestersForYear
                  .sort((a, b) => a.number - b.number)
                  .map(s => (
                    <option key={s.id} value={s.id}>
                      Semester {s.number} — {s.academic_year}
                    </option>
                  ))
              )}
            </select>
            {semestersForYear.length === 0 && (
              <p className="text-xs text-amber-400/80 mt-1.5">
                ⚠ No semesters found for Year {selectedYear}. Add them in Courses page.
              </p>
            )}
          </div>

          {/* Academic Year text */}
          <div>
            <label className="label">Academic Year Label</label>
            <input
              className="input"
              value={config.academic_year}
              placeholder="e.g. 2024-25"
              onChange={e => setConfig({ ...config, academic_year: e.target.value })}
            />
          </div>

          {/* Algorithm */}
          <div>
            <label className="label">Algorithm</label>
            <select className="select" value={config.algorithm} onChange={e => setConfig({ ...config, algorithm: e.target.value })}>
              <option value="csp">CSP (Constraint Satisfaction)</option>
              <option value="genetic">Genetic Algorithm</option>
            </select>
          </div>

          {/* Sections */}
          <div>
            <label className="label">Sections to Generate</label>
            <div className="flex gap-2 flex-wrap mt-1">
              {availSections.map(s => (
                <button key={s} onClick={() => toggleSection(s)}
                  className={`btn-sm ${config.sections.includes(s) ? 'btn-primary' : 'btn-secondary'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input type="checkbox" checked={config.clear_existing} onChange={e => setConfig({ ...config, clear_existing: e.target.checked })} className="rounded" />
            Clear existing timetable before generating
          </label>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={() => generateMut.mutate()}
            disabled={!config.semester_id || config.sections.length === 0 || generating}
            className="btn-primary btn-lg"
          >
            {generating ? <><span className="spinner" /> Generating...</> : <><Zap className="w-5 h-5" /> Auto-Generate Timetable</>}
          </button>
        </div>
      </div>

      {/* Result Banner */}
      {genResult && (
        <div className={`card p-4 flex items-start gap-4 ${genResult.success ? 'border-emerald-500/30' : 'border-red-500/30'}`}>
          {genResult.success
            ? <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            : <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />}
          <div className="flex-1">
            <p className="font-medium text-white">{genResult.message}</p>
            <p className="text-sm text-slate-400 mt-0.5">
              {genResult.slots_created} slots created · Algorithm: {genResult.algorithm_used?.toUpperCase()}
            </p>
            {genResult.conflicts?.length > 0 && (
              <div className="mt-3 space-y-1">
                <p className="text-xs font-semibold text-amber-400">{genResult.conflicts.length} warnings:</p>
                {genResult.conflicts.map((c, i) => (
                  <p key={i} className="text-xs text-amber-300/70">{c.description}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timetable View */}
      {config.semester_id ? (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary-400" />
              <div>
                <h3 className="font-display font-semibold text-white">Interactive Timetable Editor</h3>
                {selectedSem && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    Year {semToYear(selectedSem.number)} · Semester {selectedSem.number} · {selectedSem.academic_year}
                  </p>
                )}
              </div>
            </div>
            <span className="text-xs text-slate-400">Click any cell to edit or assign classes manually</span>
          </div>

          {/* Section Tabs */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {availSections.map(s => (
              <button key={s} onClick={() => setActiveSection(s)}
                className={`btn-sm ${activeSection === s ? 'btn-primary' : 'btn-secondary'}`}>
                Section {s}
              </button>
            ))}
          </div>

          <TimetableGrid
            slots={slots}
            section={activeSection}
            onSlotClick={handleSlotClick}
          />
        </div>
      ) : (
        <div className="py-16 text-center card">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-500" />
          <p className="text-slate-500 font-medium">Select a Year and Semester above to view or edit the timetable.</p>
          <p className="text-slate-600 text-sm mt-1">Year {selectedYear} covers Semester {selectedYear * 2 - 1} &amp; {selectedYear * 2}</p>
        </div>
      )}

      {/* Slot Editor Modal */}
      {editModal && (
        <Modal
          title={editModal.existingSlot ? `Edit ${DAYS[editModal.day]} · Period ${editModal.period}` : `Assign Class — ${DAYS[editModal.day]} · Period ${editModal.period}`}
          onClose={() => setEditModal(null)}
        >
          <form onSubmit={handleSlotSubmit} className="space-y-4">
            <div>
              <label className="label">Subject *</label>
              <select className="select" required value={slotForm.subject_id} onChange={e => setSlotForm({...slotForm, subject_id: e.target.value})}>
                <option value="">-- Select Subject --</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Assigned Faculty (Optional)</label>
              <select className="select" value={slotForm.faculty_id} onChange={e => setSlotForm({...slotForm, faculty_id: e.target.value})}>
                <option value="">-- No Faculty --</option>
                {faculty.map(f => (
                  <option key={f.id} value={f.id}>{f.full_name} ({f.employee_id})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Classroom (Optional)</label>
              <select className="select" value={slotForm.classroom_id} onChange={e => setSlotForm({...slotForm, classroom_id: e.target.value})}>
                <option value="">-- No Room --</option>
                {classrooms.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.capacity} seats)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Slot Type</label>
              <select className="select" value={slotForm.slot_type} onChange={e => setSlotForm({...slotForm, slot_type: e.target.value})}>
                <option value="theory">Theory</option>
                <option value="lab">Lab</option>
                <option value="tutorial">Tutorial</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-700/50 mt-6">
              {editModal.existingSlot ? (
                <button
                  type="button"
                  onClick={() => {
                    if(confirm('Are you sure you want to clear this slot?')) {
                      deleteSlotMut.mutate(editModal.existingSlot.id)
                    }
                  }}
                  disabled={deleteSlotMut.isPending}
                  className="btn-secondary text-red-400 hover:text-red-300 hover:border-red-500/50 flex-1 justify-center"
                >
                  Clear Slot
                </button>
              ) : (
                <button type="button" onClick={() => setEditModal(null)} className="btn-secondary flex-1 justify-center">
                  Cancel
                </button>
              )}

              <button
                type="submit"
                disabled={createSlotMut.isPending || updateSlotMut.isPending}
                className="btn-primary flex-1 justify-center"
              >
                {editModal.existingSlot ? 'Update Slot' : 'Assign Slot'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
