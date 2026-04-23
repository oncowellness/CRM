import { supabase } from '../lib/supabase'
import type { Patient } from '../types'

// ── Helpers de mapeo (DB snake_case ↔ TS camelCase) ──────────────────────────

function dbToPatient(row: Record<string, unknown>): Omit<Patient, 'handgrip' | 'sixMWT' | 'thirtySTS' | 'tug' | 'transverso' | 'balance' | 'phq9' | 'gad7' | 'facitf' | 'eortc' | 'sessions' | 'contentItems' | 'crisisOrders' | 'clinicalNotes'> {
  return {
    id: row.id as string,
    name: row.name as string,
    age: row.age as number,
    gender: row.gender as 'M' | 'F',
    email: (row.email as string) ?? '',
    phone: (row.phone as string) ?? '',
    diagnosis: (row.diagnosis as string) ?? '',
    cancerType: (row.cancer_type as string) ?? '',
    stage: (row.stage as string) ?? '',
    oncologist: (row.oncologist as string) ?? '',
    diagnosisDate: (row.diagnosis_date as string) ?? '',
    currentPhase: row.current_phase as Patient['currentPhase'],
    mindState: row.mind_state as Patient['mindState'],
    alertStatus: row.alert_status as Patient['alertStatus'],
    assignedPrograms: (row.assigned_programs as string[]) ?? [],
    assignedBundles: (row.assigned_bundles as string[]) ?? [],
  }
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function fetchPatients(): Promise<Patient[]> {
  const { data, error } = await supabase
    .from('patients')
    .select(`
      *,
      handgrip_measurements(*),
      six_mwt_measurements(*),
      thirty_sts_measurements(*),
      tug_measurements(*),
      transverso_measurements(*),
      balance_measurements(*),
      phq9_assessments(*),
      gad7_assessments(*),
      facitf_assessments(*),
      eortc_assessments(*),
      sessions(*),
      crisis_orders(*),
      clinical_notes(*),
      patient_content(*)
    `)
    .order('name')

  if (error) throw error

  return (data ?? []).map(row => ({
    ...dbToPatient(row),
    handgrip: (row.handgrip_measurements ?? []).map((m: Record<string, unknown>) => ({
      date: m.date as string,
      dominantHand: m.dominant_hand as number,
      nonDominantHand: m.non_dominant_hand as number,
      isBaseline: m.is_baseline as boolean | undefined,
    })),
    sixMWT: (row.six_mwt_measurements ?? []).map((m: Record<string, unknown>) => ({
      date: m.date as string,
      distanceMeters: m.distance_meters as number,
      heartRatePeak: m.heart_rate_peak as number | undefined,
      fatigue: m.fatigue as number | undefined,
      isBaseline: m.is_baseline as boolean | undefined,
    })),
    thirtySTS: (row.thirty_sts_measurements ?? []).map((m: Record<string, unknown>) => ({
      date: m.date as string,
      reps: m.reps as number,
      isBaseline: m.is_baseline as boolean | undefined,
    })),
    tug: (row.tug_measurements ?? []).map((m: Record<string, unknown>) => ({
      date: m.date as string,
      seconds: m.seconds as number,
      isBaseline: m.is_baseline as boolean | undefined,
    })),
    transverso: (row.transverso_measurements ?? []).map((m: Record<string, unknown>) => ({
      date: m.date as string,
      score: m.score as 0 | 1 | 2 | 3,
    })),
    balance: (row.balance_measurements ?? []).map((m: Record<string, unknown>) => ({
      date: m.date as string,
      seconds: m.seconds as number,
      testType: m.test_type as 'monopodal' | 'romberg',
      isBaseline: m.is_baseline as boolean | undefined,
    })),
    phq9: (row.phq9_assessments ?? []).map((a: Record<string, unknown>) => ({
      date: a.date as string,
      answers: a.answers as number[],
      totalScore: a.total_score as number,
      severity: a.severity as string,
    })),
    gad7: (row.gad7_assessments ?? []).map((a: Record<string, unknown>) => ({
      date: a.date as string,
      answers: a.answers as number[],
      totalScore: a.total_score as number,
      severity: a.severity as string,
    })),
    facitf: (row.facitf_assessments ?? []).map((a: Record<string, unknown>) => ({
      date: a.date as string,
      answers: a.answers as number[],
      totalScore: a.total_score as number,
    })),
    eortc: (row.eortc_assessments ?? []).map((a: Record<string, unknown>) => ({
      date: a.date as string,
      globalHealth: a.global_health as number,
      physicalFunction: a.physical_function as number,
      roleFunction: a.role_function as number,
      emotionalFunction: a.emotional_function as number,
      cognitiveFunction: a.cognitive_function as number,
      socialFunction: a.social_function as number,
      fatigue: a.fatigue as number,
      nausea: a.nausea as number,
      pain: a.pain as number,
    })),
    sessions: (row.sessions ?? []).map((s: Record<string, unknown>) => ({
      id: s.id as string,
      programCode: s.program_code as string,
      date: s.date as string,
      status: s.status as string,
      notes: s.notes as string | undefined,
      therapist: s.therapist as string | undefined,
    })),
    crisisOrders: (row.crisis_orders ?? []).map((c: Record<string, unknown>) => ({
      id: c.id as string,
      date: c.date as string,
      trigger: c.trigger_desc as string,
      program: c.program as string,
      status: c.status as 'pendiente' | 'atendida',
      notes: c.notes as string | undefined,
    })),
    clinicalNotes: (row.clinical_notes ?? []).map((n: Record<string, unknown>) => ({
      id: n.id as string,
      date: n.date as string,
      author: n.author as string,
      content: n.content as string,
      type: n.type as 'evolucion' | 'interconsulta' | 'incidencia',
    })),
    contentItems: (row.patient_content ?? []).map((c: Record<string, unknown>) => ({
      code: c.code as string,
      title: c.title as string,
      type: c.type as string,
      phases: [],
      description: '',
      enabled: c.enabled as boolean,
      sentDate: c.sent_date as string | undefined,
    })),
  })) as Patient[]
}

export async function createPatient(
  data: Omit<Patient, 'id' | 'handgrip' | 'sixMWT' | 'thirtySTS' | 'tug' | 'transverso' | 'balance' | 'phq9' | 'gad7' | 'facitf' | 'eortc' | 'sessions' | 'contentItems' | 'crisisOrders' | 'clinicalNotes'>,
  clinicId: string
): Promise<string> {
  const { data: row, error } = await supabase
    .from('patients')
    .insert({
      clinic_id: clinicId,
      name: data.name,
      age: data.age,
      gender: data.gender,
      email: data.email,
      phone: data.phone,
      diagnosis: data.diagnosis,
      cancer_type: data.cancerType,
      stage: data.stage,
      oncologist: data.oncologist,
      diagnosis_date: data.diagnosisDate || null,
      current_phase: data.currentPhase,
      mind_state: data.mindState,
      alert_status: data.alertStatus,
      assigned_programs: data.assignedPrograms,
      assigned_bundles: data.assignedBundles,
    })
    .select('id')
    .single()

  if (error) throw error
  return row.id as string
}

export async function updatePatient(
  id: string,
  fields: Partial<Pick<Patient, 'name' | 'age' | 'gender' | 'email' | 'phone' | 'diagnosis' | 'cancerType' | 'stage' | 'oncologist' | 'diagnosisDate' | 'currentPhase' | 'mindState' | 'alertStatus' | 'assignedPrograms' | 'assignedBundles'>>
): Promise<void> {
  const dbFields: Record<string, unknown> = {}
  if (fields.name !== undefined) dbFields.name = fields.name
  if (fields.age !== undefined) dbFields.age = fields.age
  if (fields.gender !== undefined) dbFields.gender = fields.gender
  if (fields.email !== undefined) dbFields.email = fields.email
  if (fields.phone !== undefined) dbFields.phone = fields.phone
  if (fields.diagnosis !== undefined) dbFields.diagnosis = fields.diagnosis
  if (fields.cancerType !== undefined) dbFields.cancer_type = fields.cancerType
  if (fields.stage !== undefined) dbFields.stage = fields.stage
  if (fields.oncologist !== undefined) dbFields.oncologist = fields.oncologist
  if (fields.diagnosisDate !== undefined) dbFields.diagnosis_date = fields.diagnosisDate || null
  if (fields.currentPhase !== undefined) dbFields.current_phase = fields.currentPhase
  if (fields.mindState !== undefined) dbFields.mind_state = fields.mindState
  if (fields.alertStatus !== undefined) dbFields.alert_status = fields.alertStatus
  if (fields.assignedPrograms !== undefined) dbFields.assigned_programs = fields.assignedPrograms
  if (fields.assignedBundles !== undefined) dbFields.assigned_bundles = fields.assignedBundles

  const { error } = await supabase.from('patients').update(dbFields).eq('id', id)
  if (error) throw error
}
