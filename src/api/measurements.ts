import { supabase } from '../lib/supabase'
import type {
  HandgripMeasurement, SixMWTMeasurement, ThirtySTSMeasurement,
  TUGMeasurement, TransversoMeasurement, BalanceMeasurement,
} from '../types'

export async function addHandgrip(patientId: string, m: HandgripMeasurement) {
  const { error } = await supabase.from('handgrip_measurements').insert({
    patient_id: patientId,
    date: m.date,
    dominant_hand: m.dominantHand,
    non_dominant_hand: m.nonDominantHand,
    is_baseline: m.isBaseline ?? null,
  })
  if (error) throw error
}

export async function addSixMWT(patientId: string, m: SixMWTMeasurement) {
  const { error } = await supabase.from('six_mwt_measurements').insert({
    patient_id: patientId,
    date: m.date,
    distance_meters: m.distanceMeters,
    heart_rate_peak: m.heartRatePeak ?? null,
    fatigue: m.fatigue ?? null,
    is_baseline: m.isBaseline ?? null,
  })
  if (error) throw error
}

export async function addThirtySTS(patientId: string, m: ThirtySTSMeasurement) {
  const { error } = await supabase.from('thirty_sts_measurements').insert({
    patient_id: patientId,
    date: m.date,
    reps: m.reps,
    is_baseline: m.isBaseline ?? null,
  })
  if (error) throw error
}

export async function addTUG(patientId: string, m: TUGMeasurement) {
  const { error } = await supabase.from('tug_measurements').insert({
    patient_id: patientId,
    date: m.date,
    seconds: m.seconds,
    is_baseline: m.isBaseline ?? null,
  })
  if (error) throw error
}

export async function addTransverso(patientId: string, m: TransversoMeasurement) {
  const { error } = await supabase.from('transverso_measurements').insert({
    patient_id: patientId,
    date: m.date,
    score: m.score,
  })
  if (error) throw error
}

export async function addBalance(patientId: string, m: BalanceMeasurement) {
  const { error } = await supabase.from('balance_measurements').insert({
    patient_id: patientId,
    date: m.date,
    seconds: m.seconds,
    test_type: m.testType,
    is_baseline: m.isBaseline ?? null,
  })
  if (error) throw error
}
