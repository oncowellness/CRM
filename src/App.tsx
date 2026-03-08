import './index.css'
import { useStore } from './store/useStore'
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import { MainDashboard } from './components/dashboard/MainDashboard'
import { PatientList } from './components/patients/PatientList'
import { PatientDetail } from './components/patients/PatientDetail'
import { PhysioModule } from './components/modules/PhysioModule'
import { PsychoModule } from './components/modules/PsychoModule'
import { EmpowermentModule } from './components/modules/EmpowermentModule'
import { ClinicalDashboard } from './components/dashboard/ClinicalDashboard'
import { BundleManager } from './components/bundles/BundleManager'
import { ClinicalReport } from './components/reports/ClinicalReport'
import { CalendarView } from './components/calendar/CalendarView'

function ViewContent() {
  const { view, patients, selectedPatientId } = useStore()
  const patient = patients.find(p => p.id === selectedPatientId)

  switch (view) {
    case 'dashboard':
      return <MainDashboard />
    case 'patients':
      return <PatientList />
    case 'patient-detail':
      return (
        <div>
          <PatientDetail />
          {patient && (
            <div className="px-6 pb-6 space-y-5">
              <PhysioModule patient={patient} />
              <PsychoModule patient={patient} />
              <EmpowermentModule patient={patient} />
              <ClinicalDashboard patient={patient} />
              <ClinicalReport patient={patient} />
            </div>
          )}
        </div>
      )
    case 'physio':
      return <PhysioModule />
    case 'psycho':
      return <PsychoModule />
    case 'empowerment':
      return <EmpowermentModule />
    case 'clinical-dashboard':
      return <ClinicalDashboard />
    case 'bundles':
      return <BundleManager />
    case 'calendar':
      return <CalendarView />
    default:
      return <MainDashboard />
  }
}

export default function App() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <ViewContent />
        </main>
      </div>
    </div>
  )
}
