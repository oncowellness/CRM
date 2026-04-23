import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Patient, View, PHQ9Assessment, HandgripMeasurement, SixMWTMeasurement,
  Session, Program, Bundle, ThirtySTSMeasurement, TUGMeasurement,
  TransversoMeasurement, BalanceMeasurement,
} from '../types'
import { MOCK_PATIENTS } from '../data/patients'
import { CONTENT_LIBRARY } from '../data/content'
import { PROGRAMS, BUNDLES } from '../data/programs'

// ── State interface ───────────────────────────────────────────────────────────

interface CRMState {
  // UI state
  view: View
  selectedPatientId: string | null
  clinicId: string | null

  // Data state (persisted in localStorage; replaced by React Query when Supabase is enabled)
  patients: Patient[]
  programs: Program[]
  bundles: Bundle[]

  // UI actions
  setView: (view: View) => void
  selectPatient: (id: string | null) => void
  setClinicId: (id: string | null) => void

  // Data actions (operate on local state; mirrored to Supabase via mutations in hooks)
  getPatient: (id: string) => Patient | undefined
  addPatient: (patient: Omit<Patient, 'id' | 'handgrip' | 'sixMWT' | 'thirtySTS' | 'tug' | 'transverso' | 'balance' | 'phq9' | 'gad7' | 'facitf' | 'eortc' | 'sessions' | 'contentItems' | 'crisisOrders' | 'clinicalNotes'>) => void
  updatePatient: (id: string, fields: Partial<Pick<Patient, 'name' | 'age' | 'gender' | 'email' | 'phone' | 'diagnosis' | 'cancerType' | 'stage' | 'oncologist' | 'diagnosisDate' | 'currentPhase' | 'mindState'>>) => void

  addPHQ9: (patientId: string, assessment: PHQ9Assessment) => void
  addHandgrip: (patientId: string, measurement: HandgripMeasurement) => void
  addSixMWT: (patientId: string, measurement: SixMWTMeasurement) => void
  addThirtySTS: (patientId: string, m: ThirtySTSMeasurement) => void
  addTUG: (patientId: string, m: TUGMeasurement) => void
  addTransverso: (patientId: string, m: TransversoMeasurement) => void
  addBalance: (patientId: string, m: BalanceMeasurement) => void

  addSession: (patientId: string, session: Omit<Session, 'id'>) => void
  updateSessionStatus: (patientId: string, sessionId: string, status: Session['status']) => void
  deleteSession: (patientId: string, sessionId: string) => void

  assignBundle: (patientId: string, bundleCode: string, programCodes: string[]) => void
  sendContent: (patientId: string, contentCode: string) => void
  acknowledgeCrisis: (patientId: string, crisisId: string) => void

  addProgram: (p: Program) => void
  updateProgram: (code: string, fields: Partial<Program>) => void
  addBundle: (b: Bundle) => void
  updateBundle: (code: string, fields: Partial<Bundle>) => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function computePHQ9Severity(score: number): PHQ9Assessment['severity'] {
  if (score <= 4) return 'minimal'
  if (score <= 9) return 'mild'
  if (score <= 14) return 'moderate'
  if (score <= 19) return 'moderately_severe'
  return 'severe'
}

function updatePatientById(
  patients: Patient[],
  id: string,
  updater: (p: Patient) => Patient
): Patient[] {
  return patients.map(p => p.id === id ? updater(p) : p)
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useStore = create<CRMState>()(
  persist(
    (set, get) => ({
      // ── Initial state ──────────────────────────────────────────────────────
      view: 'dashboard',
      selectedPatientId: null,
      clinicId: null,
      patients: MOCK_PATIENTS,
      programs: PROGRAMS,
      bundles: BUNDLES,

      // ── UI actions ────────────────────────────────────────────────────────
      setView: (view) => set({ view }),
      selectPatient: (id) => set({ selectedPatientId: id }),
      setClinicId: (id) => set({ clinicId: id }),

      // ── Patient actions ───────────────────────────────────────────────────
      getPatient: (id) => get().patients.find(p => p.id === id),

      addPatient: (data) => {
        const newPatient: Patient = {
          ...data,
          id: `P${String(Date.now()).slice(-6)}`,
          handgrip: [], sixMWT: [], thirtySTS: [], tug: [],
          transverso: [], balance: [], phq9: [], gad7: [],
          facitf: [], eortc: [], sessions: [], contentItems: [],
          crisisOrders: [], clinicalNotes: [],
        }
        set(s => ({ patients: [...s.patients, newPatient] }))
      },

      updatePatient: (id, fields) => {
        set(s => ({ patients: updatePatientById(s.patients, id, p => ({ ...p, ...fields })) }))
      },

      // ── PHQ-9 con protocolo de crisis ─────────────────────────────────────
      addPHQ9: (patientId, assessment) => {
        set(s => ({
          patients: updatePatientById(s.patients, patientId, p => {
            const newPhq9 = [...p.phq9, assessment]
            let alertStatus = p.alertStatus
            const crisisOrders = [...p.crisisOrders]
            const sessions = [...p.sessions]

            if (assessment.totalScore >= 10) {
              alertStatus = 'rojo'
              crisisOrders.push({
                id: `co-${Date.now()}`,
                date: assessment.date,
                trigger: `PHQ-9 >= 10 (Puntuación: ${assessment.totalScore})`,
                program: 'PS-01',
                status: 'pendiente',
              })
              sessions.push({
                id: `s-crisis-${Date.now()}`,
                programCode: 'PS-01',
                date: assessment.date,
                status: 'pendiente',
                notes: `Auto-generada por PHQ-9 = ${assessment.totalScore}`,
              })
            } else if (assessment.totalScore >= 5 && alertStatus !== 'rojo') {
              alertStatus = 'amarillo'
            } else if (assessment.totalScore < 5 && alertStatus !== 'rojo') {
              alertStatus = 'verde'
            }

            return { ...p, phq9: newPhq9, alertStatus, crisisOrders, sessions }
          }),
        }))
      },

      // ── Mediciones físicas ────────────────────────────────────────────────
      addHandgrip: (id, m) => set(s => ({
        patients: updatePatientById(s.patients, id, p => ({ ...p, handgrip: [...p.handgrip, m] }))
      })),
      addSixMWT: (id, m) => set(s => ({
        patients: updatePatientById(s.patients, id, p => ({ ...p, sixMWT: [...p.sixMWT, m] }))
      })),
      addThirtySTS: (id, m) => set(s => ({
        patients: updatePatientById(s.patients, id, p => ({ ...p, thirtySTS: [...p.thirtySTS, m] }))
      })),
      addTUG: (id, m) => set(s => ({
        patients: updatePatientById(s.patients, id, p => ({ ...p, tug: [...p.tug, m] }))
      })),
      addTransverso: (id, m) => set(s => ({
        patients: updatePatientById(s.patients, id, p => ({ ...p, transverso: [...p.transverso, m] }))
      })),
      addBalance: (id, m) => set(s => ({
        patients: updatePatientById(s.patients, id, p => ({ ...p, balance: [...p.balance, m] }))
      })),

      // ── Sesiones ──────────────────────────────────────────────────────────
      addSession: (id, sessionData) => set(s => ({
        patients: updatePatientById(s.patients, id, p => ({
          ...p,
          sessions: [...p.sessions, {
            ...sessionData,
            id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          }],
        }))
      })),

      updateSessionStatus: (patientId, sessionId, status) => set(s => ({
        patients: updatePatientById(s.patients, patientId, p => ({
          ...p,
          sessions: p.sessions.map(sess => sess.id === sessionId ? { ...sess, status } : sess),
        }))
      })),

      deleteSession: (patientId, sessionId) => set(s => ({
        patients: updatePatientById(s.patients, patientId, p => ({
          ...p,
          sessions: p.sessions.filter(sess => sess.id !== sessionId),
        }))
      })),

      // ── Bundles y contenido ───────────────────────────────────────────────
      assignBundle: (patientId, bundleCode, programCodes) => set(s => ({
        patients: updatePatientById(s.patients, patientId, p => ({
          ...p,
          assignedBundles: p.assignedBundles.includes(bundleCode)
            ? p.assignedBundles
            : [...p.assignedBundles, bundleCode],
          assignedPrograms: Array.from(new Set([...p.assignedPrograms, ...programCodes])),
        }))
      })),

      sendContent: (patientId, contentCode) => set(s => ({
        patients: updatePatientById(s.patients, patientId, p => {
          const sentDate = new Date().toISOString().split('T')[0]
          if (p.contentItems.find(c => c.code === contentCode)) {
            return {
              ...p,
              contentItems: p.contentItems.map(c =>
                c.code === contentCode ? { ...c, enabled: true, sentDate } : c
              ),
            }
          }
          const item = CONTENT_LIBRARY.find(c => c.code === contentCode)
          if (!item) return p
          return { ...p, contentItems: [...p.contentItems, { ...item, enabled: true, sentDate }] }
        })
      })),

      acknowledgeCrisis: (patientId, crisisId) => set(s => ({
        patients: updatePatientById(s.patients, patientId, p => ({
          ...p,
          crisisOrders: p.crisisOrders.map(c =>
            c.id === crisisId ? { ...c, status: 'atendida' as const } : c
          ),
        }))
      })),

      // ── Programas y Bundles ───────────────────────────────────────────────
      addProgram: (p) => set(s => ({ programs: [...s.programs, p] })),
      updateProgram: (code, fields) => set(s => ({
        programs: s.programs.map(p => p.code === code ? { ...p, ...fields } : p),
      })),
      addBundle: (b) => set(s => ({ bundles: [...s.bundles, b] })),
      updateBundle: (code, fields) => set(s => ({
        bundles: s.bundles.map(b => b.code === code ? { ...b, ...fields } : b),
      })),
    }),
    {
      name: 'crm-storage',
      // Solo persistir datos clínicos, no UI state transitorio
      partialize: (s) => ({
        patients: s.patients,
        programs: s.programs,
        bundles: s.bundles,
        clinicId: s.clinicId,
      }),
    }
  )
)
