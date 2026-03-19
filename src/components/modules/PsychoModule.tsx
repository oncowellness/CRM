import { useState, useMemo, useRef, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'
import { Brain, AlertTriangle, CheckCircle, Plus, Info } from 'lucide-react'
import { useStore, computePHQ9Severity } from '../../store/useStore'
import { formatDate, cn } from '../../lib/utils'
import { PHASE_CONTENT_RULES } from '../../data/content'
import type { Patient } from '../../types'

const PHQ9_QUESTIONS = [
  'Poco interés o placer en hacer las cosas',
  'Sentirse decaído/a, deprimido/a o sin esperanzas',
  'Dificultad para quedarse o permanecer dormido/a, o dormir demasiado',
  'Sentirse cansado/a o tener poca energía',
  'Tener poco apetito o comer en exceso',
  'Sentirse mal consigo mismo/a o pensar que es un fracasado/a',
  'Dificultad para concentrarse en cosas',
  'Moverse o hablar tan lentamente que otras personas lo han notado',
  'Pensamientos de que estaría mejor muerto/a o de hacerse daño',
]

const SEVERITY_CONFIG = {
  minimal: { label: 'Mínimo', color: '#22c55e', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', range: '0–4' },
  mild: { label: 'Leve', color: '#84cc16', bg: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-200', range: '5–9' },
  moderate: { label: 'Moderado', color: '#f59e0b', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', range: '10–14' },
  moderately_severe: { label: 'Moderadamente grave', color: '#f97316', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', range: '15–19' },
  severe: { label: 'Grave', color: '#ef4444', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', range: '20–27' },
}

interface Props {
  patient?: Patient
}

export function PsychoModule({ patient: propPatient }: Props) {
  const { patients, selectedPatientId, addPHQ9 } = useStore()
  const patient = propPatient ?? patients.find(p => p.id === selectedPatientId) ?? patients[0]

  const [showForm, setShowForm] = useState(false)
  const [answers, setAnswers] = useState<number[]>(new Array(9).fill(0))
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split('T')[0])
  const [justSubmitted, setJustSubmitted] = useState(false)
  const submitTimerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => () => clearTimeout(submitTimerRef.current), [])

  const chartData = useMemo(() => (patient?.phq9 ?? []).map(a => ({
    date: formatDate(a.date),
    'PHQ-9': a.totalScore,
    severity: a.severity,
  })), [patient?.phq9])

  if (!patient) return <div className="p-6 text-slate-400">Selecciona un paciente</div>

  // Motor de reglas: Obtener contenido basado en la fase actual del paciente
  const contenido = PHASE_CONTENT_RULES[patient.currentPhase] || []

  const totalScore = answers.reduce((s, a) => s + a, 0)
  const severity = computePHQ9Severity(totalScore)
  const latestPHQ9 = patient.phq9[patient.phq9.length - 1]

  function setAnswer(index: number, value: number) {
    setAnswers(prev => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  function submitAssessment() {
    addPHQ9(patient.id, {
      date: assessmentDate,
      answers: [...answers],
      totalScore,
      severity,
    })
    setShowForm(false)
    setAnswers(new Array(9).fill(0))
    setJustSubmitted(true)
    submitTimerRef.current = setTimeout(() => setJustSubmitted(false), 4000)
  }

  const pendingCrisis = patient.crisisOrders.filter(c => c.status === 'pendiente')

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
            <Brain size={18} className="text-purple-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Semáforo de Riesgo Psicológico</h2>
            <p className="text-xs text-slate-500">Paciente: {patient.name}</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 text-sm bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
        >
          <Plus size={14} /> Nuevo PHQ-9
        </button>
      </div>

      {/* Visualización de recursos asignados por el motor de reglas */}
      {contenido.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-2">Recursos Asignados (Fase {patient.currentPhase})</h3>
          <div className="flex gap-2">
            {contenido.map(item => (
              <span key={item} className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-md border border-slate-200">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Auto-trigger alert */}
      {justSubmitted && latestPHQ9?.totalScore >= 10 && (
        <div className="bg-red-50 border border-red-300 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-600 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-700">🚨 Protocolo de Crisis Activado Automáticamente</p>
            <p className="text-sm text-red-600">
              PHQ-9 = {latestPHQ9.totalScore} (≥10). Estado del paciente cambiado a <strong>Alerta Roja</strong>.
              Sesión PS-01 (Intervención en Crisis) generada automáticamente.
            </p>
          </div>
        </div>
      )}

      {justSubmitted && latestPHQ9?.totalScore < 10 && (
        <div className="bg-green-50 border border-green-300 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle size={20} className="text-green-600" />
          <p className="text-sm text-green-700">PHQ-9 registrado correctamente. Sin criterios de crisis.</p>
        </div>
      )}

      {/* Pending crisis orders */}
      {pendingCrisis.length > 0 && !justSubmitted && (
        <div className="bg-red-50 border border-red-300 rounded-xl p-4">
          <p className="text-sm font-bold text-red-700 mb-2">
            <AlertTriangle size={14} className="inline mr-1" />
            {pendingCrisis.length} Orden(es) de Crisis Pendiente(s)
          </p>
          {pendingCrisis.map(c => (
            <p key={c.id} className="text-xs text-red-600">
              · {c.trigger} · {formatDate(c.date)} → PS-01 pendiente de atención
            </p>
          ))}
        </div>
      )}

      {/* Risk semaphore */}
      <div className="grid grid-cols-5 gap-3">
        {(Object.entries(SEVERITY_CONFIG) as [string, typeof SEVERITY_CONFIG[keyof typeof SEVERITY_CONFIG]][]).map(([key, cfg]) => {
          const isActive = latestPHQ9?.severity === key
          const isCritical = key === 'moderate' || key === 'moderately_severe' || key === 'severe'
          return (
            <div key={key} className={cn(
              'rounded-xl border p-3 text-center transition-all',
              cfg.bg, cfg.border,
              isActive && 'ring-2 ring-offset-1 shadow-md scale-105',
              isActive && isCritical ? 'ring-red-400' : isActive ? 'ring-green-400' : ''
            )}>
              <div className="w-6 h-6 rounded-full mx-auto mb-2" style={{ backgroundColor: cfg.color }} />
              <p className={cn('text-xs font-bold', cfg.text)}>{cfg.label}</p>
              <p className="text-[10px] text-slate-400">{cfg.range} pts</p>
              {isActive && <p className="text-[10px] font-semibold mt-1" style={{ color: cfg.color }}>← Actual</p>}
              {key === 'moderate' && (
                <p className="text-[10px] text-red-500 font-medium mt-1">⚡ Umbral crisis</p>
              )}
            </div>
          )
        })}
      </div>

      {/* PHQ-9 form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">
            PHQ-9 – Cuestionario sobre Salud del Paciente
          </h3>
          <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-start gap-2">
            <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-600">
              En las <strong>últimas 2 semanas</strong>, ¿con qué frecuencia le han molestado los siguientes problemas?
              (0=Nunca, 1=Varios días, 2=Más de la mitad, 3=Casi todos los días)
            </p>
          </div>

          <div className="mb-4">
            <label className="text-xs text-slate-600 block mb-1">Fecha de evaluación</label>
            <input type="date" value={assessmentDate} onChange={e => setAssessmentDate(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400" />
          </div>

          <div className="space-y-3">
            {PHQ9_QUESTIONS.map((q, i) => (
              <div key={i} className="flex items-start gap-4">
                <span className="text-xs text-slate-500 w-4 shrink-0 mt-0.5">{i + 1}.</span>
                <p className="text-sm text-slate-700 flex-1">{q}</p>
                <div className="flex gap-2 shrink-0">
                  {[0, 1, 2, 3].map(v => (
                    <button
                      key={v}
                      onClick={() => setAnswer(i, v)}
                      className={cn(
                        'w-8 h-8 rounded-lg text-sm font-medium border transition-colors',
                        answers[i] === v
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300'
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Live score */}
          <div className={cn(
            'mt-5 p-4 rounded-xl border flex items-center justify-between',
            totalScore >= 10 ? 'bg-red-50 border-red-300' : 'bg-slate-50 border-slate-200'
          )}>
            <div>
              <p className="text-sm text-slate-600">Puntuación total</p>
              <p className={cn('text-3xl font-bold', totalScore >= 10 ? 'text-red-600' : 'text-slate-800')}>
                {totalScore}
                <span className="text-sm font-normal text-slate-400"> / 27</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Severidad estimada</p>
              <p className={cn(
                'text-sm font-semibold',
                SEVERITY_CONFIG[severity].text
              )}>
                {SEVERITY_CONFIG[severity].label}
              </p>
              {totalScore >= 10 && (
                <p className="text-xs text-red-600 font-bold mt-1">⚡ Activará protocolo PS-01</p>
              )}
            </div>
          </div>

          <button
            onClick={submitAssessment}
            className="mt-4 w-full bg-purple-600 text-white py-2.5 rounded-lg hover:bg-purple-700 font-medium text-sm"
          >
            Registrar Evaluación PHQ-9
          </button>
        </div>
      )}

      {/* Historical chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Evolución PHQ-9</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 27]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <ReferenceLine y={10} stroke="#ef4444" strokeDasharray="4 4"
                label={{ value: 'Umbral crisis (10)', fill: '#ef4444', fontSize: 10 }} />
              <Bar dataKey="PHQ-9" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry['PHQ-9'] >= 10 ? '#ef4444' : entry['PHQ-9'] >= 5 ? '#f59e0b' : '#22c55e'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Historical list */}
          <div className="mt-4 space-y-2">
            {patient.phq9.slice().reverse().map((a, i) => {
              const cfg = SEVERITY_CONFIG[a.severity]
              return (
                <div key={i} className={cn('flex items-center justify-between p-2.5 rounded-lg border', cfg.bg, cfg.border)}>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cfg.color }} />
                    <span className="text-xs text-slate-600">{formatDate(a.date)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn('text-xs font-semibold', cfg.text)}>{cfg.label}</span>
                    <span className={cn('text-sm font-bold', a.totalScore >= 10 ? 'text-red-600' : 'text-slate-700')}>
                      {a.totalScore} pts
                    </span>
                    {a.totalScore >= 10 && <AlertTriangle size={14} className="text-red-500" />}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
