import { Bell, Search, ChevronRight } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { PHASE_LABELS } from '../../types'

const VIEW_TITLES: Record<string, string> = {
  dashboard: 'Panel Principal',
  patients: 'Gestión de Pacientes',
  'patient-detail': 'Historial del Paciente',
  physio: 'Módulo de Fisioterapia',
  psycho: 'Módulo de Psico-oncología',
  empowerment: 'Empoderamiento del Paciente',
  'clinical-dashboard': 'Dashboard Clínico',
  calendar: 'Calendario de Citas',
  bundles: 'Gestor de Bundles',
}

export function Header() {
  const { view, patients, selectedPatientId, setView, selectPatient } = useStore()

  const patient = selectedPatientId ? patients.find(p => p.id === selectedPatientId) : null
  const pendingAlerts = patients.reduce((acc, p) =>
    acc + p.crisisOrders.filter(c => c.status === 'pendiente').length, 0
  )

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-500">Oncowellness CRM</span>
        <ChevronRight size={14} className="text-slate-400" />
        {view === 'patient-detail' && patient ? (
          <>
            <button
              onClick={() => { setView('patients'); selectPatient(null) }}
              className="text-slate-500 hover:text-teal-600"
            >
              Pacientes
            </button>
            <ChevronRight size={14} className="text-slate-400" />
            <span className="font-medium text-slate-800">{patient.name}</span>
            <span className="ml-2 text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">
              {patient.currentPhase} · {PHASE_LABELS[patient.currentPhase]}
            </span>
          </>
        ) : (
          <span className="font-medium text-slate-800">{VIEW_TITLES[view] ?? view}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center">
          <Search size={16} className="absolute left-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar paciente..."
            className="pl-9 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 w-52"
          />
        </div>
        <button className="relative p-2 hover:bg-slate-100 rounded-lg">
          <Bell size={18} className="text-slate-600" />
          {pendingAlerts > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center">
              {pendingAlerts}
            </span>
          )}
        </button>
        <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
          OW
        </div>
      </div>
    </header>
  )
}
