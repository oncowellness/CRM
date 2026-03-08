import { useState } from 'react'
import {
  ChevronLeft, ChevronRight, Plus, X, Check, Trash2, CalendarDays, User, Clock,
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import { PROGRAMS } from '../../data/programs'
import { cn } from '../../lib/utils'
import type { Patient, Session, SessionStatus } from '../../types'

// ─── Constants ────────────────────────────────────────────────────────────────
const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const STATUS_CONFIG: Record<SessionStatus, { label: string; dot: string; badge: string }> = {
  pendiente:  { label: 'Pendiente',  dot: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-700' },
  confirmada: { label: 'Confirmada', dot: 'bg-blue-400',   badge: 'bg-blue-100 text-blue-700' },
  realizada:  { label: 'Realizada',  dot: 'bg-green-400',  badge: 'bg-green-100 text-green-700' },
  cancelada:  { label: 'Cancelada',  dot: 'bg-red-400',    badge: 'bg-red-100 text-red-700' },
}

const PROGRAM_TYPE_COLORS: Record<string, string> = {
  FX: 'bg-blue-500',
  PS: 'bg-purple-500',
  NU: 'bg-green-500',
  EO: 'bg-pink-500',
  TS: 'bg-orange-500',
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface CalendarEvent {
  patientId: string
  patientName: string
  session: Session
  programName: string
  programType: string
}

interface NewSessionForm {
  patientId: string
  programCode: string
  date: string
  time: string
  therapist: string
  notes: string
  status: SessionStatus
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year: number, month: number) {
  // Monday-based: Mon=0 … Sun=6
  const day = new Date(year, month, 1).getDay()
  return (day + 6) % 7
}
function toDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function AppointmentModal({
  date,
  events,
  patients,
  onClose,
  onAdd,
  onStatusChange,
  onDelete,
}: {
  date: string
  events: CalendarEvent[]
  patients: Patient[]
  onClose: () => void
  onAdd: (form: NewSessionForm) => void
  onStatusChange: (patientId: string, sessionId: string, status: SessionStatus) => void
  onDelete: (patientId: string, sessionId: string) => void
}) {
  const [showForm, setShowForm] = useState(events.length === 0)
  const [form, setForm] = useState<NewSessionForm>({
    patientId: patients[0]?.id ?? '',
    programCode: '',
    date,
    time: '10:00',
    therapist: '',
    notes: '',
    status: 'confirmada',
  })

  const selectedPatient = patients.find(p => p.id === form.patientId)
  const availablePrograms = selectedPatient
    ? PROGRAMS.filter(pr => selectedPatient.assignedPrograms.includes(pr.code))
    : []

  function submit() {
    if (!form.patientId || !form.programCode) return
    onAdd(form)
    setShowForm(false)
    setForm(f => ({ ...f, programCode: '', therapist: '', notes: '', status: 'confirmada' }))
  }

  const [day, monthNum, year] = [
    parseInt(date.split('-')[2]),
    parseInt(date.split('-')[1]) - 1,
    parseInt(date.split('-')[0]),
  ]
  const displayDate = `${day} de ${MONTHS[monthNum]} de ${year}`

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CalendarDays size={18} className="text-teal-600" />
            <h2 className="text-sm font-bold text-slate-800">{displayDate}</h2>
            <span className="text-xs text-slate-400">({events.length} cita{events.length !== 1 ? 's' : ''})</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Existing appointments */}
          {events.map(ev => {
            const cfg = STATUS_CONFIG[ev.session.status]
            const typeColor = PROGRAM_TYPE_COLORS[ev.programType] ?? 'bg-slate-400'
            return (
              <div key={ev.session.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', typeColor)} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {ev.session.programCode} – {ev.programName}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <User size={10} className="text-slate-400" />
                        <p className="text-xs text-slate-600">{ev.patientName}</p>
                      </div>
                      {ev.session.therapist && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Clock size={10} className="text-slate-400" />
                          <p className="text-xs text-slate-500">{ev.session.therapist}</p>
                        </div>
                      )}
                      {ev.session.notes && (
                        <p className="text-xs text-slate-400 italic mt-1">{ev.session.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', cfg.badge)}>
                      {cfg.label}
                    </span>
                    <button
                      onClick={() => onDelete(ev.patientId, ev.session.id)}
                      className="p-1 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={12} className="text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Status quick-change */}
                <div className="flex gap-1.5 mt-3">
                  {(Object.keys(STATUS_CONFIG) as SessionStatus[]).map(s => (
                    <button
                      key={s}
                      onClick={() => onStatusChange(ev.patientId, ev.session.id, s)}
                      className={cn(
                        'text-[10px] px-2 py-1 rounded-lg border transition-colors',
                        ev.session.status === s
                          ? STATUS_CONFIG[s].badge + ' border-transparent font-semibold'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      )}
                    >
                      {STATUS_CONFIG[s].label}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}

          {/* Add button */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 hover:border-teal-400 hover:bg-teal-50 rounded-xl py-3 text-sm text-slate-500 hover:text-teal-600 transition-colors"
            >
              <Plus size={16} /> Nueva cita
            </button>
          )}

          {/* New appointment form */}
          {showForm && (
            <div className="bg-teal-50 rounded-xl border border-teal-100 p-4 space-y-3">
              <p className="text-xs font-semibold text-teal-700">Nueva cita – {displayDate}</p>

              {/* Patient */}
              <div>
                <label className="text-xs text-slate-600 block mb-1">Paciente *</label>
                <select
                  value={form.patientId}
                  onChange={e => setForm(f => ({ ...f, patientId: e.target.value, programCode: '' }))}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.cancerType} {p.currentPhase})</option>
                  ))}
                </select>
              </div>

              {/* Program */}
              <div>
                <label className="text-xs text-slate-600 block mb-1">Programa *</label>
                <select
                  value={form.programCode}
                  onChange={e => setForm(f => ({ ...f, programCode: e.target.value }))}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                >
                  <option value="">— Seleccionar programa —</option>
                  {availablePrograms.length > 0 ? (
                    availablePrograms.map(pr => (
                      <option key={pr.code} value={pr.code}>{pr.code} – {pr.name}</option>
                    ))
                  ) : (
                    PROGRAMS.map(pr => (
                      <option key={pr.code} value={pr.code}>{pr.code} – {pr.name}</option>
                    ))
                  )}
                </select>
                {availablePrograms.length > 0 && (
                  <p className="text-[10px] text-teal-600 mt-1">★ Mostrando programas asignados al paciente</p>
                )}
              </div>

              {/* Time + Therapist */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600 block mb-1">Hora</label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 block mb-1">Estado</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value as SessionStatus }))}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                  >
                    {(Object.keys(STATUS_CONFIG) as SessionStatus[]).map(s => (
                      <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Therapist */}
              <div>
                <label className="text-xs text-slate-600 block mb-1">Terapeuta</label>
                <input
                  type="text"
                  value={form.therapist}
                  onChange={e => setForm(f => ({ ...f, therapist: e.target.value }))}
                  placeholder="Nombre del terapeuta"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs text-slate-600 block mb-1">Notas</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Observaciones opcionales..."
                  rows={2}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={submit}
                  disabled={!form.patientId || !form.programCode}
                  className="flex-1 flex items-center justify-center gap-2 bg-teal-600 text-white text-sm py-2 rounded-lg hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Check size={14} /> Guardar cita
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 text-sm text-slate-500 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main CalendarView ─────────────────────────────────────────────────────────
export function CalendarView() {
  const { patients, addSession, updateSessionStatus, deleteSession } = useStore()

  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [filterPatientId, setFilterPatientId] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<SessionStatus | 'all'>('all')

  // Build a map: dateKey → CalendarEvent[]
  const eventMap = new Map<string, CalendarEvent[]>()
  for (const patient of patients) {
    if (filterPatientId !== 'all' && patient.id !== filterPatientId) continue
    for (const session of patient.sessions) {
      if (filterStatus !== 'all' && session.status !== filterStatus) continue
      const prog = PROGRAMS.find(p => p.code === session.programCode)
      const event: CalendarEvent = {
        patientId: patient.id,
        patientName: patient.name,
        session,
        programName: prog?.name ?? session.programCode,
        programType: session.programCode.split('-')[0],
      }
      const key = session.date
      if (!eventMap.has(key)) eventMap.set(key, [])
      eventMap.get(key)!.push(event)
    }
  }

  // Calendar grid
  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)

  function prevMonth() {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
  }
  function nextMonth() {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
  }

  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate())

  // Counts for the header
  const monthEvents = [...eventMap.values()].flat().filter(ev => {
    const d = ev.session.date
    const [y, m] = d.split('-').map(Number)
    return y === currentYear && m === currentMonth + 1
  })
  const confirmadas = monthEvents.filter(e => e.session.status === 'confirmada').length
  const pendientes = monthEvents.filter(e => e.session.status === 'pendiente').length

  // Selected day events
  const selectedEvents = selectedDate ? (eventMap.get(selectedDate) ?? []) : []

  function handleAddSession(form: NewSessionForm) {
    const sessionDate = form.time ? `${form.date}` : form.date
    addSession(form.patientId, {
      programCode: form.programCode,
      date: sessionDate,
      status: form.status,
      therapist: form.therapist || undefined,
      notes: form.notes
        ? `${form.time ? form.time + 'h – ' : ''}${form.notes}`
        : form.time ? `${form.time}h` : undefined,
    })
  }

  return (
    <div className="p-6 space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-teal-100 rounded-lg flex items-center justify-center">
            <CalendarDays size={18} className="text-teal-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Calendario de Citas</h2>
            <p className="text-xs text-slate-500">
              {confirmadas} confirmadas · {pendientes} pendientes este mes
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <select
            value={filterPatientId}
            onChange={e => setFilterPatientId(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            <option value="all">Todos los pacientes</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as SessionStatus | 'all')}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            <option value="all">Todos los estados</option>
            {(Object.keys(STATUS_CONFIG) as SessionStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Calendar card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {/* Month nav */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg">
            <ChevronLeft size={16} className="text-slate-600" />
          </button>
          <h3 className="text-base font-bold text-slate-800">
            {MONTHS[currentMonth]} {currentYear}
          </h3>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg">
            <ChevronRight size={16} className="text-slate-600" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-slate-400 py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7">
          {/* Leading empty cells */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-28 border-b border-r border-slate-50 bg-slate-50/50" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dateKey = toDateKey(currentYear, currentMonth, day)
            const dayEvents = eventMap.get(dateKey) ?? []
            const isToday = dateKey === todayKey
            const isSelected = dateKey === selectedDate
            const isWeekend = ((firstDay + i) % 7) >= 5

            return (
              <div
                key={day}
                onClick={() => setSelectedDate(isSelected ? null : dateKey)}
                className={cn(
                  'h-28 border-b border-r border-slate-100 p-1.5 cursor-pointer transition-colors overflow-hidden',
                  isSelected && 'bg-teal-50 border-teal-200',
                  !isSelected && isWeekend && 'bg-slate-50/60',
                  !isSelected && !isWeekend && 'hover:bg-slate-50',
                )}
              >
                {/* Day number */}
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    'text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full',
                    isToday && 'bg-teal-500 text-white',
                    !isToday && isWeekend && 'text-slate-400',
                    !isToday && !isWeekend && 'text-slate-700',
                  )}>
                    {day}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-[10px] text-slate-400">{dayEvents.length}</span>
                  )}
                </div>

                {/* Events (max 3 visible) */}
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map(ev => {
                    const typeColor = PROGRAM_TYPE_COLORS[ev.programType] ?? 'bg-slate-400'
                    const statusDot = STATUS_CONFIG[ev.session.status].dot
                    return (
                      <div
                        key={ev.session.id}
                        className="flex items-center gap-1 bg-white rounded px-1.5 py-0.5 border border-slate-100 shadow-sm"
                      >
                        <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', typeColor)} />
                        <p className="text-[10px] text-slate-700 truncate flex-1 leading-tight">
                          {ev.session.programCode}
                        </p>
                        <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', statusDot)} />
                      </div>
                    )
                  })}
                  {dayEvents.length > 3 && (
                    <p className="text-[10px] text-slate-400 pl-1">+{dayEvents.length - 3} más</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        <p className="text-xs text-slate-500 font-medium">Tipo:</p>
        {Object.entries(PROGRAM_TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className={cn('w-2.5 h-2.5 rounded-full', color)} />
            <span className="text-xs text-slate-600">{type}</span>
          </div>
        ))}
        <span className="text-slate-200">|</span>
        <p className="text-xs text-slate-500 font-medium">Estado:</p>
        {(Object.entries(STATUS_CONFIG) as [SessionStatus, typeof STATUS_CONFIG[SessionStatus]][]).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={cn('w-2.5 h-2.5 rounded-full', cfg.dot)} />
            <span className="text-xs text-slate-600">{cfg.label}</span>
          </div>
        ))}
      </div>

      {/* Upcoming appointments list */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700">
            Próximas Citas
          </h3>
          <button
            onClick={() => {
              const d = toDateKey(today.getFullYear(), today.getMonth(), today.getDate())
              setSelectedDate(d)
              setCurrentYear(today.getFullYear())
              setCurrentMonth(today.getMonth())
            }}
            className="text-xs text-teal-600 hover:underline"
          >
            + Nueva cita hoy
          </button>
        </div>
        <div className="space-y-2">
          {patients
            .flatMap(p => p.sessions
              .filter(s => s.date >= todayKey && (filterPatientId === 'all' || p.id === filterPatientId) && (filterStatus === 'all' || s.status === filterStatus))
              .map(s => ({ patient: p, session: s }))
            )
            .sort((a, b) => a.session.date.localeCompare(b.session.date))
            .slice(0, 8)
            .map(({ patient, session }) => {
              const prog = PROGRAMS.find(p => p.code === session.programCode)
              const cfg = STATUS_CONFIG[session.status]
              const typeColor = PROGRAM_TYPE_COLORS[session.programCode.split('-')[0]] ?? 'bg-slate-400'
              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between py-2.5 px-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 cursor-pointer"
                  onClick={() => {
                    setSelectedDate(session.date)
                    setCurrentYear(parseInt(session.date.split('-')[0]))
                    setCurrentMonth(parseInt(session.date.split('-')[1]) - 1)
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn('w-2 h-2 rounded-full shrink-0', typeColor)} />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        {session.programCode} – {prog?.name}
                      </p>
                      <p className="text-xs text-slate-500">{patient.name} · {session.therapist ?? '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-slate-500">{session.date}</span>
                    <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', cfg.badge)}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
              )
            })
          }
          {patients.flatMap(p => p.sessions.filter(s => s.date >= todayKey)).length === 0 && (
            <p className="text-xs text-slate-400 text-center py-6">Sin citas próximas</p>
          )}
        </div>
      </div>

      {/* Modal */}
      {selectedDate && (
        <AppointmentModal
          date={selectedDate}
          events={selectedEvents}
          patients={patients}
          onClose={() => setSelectedDate(null)}
          onAdd={handleAddSession}
          onStatusChange={(patientId, sessionId, status) => {
            updateSessionStatus(patientId, sessionId, status)
          }}
          onDelete={(patientId, sessionId) => {
            deleteSession(patientId, sessionId)
            if (selectedEvents.length <= 1) setSelectedDate(null)
          }}
        />
      )}
    </div>
  )
}
