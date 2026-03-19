import {
  LayoutDashboard,
  Users,
  Activity,
  Brain,
  BookOpen,
  BarChart2,
  Package,
  Heart,
  CalendarDays,
  ChevronRight,
  Settings,
  Layers,
} from 'lucide-react'
import { useMemo } from 'react'
import { useStore } from '../../store/useStore'
import type { View, Patient } from '../../types'
import { cn } from '../../lib/utils'

const TOP_NAV: { label: string; icon: React.ReactNode; view: View }[] = [
  { label: 'Inicio', icon: <LayoutDashboard size={18} />, view: 'dashboard' },
  { label: 'Pacientes', icon: <Users size={18} />, view: 'patients' },
]

const BOTTOM_NAV: { label: string; icon: React.ReactNode; view: View }[] = [
  { label: 'Calendario', icon: <CalendarDays size={18} />, view: 'calendar' },
  { label: 'Configuración', icon: <Settings size={18} />, view: 'config-programs' },
]

const CONFIG_NAV: { label: string; icon: React.ReactNode; view: View }[] = [
  { label: 'Programas', icon: <Layers size={16} />, view: 'config-programs' },
  { label: 'Packs', icon: <Package size={16} />, view: 'config-bundles' },
]

const PATIENT_NAV: { label: string; icon: React.ReactNode; view: View }[] = [
  { label: 'Ficha', icon: <Users size={16} />, view: 'patient-detail' },
  { label: 'Fisioterapia', icon: <Activity size={16} />, view: 'physio' },
  { label: 'Psico-oncología', icon: <Brain size={16} />, view: 'psycho' },
  { label: 'Empoderamiento', icon: <BookOpen size={16} />, view: 'empowerment' },
  { label: 'Bundles', icon: <Package size={16} />, view: 'bundles' },
  { label: 'Dashboard Clínico', icon: <BarChart2 size={16} />, view: 'clinical-dashboard' },
]

interface PatientMenuProps {
  patient: Patient
  currentView: View
  onNavigate: (view: View) => void
}

function PatientSidebarMenu({ patient, currentView, onNavigate }: PatientMenuProps) {
  return (
    <div className="my-2 py-2 border-y border-slate-800 bg-slate-800/30 rounded-lg">
      {/* Patient context label */}
      <div className="flex items-center gap-2 px-3 mb-2">
        <ChevronRight size={12} className="text-teal-400 shrink-0" />
        <p className="text-[11px] text-teal-400 font-semibold uppercase tracking-wide truncate">
          {patient.name}
        </p>
      </div>
      <div className="space-y-0.5">
        {PATIENT_NAV.map(item => (
          <button
            key={item.view}
            onClick={() => onNavigate(item.view)}
            className={cn(
              'w-full flex items-center gap-3 pl-6 pr-3 py-2 rounded-lg text-sm font-medium transition-colors',
              currentView === item.view
                ? 'bg-teal-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function Sidebar() {
  const { view, setView, patients, selectedPatientId } = useStore()

  const redAlerts = useMemo(() => patients.filter(p => p.alertStatus === 'rojo').length, [patients])
  const pendingCrisis = useMemo(() => patients.reduce((acc, p) =>
    acc + p.crisisOrders.filter(c => c.status === 'pendiente').length, 0
  ), [patients])

  const selectedPatient = patients.find(p => p.id === selectedPatientId)
  const showPatientMenu = selectedPatient && !['dashboard', 'calendar', 'patients', 'config-programs', 'config-bundles'].includes(view)
  const inConfig = view === 'config-programs' || view === 'config-bundles'

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
            <Heart size={16} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">Oncowellness</p>
            <p className="text-xs text-slate-400">CRM Clínico</p>
          </div>
        </div>
      </div>

      {/* Alerts banner */}
      {(redAlerts > 0 || pendingCrisis > 0) && (
        <div className="mx-3 mt-3 bg-red-900/50 border border-red-700 rounded-lg px-3 py-2">
          <p className="text-xs font-semibold text-red-300">Alertas activas</p>
          {redAlerts > 0 && (
            <p className="text-xs text-red-200">{redAlerts} paciente{redAlerts > 1 ? 's' : ''} en Alerta Roja</p>
          )}
          {pendingCrisis > 0 && (
            <p className="text-xs text-red-200">{pendingCrisis} orden{pendingCrisis > 1 ? 'es' : ''} de crisis pendiente{pendingCrisis > 1 ? 's' : ''}</p>
          )}
        </div>
      )}

      {/* Main navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {TOP_NAV.map(item => (
          <button
            key={item.view}
            onClick={() => setView(item.view)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              view === item.view
                ? 'bg-teal-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}

        {/* Patient sub-nav — only shown when a patient is selected */}
        {showPatientMenu && (
          <PatientSidebarMenu
            patient={selectedPatient}
            currentView={view}
            onNavigate={setView}
          />
        )}

        {BOTTOM_NAV.map(item => (
          <div key={item.view}>
            <button
              onClick={() => setView(item.view)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                inConfig && item.view === 'config-programs'
                  ? 'bg-teal-600 text-white'
                  : view === item.view
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              {item.icon}
              {item.label}
            </button>
            {item.view === 'config-programs' && inConfig && (
              <div className="mt-0.5 space-y-0.5">
                {CONFIG_NAV.map(sub => (
                  <button
                    key={sub.view}
                    onClick={() => setView(sub.view)}
                    className={cn(
                      'w-full flex items-center gap-3 pl-6 pr-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      view === sub.view
                        ? 'bg-teal-600 text-white'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    )}
                  >
                    {sub.icon}
                    {sub.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-700">
        <p className="text-xs text-slate-500">v1.0 · Modelo MSK</p>
      </div>
    </aside>
  )
}
