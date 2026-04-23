import { supabase } from '../lib/supabase'
import type { PHQ9Assessment } from '../types'

export async function addPHQ9(patientId: string, a: PHQ9Assessment) {
  const { error } = await supabase.from('phq9_assessments').insert({
    patient_id: patientId,
    date: a.date,
    answers: a.answers,
    total_score: a.totalScore,
    severity: a.severity,
  })
  if (error) throw error
}

// Si el score es ≥10, también crea la crisis order y la sesión
export async function addPHQ9WithCrisisProtocol(
  patientId: string,
  a: PHQ9Assessment,
  currentAlertStatus: string
): Promise<{ triggered: boolean }> {
  await addPHQ9(patientId, a)

  if (a.totalScore >= 10) {
    await supabase.from('crisis_orders').insert({
      patient_id: patientId,
      date: a.date,
      trigger_desc: `PHQ-9 >= 10 (Puntuación: ${a.totalScore})`,
      program: 'PS-01',
      status: 'pendiente',
    })
    await supabase.from('sessions').insert({
      patient_id: patientId,
      program_code: 'PS-01',
      date: a.date,
      status: 'pendiente',
      notes: `Auto-generada por PHQ-9 = ${a.totalScore}`,
    })
    await supabase.from('patients').update({ alert_status: 'rojo' }).eq('id', patientId)
    return { triggered: true }
  }

  if (a.totalScore >= 5 && currentAlertStatus !== 'rojo') {
    await supabase.from('patients').update({ alert_status: 'amarillo' }).eq('id', patientId)
  } else if (a.totalScore < 5 && currentAlertStatus !== 'rojo') {
    await supabase.from('patients').update({ alert_status: 'verde' }).eq('id', patientId)
  }

  return { triggered: false }
}

export async function acknowledgeCrisis(patientId: string, crisisId: string) {
  const { error } = await supabase
    .from('crisis_orders')
    .update({ status: 'atendida' })
    .eq('id', crisisId)
    .eq('patient_id', patientId)
  if (error) throw error
}
