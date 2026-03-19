// ─── Patient Journey Phases ──────────────────────────────────────────────────
export type Phase = 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6' | 'F7' | 'F8'

export const PHASE_LABELS: Record<Phase, string> = {
  F1: 'Diagnóstico',
  F2: 'Prehab',
  F3: 'Tratamiento',
  F4: 'Tratamiento Avanzado',
  F5: 'Evaluación',
  F6: 'Supervivencia',
  F7: 'Seguimiento',
  F8: 'Cuidados Avanzados',
}

// ─── Mind States ─────────────────────────────────────────────────────────────
export type MindState = 'Activo' | 'Ansioso' | 'Depresivo' | 'Resiliente' | 'Vulnerable'

// ─── Alert Status ─────────────────────────────────────────────────────────────
export type AlertStatus = 'verde' | 'amarillo' | 'rojo'

// ─── Program Types ────────────────────────────────────────────────────────────
export type ProgramType = 'FX' | 'PS' | 'NU' | 'EO' | 'TS'

export const TYPE_COLORS: Record<ProgramType, string> = {
  FX: 'bg-blue-100 text-blue-700',
  PS: 'bg-purple-100 text-purple-700',
  NU: 'bg-green-100 text-green-700',
  EO: 'bg-pink-100 text-pink-700',
  TS: 'bg-orange-100 text-orange-700',
}

export interface Program {
  code: string        // e.g. FX-01
  type: ProgramType
  name: string
  description: string
  sessions?: number
  duration?: string   // e.g. "8 semanas"
}

// ─── Bundle ───────────────────────────────────────────────────────────────────
export interface Bundle {
  code: string        // e.g. PC-01
  name: string
  phase: Phase
  description: string
  programs: string[]  // Program codes
}

// ─── Clinical Metrics ─────────────────────────────────────────────────────────
export interface HandgripMeasurement {
  date: string
  dominantHand: number  // kg
  nonDominantHand: number
  isBaseline?: boolean
}

export interface SixMWTMeasurement {
  date: string
  distanceMeters: number
  heartRatePeak?: number
  fatigue?: number  // Borg scale 0-10
  isBaseline?: boolean
}

export interface PHQ9Assessment {
  date: string
  answers: number[]  // 9 answers, 0-3 each
  totalScore: number
  severity: 'minimal' | 'mild' | 'moderate' | 'moderately_severe' | 'severe'
}

export interface GAD7Assessment {
  date: string
  answers: number[]  // 7 answers, 0-3 each
  totalScore: number
  severity: 'minimal' | 'mild' | 'moderate' | 'severe'
}

export interface FACITFAssessment {
  date: string
  answers: number[]  // 13 items, 0-4 each
  totalScore: number
}

export interface EORTCAssessment {
  date: string
  globalHealth: number  // 0-100
  physicalFunction: number
  roleFunction: number
  emotionalFunction: number
  cognitiveFunction: number
  socialFunction: number
  fatigue: number
  nausea: number
  pain: number
}

// ─── Session / Appointment ────────────────────────────────────────────────────
export type SessionStatus = 'pendiente' | 'confirmada' | 'realizada' | 'cancelada'

export interface Session {
  id: string
  programCode: string
  date: string
  status: SessionStatus
  notes?: string
  therapist?: string
}

// ─── Content Library ──────────────────────────────────────────────────────────
export interface ContentItem {
  code: string        // LB-01, DC-01, etc.
  title: string
  type: 'manual' | 'kit' | 'guia' | 'cuaderno' | 'video'
  phases: Phase[]
  description: string
  enabled?: boolean
  sentDate?: string
}

export interface ThirtySTSMeasurement {
  date: string
  reps: number
  isBaseline?: boolean
}

export interface TUGMeasurement {
  date: string
  seconds: number
  isBaseline?: boolean
}

export type TransversoScore = 0 | 1 | 2 | 3

export interface TransversoMeasurement {
  date: string
  score: TransversoScore
}

export interface BalanceMeasurement {
  date: string
  seconds: number
  testType: 'monopodal' | 'romberg'
  isBaseline?: boolean
}

// ─── Patient ──────────────────────────────────────────────────────────────────
export interface Patient {
  id: string
  // Demographics
  name: string
  age: number
  gender: 'M' | 'F'
  email: string
  phone: string
  // Clinical
  diagnosis: string
  cancerType: string
  stage: string           // TNM stage e.g. "IIIB"
  oncologist: string
  diagnosisDate: string
  // Journey
  currentPhase: Phase
  mindState: MindState
  alertStatus: AlertStatus
  // Metrics
  handgrip: HandgripMeasurement[]
  sixMWT: SixMWTMeasurement[]
  thirtySTS: ThirtySTSMeasurement[]
  tug: TUGMeasurement[]
  transverso: TransversoMeasurement[]
  balance: BalanceMeasurement[]
  phq9: PHQ9Assessment[]
  gad7: GAD7Assessment[]
  facitf: FACITFAssessment[]
  eortc: EORTCAssessment[]
  // Programs & Sessions
  assignedPrograms: string[]  // Program codes
  sessions: Session[]
  // Bundles
  assignedBundles: string[]   // Bundle codes
  // Content
  contentItems: ContentItem[]
  // Auto-generated crisis orders
  crisisOrders: CrisisOrder[]
  // Notes
  clinicalNotes: ClinicalNote[]
}

export interface CrisisOrder {
  id: string
  date: string
  trigger: string       // e.g. "PHQ-9 >= 10 (Score: 14)"
  program: string       // e.g. "PS-01"
  status: 'pendiente' | 'atendida'
  notes?: string
}

export interface ClinicalNote {
  id: string
  date: string
  author: string
  content: string
  type: 'evolucion' | 'interconsulta' | 'incidencia'
}

// ─── UI State ─────────────────────────────────────────────────────────────────
export type View =
  | 'dashboard'
  | 'patients'
  | 'patient-detail'
  | 'physio'
  | 'psycho'
  | 'empowerment'
  | 'clinical-dashboard'
  | 'bundles'
  | 'calendar'
  | 'config-programs'
  | 'config-bundles'
