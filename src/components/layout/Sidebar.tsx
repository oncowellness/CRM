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
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import type { View } from '../../types'
import { cn } from '../../lib/utils'

const NAV_ITEMS: { label: string; icon: React.ReactNode; view: View }[] = [
  { label: 'Inicio', icon: <LayoutDashboard size={18} />, view: 'dashboard' },
  { label: 'Pacientes', icon: <Users size={18} />, view: 'patients' },
  { label: 'Fisioterapia', icon: <Activity size={18} />, view: 'physio' },
  { label: 'Psico-oncología', icon: <Brain size={18} />, view: 'psycho' },
  { label: 'Empoderamiento', icon: <BookOpen size={18} />, view: 'empowerment' },
  { label: 'Dashboard Clínico', icon: <BarChart2 size={18} />, view: 'clinical-dashboard' },
  { label: 'Bundles', icon: <Package size={18} />, view: 'bundles' },
  { label: 'Calendario', icon: <CalendarDays size={18} />, view: 'calendar' },
]

export function Sidebar() {
  const { view, setView, patients } = useStore()

  const redAlerts = patients.filter(p => p.alertStatus === 'rojo').length
  const pendingCrisis = patients.reduce((acc, p) =>
    acc + p.crisisOrders.filter(c => c.status === 'pendiente').length, 0
  )

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

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(item => (
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
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-700">
        <p className="text-xs text-slate-500">v1.0 · Modelo MSK</p>
      </div>
    </aside>
  )
}
