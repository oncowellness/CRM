import { useState, useMemo } from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
} from 'recharts'
import { Activity, TrendingUp, TrendingDown, Minus, Plus, CheckCircle, AlertTriangle, AlertCircle, Shield } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { formatDate } from '../../lib/utils'
import type { Patient, TransversoScore } from '../../types'

interface Props {
  patient?: Patient
}

function DeltaBadge({ current, baseline }: { current: number; baseline: number }) {
  const delta = current - baseline
  if (delta > 0) return <span className="text-xs text-green-600 flex items-center gap-0.5"><TrendingUp size={12} />+{delta.toFixed(1)}</span>
  if (delta < 0) return <span className="text-xs text-red-500 flex items-center gap-0.5"><TrendingDown size={12} />{delta.toFixed(1)}</span>
  return <span className="text-xs text-slate-400 flex items-center gap-0.5"><Minus size={12} />0</span>
}

function get30STSNormative(age: number, gender: 'M' | 'F'): number {
  if (gender === 'F') {
    if (age < 60) return 12
    if (age < 65) return 12
    if (age < 70) return 11
    if (age < 75) return 10
    if (age < 80) return 10
    if (age < 85) return 9
    return 8
  } else {
    if (age < 60) return 14
    if (age < 65) return 14
    if (age < 70) return 12
    if (age < 75) return 12
    if (age < 80) return 11
    if (age < 85) return 10
    return 8
  }
}

const TRANSVERSO_LABELS: Record<TransversoScore, string> = {
  0: 'Nula', 1: 'Pobre', 2: 'Moderada', 3: 'Correcta',
}

const TRANSVERSO_COLORS: Record<TransversoScore, string> = {
  0: 'text-red-600 bg-red-50 border-red-200',
  1: 'text-orange-600 bg-orange-50 border-orange-200',
  2: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  3: 'text-green-600 bg-green-50 border-green-200',
}

export function PhysioModule({ patient: propPatient }: Props) {
  const { patients, selectedPatientId, addHandgrip, addSixMWT, addThirtySTS, addTUG, addTransverso, addBalance } = useStore()

  const patient = propPatient ?? patients.find(p => p.id === selectedPatientId) ?? patients[0]

  const [showHandgripForm, setShowHandgripForm] = useState(false)
  const [showSixMWTForm, setShowSixMWTForm] = useState(false)
  const [showSTSForm, setShowSTSForm] = useState(false)
  const [showTUGForm, setShowTUGForm] = useState(false)
  const [showTransversoForm, setShowTransversoForm] = useState(false)
  const [showBalanceForm, setShowBalanceForm] = useState(false)

  // Handgrip form state
  const [hgDom, setHgDom] = useState('')
  const [hgNonDom, setHgNonDom] = useState('')
  const [hgDate, setHgDate] = useState(new Date().toISOString().split('T')[0])

  // 6MWT form state
  const [mwtDist, setMwtDist] = useState('')
  const [mwtHR, setMwtHR] = useState('')
  const [mwtFatigue, setMwtFatigue] = useState('')
  const [mwtDate, setMwtDate] = useState(new Date().toISOString().split('T')[0])

  // 30STS form state
  const [stsReps, setStsReps] = useState('')
  const [stsDate, setStsDate] = useState(new Date().toISOString().split('T')[0])
  const [stsBaseline, setStsBaseline] = useState(false)

  // TUG form state
  const [tugSecs, setTugSecs] = useState('')
  const [tugDate, setTugDate] = useState(new Date().toISOString().split('T')[0])
  const [tugBaseline, setTugBaseline] = useState(false)

  // Transverso form state
  const [transScore, setTransScore] = useState<TransversoScore>(2)
  const [transDate, setTransDate] = useState(new Date().toISOString().split('T')[0])

  // Balance form state
  const [balSecs, setBalSecs] = useState('')
  const [balDate, setBalDate] = useState(new Date().toISOString().split('T')[0])
  const [balType, setBalType] = useState<'monopodal' | 'romberg'>('monopodal')
  const [balBaseline, setBalBaseline] = useState(false)

  const radarData = useMemo(() => {
    if (!patient) return []
    const baselineHandgrip = patient.handgrip.find(h => h.isBaseline)
    const latestHandgrip = patient.handgrip[patient.handgrip.length - 1]
    const baselineSixMWT = patient.sixMWT.find(s => s.isBaseline)
    const latestSixMWT = patient.sixMWT[patient.sixMWT.length - 1]
    const latestSTS = patient.thirtySTS[patient.thirtySTS.length - 1]
    const baselineSTS = patient.thirtySTS.find(s => s.isBaseline)
    const latestTUG = patient.tug[patient.tug.length - 1]
    const latestBalance = patient.balance[patient.balance.length - 1]
    const baselineBalance = patient.balance.find(b => b.isBaseline)
    const basalTUG = patient.tug.find(t => t.isBaseline)
    return [
      { domain: 'Fuerza', actual: Math.round(Math.min(100, latestHandgrip ? (latestHandgrip.dominantHand / 50) * 100 : 0)), basal: Math.round(Math.min(100, baselineHandgrip ? (baselineHandgrip.dominantHand / 50) * 100 : 0)) },
      { domain: 'Resistencia', actual: Math.round(Math.min(100, latestSixMWT ? (latestSixMWT.distanceMeters / 600) * 100 : 0)), basal: Math.round(Math.min(100, baselineSixMWT ? (baselineSixMWT.distanceMeters / 600) * 100 : 0)) },
      { domain: 'Agilidad', actual: Math.round(Math.max(0, latestTUG ? ((20 - latestTUG.seconds) / 15) * 100 : 0)), basal: Math.round(Math.max(0, basalTUG ? ((20 - basalTUG.seconds) / 15) * 100 : 0)) },
      { domain: 'Fuerza MMII', actual: Math.round(Math.min(100, latestSTS ? (latestSTS.reps / 20) * 100 : 0)), basal: Math.round(Math.min(100, baselineSTS ? (baselineSTS.reps / 20) * 100 : 0)) },
      { domain: 'Equilibrio', actual: Math.round(Math.min(100, latestBalance ? (latestBalance.seconds / 30) * 100 : 0)), basal: Math.round(Math.min(100, baselineBalance ? (baselineBalance.seconds / 30) * 100 : 0)) },
    ]
  }, [patient?.handgrip, patient?.sixMWT, patient?.tug, patient?.thirtySTS, patient?.balance])

  const handgripData = useMemo(() => (patient?.handgrip ?? []).map(h => ({
    date: formatDate(h.date),
    Dominante: h.dominantHand,
    'No Dominante': h.nonDominantHand,
    isBaseline: h.isBaseline,
  })), [patient?.handgrip])

  const sixMWTData = useMemo(() => (patient?.sixMWT ?? []).map(s => ({
    date: formatDate(s.date),
    'Distancia (m)': s.distanceMeters,
    'FC Pico': s.heartRatePeak ?? 0,
    'Fatiga Borg': (s.fatigue ?? 0) * 10,
    isBaseline: s.isBaseline,
  })), [patient?.sixMWT])

  if (!patient) return <div className="p-6 text-slate-400">Selecciona un paciente</div>

  const baselineHandgrip = patient.handgrip.find(h => h.isBaseline)
  const latestHandgrip = patient.handgrip[patient.handgrip.length - 1]
  const baselineSixMWT = patient.sixMWT.find(s => s.isBaseline)
  const latestSixMWT = patient.sixMWT[patient.sixMWT.length - 1]
  const latestSTS = patient.thirtySTS[patient.thirtySTS.length - 1]
  const baselineSTS = patient.thirtySTS.find(s => s.isBaseline)
  const latestTUG = patient.tug[patient.tug.length - 1]
  const latestTransverso = patient.transverso[patient.transverso.length - 1]
  const latestBalance = patient.balance[patient.balance.length - 1]
  const baselineBalance = patient.balance.find(b => b.isBaseline)

  const normative30STS = get30STSNormative(patient.age, patient.gender)

  function submitHandgrip() {
    if (!hgDom || !hgNonDom) return
    addHandgrip(patient.id, {
      date: hgDate,
      dominantHand: parseFloat(hgDom),
      nonDominantHand: parseFloat(hgNonDom),
    })
    setShowHandgripForm(false)
    setHgDom(''); setHgNonDom('')
  }

  function submitSixMWT() {
    if (!mwtDist) return
    addSixMWT(patient.id, {
      date: mwtDate,
      distanceMeters: parseInt(mwtDist),
      heartRatePeak: mwtHR ? parseInt(mwtHR) : undefined,
      fatigue: mwtFatigue ? parseInt(mwtFatigue) : undefined,
    })
    setShowSixMWTForm(false)
    setMwtDist(''); setMwtHR(''); setMwtFatigue('')
  }

  function submitSTS() {
    if (!stsReps) return
    addThirtySTS(patient.id, {
      date: stsDate,
      reps: parseInt(stsReps),
      isBaseline: stsBaseline ? true : undefined,
    })
    setShowSTSForm(false)
    setStsReps(''); setStsBaseline(false)
  }

  function submitTUG() {
    if (!tugSecs) return
    addTUG(patient.id, {
      date: tugDate,
      seconds: parseFloat(tugSecs),
      isBaseline: tugBaseline ? true : undefined,
    })
    setShowTUGForm(false)
    setTugSecs(''); setTugBaseline(false)
  }

  function submitTransverso() {
    addTransverso(patient.id, {
      date: transDate,
      score: transScore,
    })
    setShowTransversoForm(false)
  }

  function submitBalance() {
    if (!balSecs) return
    addBalance(patient.id, {
      date: balDate,
      seconds: parseFloat(balSecs),
      testType: balType,
      isBaseline: balBaseline ? true : undefined,
    })
    setShowBalanceForm(false)
    setBalSecs(''); setBalBaseline(false)
  }

  const tugAlert = latestTUG && latestTUG.seconds > 12
  const stsAlert = latestSTS && latestSTS.reps < normative30STS
  const transversoAlert = latestTransverso && latestTransverso.score === 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
            <Activity size={18} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Dashboard de Recuperación Funcional</h2>
            <p className="text-xs text-slate-500">Paciente: {patient.name}</p>
          </div>
        </div>
      </div>

      {/* Clinical alerts */}
      {(tugAlert || stsAlert || transversoAlert) && (
        <div className="space-y-2">
          {tugAlert && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle size={16} className="text-red-600 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">
                <span className="font-semibold">Alto Riesgo de Caída</span> — TUG {latestTUG.seconds}s &gt; 12s. Se recomienda derivación a FX-05.
              </p>
            </div>
          )}
          {stsAlert && (
            <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
              <AlertTriangle size={16} className="text-orange-600 mt-0.5 shrink-0" />
              <p className="text-sm text-orange-700">
                <span className="font-semibold">Posible Sarcopenia</span> — {latestSTS.reps} reps &lt; valor normativo ({normative30STS}). Revisar con NU-01.
              </p>
            </div>
          )}
          {transversoAlert && (
            <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
              <Shield size={16} className="text-yellow-600 mt-0.5 shrink-0" />
              <p className="text-sm text-yellow-700">
                <span className="font-semibold">Precaución en ejercicios de alta carga</span> — Activación del Transverso: Nula. Riesgo de hernia o diástasis.
              </p>
            </div>
          )}
        </div>
      )}

      {/* KPI cards — Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Handgrip Basal (dom.)</p>
          <p className="text-2xl font-bold text-blue-600">{baselineHandgrip ? `${baselineHandgrip.dominantHand} kg` : 'N/D'}</p>
          <p className="text-xs text-slate-400 mt-1">Valor de referencia</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Handgrip Actual (dom.)</p>
          <p className="text-2xl font-bold text-slate-800">{latestHandgrip ? `${latestHandgrip.dominantHand} kg` : 'N/D'}</p>
          {baselineHandgrip && latestHandgrip && latestHandgrip !== baselineHandgrip && (
            <DeltaBadge current={latestHandgrip.dominantHand} baseline={baselineHandgrip.dominantHand} />
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">6MWT Basal</p>
          <p className="text-2xl font-bold text-blue-600">{baselineSixMWT ? `${baselineSixMWT.distanceMeters} m` : 'N/D'}</p>
          <p className="text-xs text-slate-400 mt-1">Valor de referencia</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">6MWT Actual</p>
          <p className="text-2xl font-bold text-slate-800">{latestSixMWT ? `${latestSixMWT.distanceMeters} m` : 'N/D'}</p>
          {baselineSixMWT && latestSixMWT && latestSixMWT !== baselineSixMWT && (
            <DeltaBadge current={latestSixMWT.distanceMeters} baseline={baselineSixMWT.distanceMeters} />
          )}
        </div>
      </div>

      {/* KPI cards — Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">30STS Actual</p>
          <p className={`text-2xl font-bold ${stsAlert ? 'text-orange-600' : 'text-slate-800'}`}>
            {latestSTS ? `${latestSTS.reps} reps` : 'N/D'}
          </p>
          {latestSTS && (
            <p className="text-xs text-slate-400 mt-1">Normativo: ≥{normative30STS} reps</p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">TUG Actual</p>
          <p className={`text-2xl font-bold ${tugAlert ? 'text-red-600' : 'text-slate-800'}`}>
            {latestTUG ? `${latestTUG.seconds}s` : 'N/D'}
          </p>
          {latestTUG && (
            <p className="text-xs text-slate-400 mt-1">{tugAlert ? 'Riesgo de caída' : 'Dentro del rango'}</p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Transverso</p>
          {latestTransverso ? (
            <span className={`inline-block text-sm font-semibold px-2 py-1 rounded-lg border mt-1 ${TRANSVERSO_COLORS[latestTransverso.score]}`}>
              {TRANSVERSO_LABELS[latestTransverso.score]}
            </span>
          ) : (
            <p className="text-2xl font-bold text-slate-800">N/D</p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Equilibrio Actual</p>
          <p className="text-2xl font-bold text-slate-800">{latestBalance ? `${latestBalance.seconds}s` : 'N/D'}</p>
          {latestBalance && baselineBalance && latestBalance !== baselineBalance && (
            <DeltaBadge current={latestBalance.seconds} baseline={baselineBalance.seconds} />
          )}
        </div>
      </div>

      {/* Radar chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Perfil Funcional Integral</h3>
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="domain" tick={{ fontSize: 11 }} />
            <Radar name="Actual" dataKey="actual" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.3} />
            <Radar name="Basal" dataKey="basal" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.15} strokeDasharray="4 4" />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Handgrip chart + form */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700">Evolución Fuerza de Prensión (Handgrip)</h3>
          <button
            onClick={() => setShowHandgripForm(!showHandgripForm)}
            className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg"
          >
            <Plus size={12} /> Registrar
          </button>
        </div>

        {showHandgripForm && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-end gap-3 flex-wrap">
            <div>
              <label className="text-xs text-slate-600 block mb-1">Fecha</label>
              <input type="date" value={hgDate} onChange={e => setHgDate(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Mano Dominante (kg) *</label>
              <input type="number" step="0.1" value={hgDom} onChange={e => setHgDom(e.target.value)} placeholder="0.0"
                className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 w-28 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Mano No Dominante (kg) *</label>
              <input type="number" step="0.1" value={hgNonDom} onChange={e => setHgNonDom(e.target.value)} placeholder="0.0"
                className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 w-28 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <button onClick={submitHandgrip}
              className="flex items-center gap-1.5 text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700">
              <CheckCircle size={14} /> Guardar
            </button>
          </div>
        )}

        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={handgripData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit=" kg" />
            <Tooltip />
            <Legend />
            {baselineHandgrip && (
              <ReferenceLine y={baselineHandgrip.dominantHand} stroke="#93c5fd" strokeDasharray="4 4"
                label={{ value: 'Basal', fill: '#93c5fd', fontSize: 10 }} />
            )}
            <Line type="monotone" dataKey="Dominante" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
            <Line type="monotone" dataKey="No Dominante" stroke="#93c5fd" strokeWidth={2} dot={{ fill: '#93c5fd', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 6MWT chart + form */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700">Evolución Test de Marcha (6MWT)</h3>
          <button
            onClick={() => setShowSixMWTForm(!showSixMWTForm)}
            className="flex items-center gap-1.5 text-xs bg-teal-50 text-teal-600 hover:bg-teal-100 px-3 py-1.5 rounded-lg"
          >
            <Plus size={12} /> Registrar
          </button>
        </div>

        {showSixMWTForm && (
          <div className="mb-4 p-4 bg-teal-50 rounded-lg border border-teal-100 flex items-end gap-3 flex-wrap">
            <div>
              <label className="text-xs text-slate-600 block mb-1">Fecha</label>
              <input type="date" value={mwtDate} onChange={e => setMwtDate(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Distancia (m) *</label>
              <input type="number" value={mwtDist} onChange={e => setMwtDist(e.target.value)} placeholder="0"
                className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 w-24 focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">FC Pico (bpm)</label>
              <input type="number" value={mwtHR} onChange={e => setMwtHR(e.target.value)} placeholder="0"
                className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 w-24 focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Fatiga Borg (0–10)</label>
              <input type="number" min="0" max="10" value={mwtFatigue} onChange={e => setMwtFatigue(e.target.value)} placeholder="0"
                className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 w-24 focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>
            <button onClick={submitSixMWT}
              className="flex items-center gap-1.5 text-sm bg-teal-600 text-white px-4 py-1.5 rounded-lg hover:bg-teal-700">
              <CheckCircle size={14} /> Guardar
            </button>
          </div>
        )}

        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={sixMWTData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            {baselineSixMWT && (
              <ReferenceLine y={baselineSixMWT.distanceMeters} stroke="#6ee7b7" strokeDasharray="4 4"
                label={{ value: 'Basal', fill: '#6ee7b7', fontSize: 10 }} />
            )}
            <Line type="monotone" dataKey="Distancia (m)" stroke="#14b8a6" strokeWidth={2} dot={{ fill: '#14b8a6', r: 4 }} />
            <Line type="monotone" dataKey="FC Pico" stroke="#f97316" strokeWidth={1.5} strokeDasharray="4 4" dot={{ fill: '#f97316', r: 3 }} />
          </LineChart>
        </ResponsiveContainer>

        {/* History table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-slate-500 py-2 pr-4">Fecha</th>
                <th className="text-left text-slate-500 py-2 pr-4">Distancia</th>
                <th className="text-left text-slate-500 py-2 pr-4">FC Pico</th>
                <th className="text-left text-slate-500 py-2 pr-4">Borg</th>
                <th className="text-left text-slate-500 py-2">Δ vs Basal</th>
              </tr>
            </thead>
            <tbody>
              {patient.sixMWT.map((s, i) => (
                <tr key={i} className="border-b border-slate-50 last:border-0">
                  <td className="py-1.5 pr-4 text-slate-600">{formatDate(s.date)}</td>
                  <td className="py-1.5 pr-4 font-medium text-slate-800">{s.distanceMeters} m</td>
                  <td className="py-1.5 pr-4 text-slate-600">{s.heartRatePeak ?? '—'} bpm</td>
                  <td className="py-1.5 pr-4 text-slate-600">{s.fatigue ?? '—'}</td>
                  <td className="py-1.5">
                    {s.isBaseline ? (
                      <span className="text-blue-500 font-medium">Basal</span>
                    ) : baselineSixMWT ? (
                      <DeltaBadge current={s.distanceMeters} baseline={baselineSixMWT.distanceMeters} />
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 30STS */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700">Test de Levantarse y Sentarse 30s (30STS)</h3>
          <button
            onClick={() => setShowSTSForm(!showSTSForm)}
            className="flex items-center gap-1.5 text-xs bg-purple-50 text-purple-600 hover:bg-purple-100 px-3 py-1.5 rounded-lg"
          >
            <Plus size={12} /> Registrar
          </button>
        </div>

        {showSTSForm && (
          <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-100 flex items-end gap-3 flex-wrap">
            <div>
              <label className="text-xs text-slate-600 block mb-1">Fecha</label>
              <input type="date" value={stsDate} onChange={e => setStsDate(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-400" />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Repeticiones *</label>
              <input type="number" value={stsReps} onChange={e => setStsReps(e.target.value)} placeholder="0"
                className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 w-24 focus:outline-none focus:ring-2 focus:ring-purple-400" />
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input type="checkbox" checked={stsBaseline} onChange={e => setStsBaseline(e.target.checked)} className="rounded" />
              Basal
            </label>
            <button onClick={submitSTS}
              className="flex items-center gap-1.5 text-sm bg-purple-600 text-white px-4 py-1.5 rounded-lg hover:bg-purple-700">
              <CheckCircle size={14} /> Guardar
            </button>
          </div>
        )}

        {patient.thirtySTS.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-slate-500 py-2 pr-4">Fecha</th>
                  <th className="text-left text-slate-500 py-2 pr-4">Reps</th>
                  <th className="text-left text-slate-500 py-2 pr-4">Normativo</th>
                  <th className="text-left text-slate-500 py-2">Δ vs Basal</th>
                </tr>
              </thead>
              <tbody>
                {patient.thirtySTS.map((s, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0">
                    <td className="py-1.5 pr-4 text-slate-600">{formatDate(s.date)}</td>
                    <td className="py-1.5 pr-4 font-medium text-slate-800">{s.reps}</td>
                    <td className="py-1.5 pr-4">
                      <span className={`text-xs font-medium ${s.reps >= normative30STS ? 'text-green-600' : 'text-orange-600'}`}>
                        {s.reps >= normative30STS ? '✓' : '↓'} ≥{normative30STS}
                      </span>
                    </td>
                    <td className="py-1.5">
                      {s.isBaseline ? (
                        <span className="text-purple-500 font-medium">Basal</span>
                      ) : baselineSTS ? (
                        <DeltaBadge current={s.reps} baseline={baselineSTS.reps} />
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400">Sin registros. Registra el primer test.</p>
        )}
      </div>

      {/* TUG */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700">Timed Up and Go (TUG)</h3>
          <button
            onClick={() => setShowTUGForm(!showTUGForm)}
            className="flex items-center gap-1.5 text-xs bg-orange-50 text-orange-600 hover:bg-orange-100 px-3 py-1.5 rounded-lg"
          >
            <Plus size={12} /> Registrar
          </button>
        </div>

        {showTUGForm && (
          <div className="mb-4 p-4 bg-orange-50 rounded-lg border border-orange-100 flex items-end gap-3 flex-wrap">
            <div>
              <label className="text-xs text-slate-600 block mb-1">Fecha</label>
              <input type="date" value={tugDate} onChange={e => setTugDate(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Tiempo (s) *</label>
              <input type="number" step="0.1" value={tugSecs} onChange={e => setTugSecs(e.target.value)} placeholder="0.0"
                className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 w-24 focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input type="checkbox" checked={tugBaseline} onChange={e => setTugBaseline(e.target.checked)} className="rounded" />
              Basal
            </label>
            <button onClick={submitTUG}
              className="flex items-center gap-1.5 text-sm bg-orange-600 text-white px-4 py-1.5 rounded-lg hover:bg-orange-700">
              <CheckCircle size={14} /> Guardar
            </button>
          </div>
        )}

        {patient.tug.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-slate-500 py-2 pr-4">Fecha</th>
                  <th className="text-left text-slate-500 py-2 pr-4">Tiempo</th>
                  <th className="text-left text-slate-500 py-2 pr-4">Riesgo Caída</th>
                  <th className="text-left text-slate-500 py-2">Δ vs Basal</th>
                </tr>
              </thead>
              <tbody>
                {patient.tug.map((t, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0">
                    <td className="py-1.5 pr-4 text-slate-600">{formatDate(t.date)}</td>
                    <td className={`py-1.5 pr-4 font-medium ${t.seconds > 12 ? 'text-red-600' : 'text-slate-800'}`}>{t.seconds}s</td>
                    <td className="py-1.5 pr-4">
                      <span className={`text-xs font-medium ${t.seconds > 12 ? 'text-red-600' : 'text-green-600'}`}>
                        {t.seconds > 12 ? 'Alto' : 'Normal'}
                      </span>
                    </td>
                    <td className="py-1.5">
                      {t.isBaseline ? (
                        <span className="text-orange-500 font-medium">Basal</span>
                      ) : basalTUG ? (
                        <DeltaBadge current={-t.seconds} baseline={-basalTUG.seconds} />
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400">Sin registros. Registra el primer test.</p>
        )}
      </div>

      {/* Transverso */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700">Activación del Transverso</h3>
          <button
            onClick={() => setShowTransversoForm(!showTransversoForm)}
            className="flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-lg"
          >
            <Plus size={12} /> Registrar
          </button>
        </div>

        {showTransversoForm && (
          <div className="mb-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100 flex items-end gap-3 flex-wrap">
            <div>
              <label className="text-xs text-slate-600 block mb-1">Fecha</label>
              <input type="date" value={transDate} onChange={e => setTransDate(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Activación</label>
              <select value={transScore} onChange={e => setTransScore(parseInt(e.target.value) as TransversoScore)}
                className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400">
                <option value={0}>0 – Nula</option>
                <option value={1}>1 – Pobre</option>
                <option value={2}>2 – Moderada</option>
                <option value={3}>3 – Correcta</option>
              </select>
            </div>
            <button onClick={submitTransverso}
              className="flex items-center gap-1.5 text-sm bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700">
              <CheckCircle size={14} /> Guardar
            </button>
          </div>
        )}

        {patient.transverso.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-slate-500 py-2 pr-4">Fecha</th>
                  <th className="text-left text-slate-500 py-2">Activación</th>
                </tr>
              </thead>
              <tbody>
                {patient.transverso.map((t, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0">
                    <td className="py-1.5 pr-4 text-slate-600">{formatDate(t.date)}</td>
                    <td className="py-1.5">
                      <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-lg border ${TRANSVERSO_COLORS[t.score]}`}>
                        {t.score} – {TRANSVERSO_LABELS[t.score]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400">Sin registros. Registra el primer test.</p>
        )}
      </div>

      {/* Balance */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700">Test de Equilibrio</h3>
          <button
            onClick={() => setShowBalanceForm(!showBalanceForm)}
            className="flex items-center gap-1.5 text-xs bg-cyan-50 text-cyan-600 hover:bg-cyan-100 px-3 py-1.5 rounded-lg"
          >
            <Plus size={12} /> Registrar
          </button>
        </div>

        {showBalanceForm && (
          <div className="mb-4 p-4 bg-cyan-50 rounded-lg border border-cyan-100 flex items-end gap-3 flex-wrap">
            <div>
              <label className="text-xs text-slate-600 block mb-1">Fecha</label>
              <input type="date" value={balDate} onChange={e => setBalDate(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-400" />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Test</label>
              <select value={balType} onChange={e => setBalType(e.target.value as 'monopodal' | 'romberg')}
                className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-400">
                <option value="monopodal">Monopodal</option>
                <option value="romberg">Romberg</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Segundos *</label>
              <input type="number" step="0.1" value={balSecs} onChange={e => setBalSecs(e.target.value)} placeholder="0.0"
                className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 w-24 focus:outline-none focus:ring-2 focus:ring-cyan-400" />
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input type="checkbox" checked={balBaseline} onChange={e => setBalBaseline(e.target.checked)} className="rounded" />
              Basal
            </label>
            <button onClick={submitBalance}
              className="flex items-center gap-1.5 text-sm bg-cyan-600 text-white px-4 py-1.5 rounded-lg hover:bg-cyan-700">
              <CheckCircle size={14} /> Guardar
            </button>
          </div>
        )}

        {patient.balance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-slate-500 py-2 pr-4">Fecha</th>
                  <th className="text-left text-slate-500 py-2 pr-4">Test</th>
                  <th className="text-left text-slate-500 py-2 pr-4">Segundos</th>
                  <th className="text-left text-slate-500 py-2">Δ vs Basal</th>
                </tr>
              </thead>
              <tbody>
                {patient.balance.map((b, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0">
                    <td className="py-1.5 pr-4 text-slate-600">{formatDate(b.date)}</td>
                    <td className="py-1.5 pr-4 text-slate-600 capitalize">{b.testType}</td>
                    <td className="py-1.5 pr-4 font-medium text-slate-800">{b.seconds}s</td>
                    <td className="py-1.5">
                      {b.isBaseline ? (
                        <span className="text-cyan-500 font-medium">Basal</span>
                      ) : baselineBalance ? (
                        <DeltaBadge current={b.seconds} baseline={baselineBalance.seconds} />
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400">Sin registros. Registra el primer test.</p>
        )}
      </div>
    </div>
  )
}
