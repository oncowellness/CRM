import { create } from 'zustand'
import type { Patient, View, PHQ9Assessment, HandgripMeasurement, SixMWTMeasurement, Session } from '../types'
import { MOCK_PATIENTS } from '../data/patients'
import { CONTENT_LIBRARY } from '../data/content'

interface CRMState {
  view: View
  selectedPatientId: string | null
  patients: Patient[]
  setView: (view: View) => void
  selectPatient: (id: string | null) => void
  addPHQ9: (patientId: string, assessment: PHQ9Assessment) => void
  addHandgrip: (patientId: string, measurement: HandgripMeasurement) => void
  addSixMWT: (patientId: string, measurement: SixMWTMeasurement) => void
  addSession: (patientId: string, session: Omit<Session, 'id'>) => void
  updateSessionStatus: (patientId: string, sessionId: string, status: Session['status']) => void
  deleteSession: (patientId: string, sessionId: string) => void
  assignBundle: (patientId: string, bundleCode: string, programCodes: string[]) => void
  sendContent: (patientId: string, contentCode: string) => void
  acknowledgeCrisis: (patientId: string, crisisId: string) => void
  addPatient: (patient: Omit<Patient, 'id' | 'handgrip' | 'sixMWT' | 'phq9' | 'gad7' | 'facitf' | 'eortc' | 'sessions' | 'contentItems' | 'crisisOrders' | 'clinicalNotes'>) => void
  updatePatient: (id: string, fields: Partial<Pick<Patient, 'name' | 'age' | 'gender' | 'email' | 'phone' | 'diagnosis' | 'cancerType' | 'stage' | 'oncologist' | 'diagnosisDate' | 'currentPhase' | 'mindState'>>) => void
  getPatient: (id: string) => Patient | undefined
}

function computePHQ9Severity(score: number): PHQ9Assessment['severity'] {
  if (score <= 4) return 'minimal'
  if (score <= 9) return 'mild'
  if (score <= 14) return 'moderate'
  if (score <= 19) return 'moderately_severe'
  return 'severe'
}

export const useStore = create<CRMState>((set, get) => ({
  view: 'dashboard',
  selectedPatientId: null,
  patients: MOCK_PATIENTS,

  setView: (view) => set({ view }),
  selectPatient: (id) => set({ selectedPatientId: id }),
  getPatient: (id) => get().patients.find(p => p.id === id),

  addPHQ9: (patientId, assessment) => {
    set(state => ({
      patients: state.patients.map(p => {
        if (p.id !== patientId) return p
        const newPhq9 = [...p.phq9, assessment]
        let alertStatus = p.alertStatus
        let crisisOrders = [...p.crisisOrders]
        let sessions = [...p.sessions]
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

  addHandgrip: (patientId, measurement) => {
    set(state => ({
      patients: state.patients.map(p =>
        p.id === patientId ? { ...p, handgrip: [...p.handgrip, measurement] } : p
      ),
    }))
  },

  addSixMWT: (patientId, measurement) => {
    set(state => ({
      patients: state.patients.map(p =>
        p.id === patientId ? { ...p, sixMWT: [...p.sixMWT, measurement] } : p
      ),
    }))
  },

  addSession: (patientId, sessionData) => {
    set(state => ({
      patients: state.patients.map(p => {
        if (p.id !== patientId) return p
        const newSession: Session = {
          ...sessionData,
          id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        }
        return { ...p, sessions: [...p.sessions, newSession] }
      }),
    }))
  },

  updateSessionStatus: (patientId, sessionId, status) => {
    set(state => ({
      patients: state.patients.map(p => {
        if (p.id !== patientId) return p
        return {
          ...p,
          sessions: p.sessions.map(s => s.id === sessionId ? { ...s, status } : s),
        }
      }),
    }))
  },

  deleteSession: (patientId, sessionId) => {
    set(state => ({
      patients: state.patients.map(p => {
        if (p.id !== patientId) return p
        return { ...p, sessions: p.sessions.filter(s => s.id !== sessionId) }
      }),
    }))
  },

  assignBundle: (patientId, bundleCode, programCodes) => {
    set(state => ({
      patients: state.patients.map(p => {
        if (p.id !== patientId) return p
        const existingBundles = p.assignedBundles.includes(bundleCode)
          ? p.assignedBundles
          : [...p.assignedBundles, bundleCode]
        const existingPrograms = new Set(p.assignedPrograms)
        programCodes.forEach(c => existingPrograms.add(c))
        return { ...p, assignedBundles: existingBundles, assignedPrograms: Array.from(existingPrograms) }
      }),
    }))
  },

  sendContent: (patientId, contentCode) => {
    set(state => ({
      patients: state.patients.map(p => {
        if (p.id !== patientId) return p
        const alreadySent = p.contentItems.find(c => c.code === contentCode)
        if (alreadySent) {
          return {
            ...p,
            contentItems: p.contentItems.map(c =>
              c.code === contentCode
                ? { ...c, enabled: true, sentDate: new Date().toISOString().split('T')[0] }
                : c
            ),
          }
        }
        const item = CONTENT_LIBRARY.find(c => c.code === contentCode)
        if (!item) return p
        return {
          ...p,
          contentItems: [
            ...p.contentItems,
            { ...item, enabled: true, sentDate: new Date().toISOString().split('T')[0] },
          ],
        }
      }),
    }))
  },

  acknowledgeCrisis: (patientId, crisisId) => {
    set(state => ({
      patients: state.patients.map(p => {
        if (p.id !== patientId) return p
        return {
          ...p,
          crisisOrders: p.crisisOrders.map(c =>
            c.id === crisisId ? { ...c, status: 'atendida' as const } : c
          ),
        }
      }),
    }))
  },

  addPatient: (data) => {
    const newPatient: Patient = {
      ...data,
      id: `P${String(Date.now()).slice(-4)}`,
      handgrip: [],
      sixMWT: [],
      phq9: [],
      gad7: [],
      facitf: [],
      eortc: [],
      sessions: [],
      contentItems: [],
      crisisOrders: [],
      clinicalNotes: [],
    }
    set(state => ({ patients: [...state.patients, newPatient] }))
  },

  updatePatient: (id, fields) => {
    set(state => ({
      patients: state.patients.map(p => p.id === id ? { ...p, ...fields } : p),
    }))
  },
}))

export { computePHQ9Severity }
