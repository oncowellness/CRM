import { useState } from 'react'
import { AlertTriangle, CheckCircle, AlertCircle, Calendar, Phone, Mail, Stethoscope, FileText, Package, Pencil, X, Save } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { JourneyTimeline } from './JourneyTimeline'
import { formatDate, cn } from '../../lib/utils'
import { PHASE_LABELS, TYPE_COLORS, type AlertStatus, type Phase, type MindState, type Patient } from '../../types'

type PatientDraft = Pick<Patient, 'name' | 'age' | 'gender' | 'email' | 'phone' | 'diagnosis' | 'cancerType' | 'stage' | 'oncologist' | 'diagnosisDate' | 'currentPhase' | 'mindState'>

const CANCER_TYPES = [
  'Mama', 'Pulmón', 'Colon/Recto', 'Próstata', 'Linfoma', 'Leucemia',
  'Melanoma', 'Riñón', 'Vejiga', 'Ovario', 'Útero', 'Páncreas', 'Hígado', 'Otro',
]
const MIND_STATES: MindState[] = ['Activo', 'Ansioso', 'Depresivo', 'Resiliente', 'Vulnerable']
const PHASES = Object.keys(PHASE_LABELS) as Phase[]

const iCls = 'w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400'

const ALERT_CONFIG: Record<AlertStatus, { label: string; icon: React.ReactNode; classes: string; border: string }> = {
  verde: {
    label: 'Estable',
    icon: <CheckCircle size={16} />,
    classes: 'bg-green-50 text-green-700',
    border: 'border-green-200',
  },
  amarillo: {
    label: 'Requiere Atención',
    icon: <AlertCircle size={16} />,
    classes: 'bg-yellow-50 text-yellow-700',
    border: 'border-yellow-200',
  },
  rojo: {
    label: 'ALERTA ROJA',
    icon: <AlertTriangle size={16} />,
    classes: 'bg-red-50 text-red-700',
    border: 'border-red-400',
  },
}

export function PatientDetail() {
  const { selectedPatientId, patients, acknowledgeCrisis, updatePatient, programs } = useStore()
  const patient = patients.find(p => p.id === selectedPatientId)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<PatientDraft>({} as PatientDraft)

  if (!patient) return null

  function startEdit() {
    setDraft({
      name: patient!.name,
      age: patient!.age,
      gender: patient!.gender,
      email: patient!.email,
      phone: patient!.phone,
      diagnosis: patient!.diagnosis,
      cancerType: patient!.cancerType,
      stage: patient!.stage,
      oncologist: patient!.oncologist,
      diagnosisDate: patient!.diagnosisDate,
      currentPhase: patient!.currentPhase,
      mindState: patient!.mindState,
    })
    setEditing(true)
  }

  function saveEdit() {
    updatePatient(patient!.id, draft)
    setEditing(false)
  }

  const alert = ALERT_CONFIG[patient.alertStatus]
  const assignedProgramDetails = programs.filter(pr => patient.assignedPrograms.includes(pr.code))
  const pendingCrisis = patient.crisisOrders.filter(c => c.status === 'pendiente')
  const latestPHQ9 = patient.phq9[patient.phq9.length - 1]
  const latestHandgrip = patient.handgrip[patient.handgrip.length - 1]
  const baselineHandgrip = patient.handgrip.find(h => h.isBaseline)
  const latestSixMWT = patient.sixMWT[patient.sixMWT.length - 1]
  const baselineSixMWT = patient.sixMWT.find(s => s.isBaseline)

  return (
    <div className="p-6 space-y-5">
      {/* Crisis banner */}
      {pendingCrisis.length > 0 && (
        <div className="bg-red-50 border border-red-300 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-red-700">
              {pendingCrisis.length} Orden{pendingCrisis.length > 1 ? 'es' : ''} de Crisis Pendiente{pendingCrisis.length > 1 ? 's' : ''}
            </p>
            {pendingCrisis.map(c => (
              <div key={c.id} className="mt-2 flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-red-200">
                <div>
                  <p className="text-xs font-semibold text-red-700">PS-01: Intervención en Crisis</p>
                  <p className="text-xs text-red-500">{c.trigger} · {formatDate(c.date)}</p>
                </div>
                <button
                  onClick={() => acknowledgeCrisis(patient.id, c.id)}
                  className="text-xs bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700"
                >
                  Marcar Atendida
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patient header card */}
      <div className={cn('bg-white rounded-xl border p-5', alert.border)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 text-xl font-bold shrink-0">
              {patient.name.charAt(0)}
            </div>
            {editing ? (
              <div className="grid grid-cols-2 gap-2 flex-1">
                <div className="col-span-2">
                  <label className="text-[10px] text-slate-400 font-medium">Nombre</label>
                  <input className={iCls} value={draft.name ?? ''} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-medium">Edad</label>
                  <input type="number" className={iCls} value={draft.age ?? ''} onChange={e => setDraft(d => ({ ...d, age: parseInt(e.target.value) || 0 }))} />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-medium">Sexo</label>
                  <select className={iCls} value={draft.gender} onChange={e => setDraft(d => ({ ...d, gender: e.target.value as 'M' | 'F' }))}>
                    <option value="F">Mujer</option>
                    <option value="M">Hombre</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] text-slate-400 font-medium">Diagnóstico</label>
                  <input className={iCls} value={draft.diagnosis ?? ''} onChange={e => setDraft(d => ({ ...d, diagnosis: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-medium">Tipo de cáncer</label>
                  <select className={iCls} value={draft.cancerType ?? ''} onChange={e => setDraft(d => ({ ...d, cancerType: e.target.value }))}>
                    <option value="—">— Sin especificar —</option>
                    {CANCER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-medium">Estadio TNM</label>
                  <input className={iCls} value={draft.stage ?? ''} onChange={e => setDraft(d => ({ ...d, stage: e.target.value }))} />
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-bold text-slate-800">{patient.name}</h2>
                <p className="text-sm text-slate-500">
                  {patient.age} años · {patient.gender === 'F' ? 'Mujer' : 'Hombre'} · {patient.cancerType} Estadio {patient.stage}
                </p>
                <p className="text-sm text-slate-500 mt-0.5">{patient.diagnosis}</p>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className={cn('flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full', alert.classes)}>
              {alert.icon} {alert.label}
            </span>
            {editing ? (
              <select className="text-xs border border-slate-200 rounded-full px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                value={draft.mindState} onChange={e => setDraft(d => ({ ...d, mindState: e.target.value as MindState }))}>
                {MIND_STATES.map(ms => <option key={ms} value={ms}>{ms}</option>)}
              </select>
            ) : (
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                Estado mental: {patient.mindState}
              </span>
            )}
            {editing ? (
              <div className="flex gap-1.5 mt-1">
                <button onClick={() => setEditing(false)} className="flex items-center gap-1 text-xs text-slate-500 border border-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-50">
                  <X size={12} /> Cancelar
                </button>
                <button onClick={saveEdit} className="flex items-center gap-1 text-xs text-white bg-teal-600 px-2.5 py-1 rounded-lg hover:bg-teal-700">
                  <Save size={12} /> Guardar
                </button>
              </div>
            ) : (
              <button onClick={startEdit} className="flex items-center gap-1 text-xs text-slate-500 border border-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-50 mt-1">
                <Pencil size={12} /> Editar
              </button>
            )}
          </div>
        </div>

        {/* Contact & clinical info */}
        {editing ? (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 font-medium block mb-0.5">Email</label>
              <input type="email" className={iCls} value={draft.email ?? ''} onChange={e => setDraft(d => ({ ...d, email: e.target.value }))} />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-medium block mb-0.5">Teléfono</label>
              <input type="tel" className={iCls} value={draft.phone ?? ''} onChange={e => setDraft(d => ({ ...d, phone: e.target.value }))} />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-medium block mb-0.5">Oncólogo/a</label>
              <input className={iCls} value={draft.oncologist ?? ''} onChange={e => setDraft(d => ({ ...d, oncologist: e.target.value }))} />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-medium block mb-0.5">Fecha diagnóstico</label>
              <input type="date" className={iCls} value={draft.diagnosisDate ?? ''} onChange={e => setDraft(d => ({ ...d, diagnosisDate: e.target.value }))} />
            </div>
            <div className="col-span-2 lg:col-span-4">
              <label className="text-[10px] text-slate-400 font-medium block mb-1">Fase del Journey</label>
              <div className="flex flex-wrap gap-1.5">
                {PHASES.map(phase => (
                  <button key={phase} onClick={() => setDraft(d => ({ ...d, currentPhase: phase }))}
                    className={cn('text-xs px-2.5 py-1 rounded-full border font-medium transition-colors',
                      draft.currentPhase === phase ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                    )}>
                    {phase} · {PHASE_LABELS[phase]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Mail size={13} className="text-slate-400" />
              {patient.email || <span className="text-slate-300 italic">Sin email</span>}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Phone size={13} className="text-slate-400" />
              {patient.phone || <span className="text-slate-300 italic">Sin teléfono</span>}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Stethoscope size={13} className="text-slate-400" />
              {patient.oncologist}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Calendar size={13} className="text-slate-400" />
              Dx: {formatDate(patient.diagnosisDate)}
            </div>
          </div>
        )}
      </div>

      {/* Journey timeline */}
      <JourneyTimeline patient={patient} />

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Handgrip */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Handgrip (dominante)</p>
          <p className="text-2xl font-bold text-slate-800">
            {latestHandgrip ? `${latestHandgrip.dominantHand} kg` : 'N/D'}
          </p>
          {baselineHandgrip && latestHandgrip && latestHandgrip !== baselineHandgrip && (
            <p className={cn(
              'text-xs mt-1 font-medium',
              latestHandgrip.dominantHand >= baselineHandgrip.dominantHand ? 'text-green-600' : 'text-red-500'
            )}>
              {latestHandgrip.dominantHand >= baselineHandgrip.dominantHand ? '↑' : '↓'}
              {' '}{Math.abs(latestHandgrip.dominantHand - baselineHandgrip.dominantHand).toFixed(1)} kg vs basal
            </p>
          )}
        </div>
        {/* 6MWT */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">6MWT (distancia)</p>
          <p className="text-2xl font-bold text-slate-800">
            {latestSixMWT ? `${latestSixMWT.distanceMeters} m` : 'N/D'}
          </p>
          {baselineSixMWT && latestSixMWT && latestSixMWT !== baselineSixMWT && (
            <p className={cn(
              'text-xs mt-1 font-medium',
              latestSixMWT.distanceMeters >= baselineSixMWT.distanceMeters ? 'text-green-600' : 'text-red-500'
            )}>
              {latestSixMWT.distanceMeters >= baselineSixMWT.distanceMeters ? '↑' : '↓'}
              {' '}{Math.abs(latestSixMWT.distanceMeters - baselineSixMWT.distanceMeters)} m vs basal
            </p>
          )}
        </div>
        {/* PHQ-9 */}
        <div className={cn(
          'rounded-xl border p-4',
          latestPHQ9?.totalScore >= 10 ? 'bg-red-50 border-red-300' : 'bg-white border-slate-200'
        )}>
          <p className="text-xs text-slate-500 mb-1">PHQ-9 (último)</p>
          <p className={cn(
            'text-2xl font-bold',
            latestPHQ9?.totalScore >= 10 ? 'text-red-600' : 'text-slate-800'
          )}>
            {latestPHQ9 ? latestPHQ9.totalScore : 'N/D'}
          </p>
          {latestPHQ9 && (
            <p className="text-xs mt-1 text-slate-500 capitalize">
              {latestPHQ9.severity.replace('_', ' ')}
              {latestPHQ9.totalScore >= 10 && ' ⚠️'}
            </p>
          )}
        </div>
        {/* FACIT-F */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">FACIT-F (fatiga)</p>
          <p className="text-2xl font-bold text-slate-800">
            {patient.facitf.length > 0
              ? patient.facitf[patient.facitf.length - 1].totalScore
              : 'N/D'}
          </p>
          <p className="text-xs text-slate-400 mt-1">Rango 0–52 (mayor = mejor)</p>
        </div>
      </div>

      {/* Programs & Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Active programs */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Package size={16} className="text-teal-600" />
            <h3 className="text-sm font-semibold text-slate-700">Programas Activos</h3>
          </div>
          <div className="space-y-2">
            {assignedProgramDetails.map(prog => (
              <div key={prog.code} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div>
                  <p className="text-xs font-semibold text-slate-700">{prog.code} – {prog.name}</p>
                  <p className="text-xs text-slate-400">{prog.description}</p>
                </div>
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', TYPE_COLORS[prog.type])}>
                  {prog.type}
                </span>
              </div>
            ))}
            {assignedProgramDetails.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">Sin programas asignados</p>
            )}
          </div>
        </div>

        {/* Recent sessions */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={16} className="text-teal-600" />
            <h3 className="text-sm font-semibold text-slate-700">Sesiones Recientes</h3>
          </div>
          <div className="space-y-2">
            {patient.sessions.slice(-6).reverse().map(session => {
              const prog = programs.find(p => p.code === session.programCode)
              return (
                <div key={session.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{session.programCode} – {prog?.name}</p>
                    <p className="text-xs text-slate-400">{formatDate(session.date)} · {session.therapist}</p>
                    {session.notes && <p className="text-xs text-slate-500 italic">{session.notes}</p>}
                  </div>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    session.status === 'realizada' && 'bg-green-100 text-green-700',
                    session.status === 'confirmada' && 'bg-blue-100 text-blue-700',
                    session.status === 'pendiente' && 'bg-yellow-100 text-yellow-700',
                    session.status === 'cancelada' && 'bg-red-100 text-red-700',
                  )}>
                    {session.status}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Clinical notes */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={16} className="text-teal-600" />
          <h3 className="text-sm font-semibold text-slate-700">Notas Clínicas</h3>
        </div>
        <div className="space-y-3">
          {patient.clinicalNotes.map(note => (
            <div key={note.id} className="bg-slate-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-700">{note.author}</span>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'text-[10px] px-2 py-0.5 rounded-full',
                    note.type === 'interconsulta' && 'bg-blue-100 text-blue-600',
                    note.type === 'evolucion' && 'bg-green-100 text-green-600',
                    note.type === 'incidencia' && 'bg-red-100 text-red-600',
                  )}>
                    {note.type}
                  </span>
                  <span className="text-xs text-slate-400">{formatDate(note.date)}</span>
                </div>
              </div>
              <p className="text-xs text-slate-600">{note.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
