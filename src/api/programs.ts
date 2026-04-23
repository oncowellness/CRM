import { supabase } from '../lib/supabase'
import type { Program, Bundle } from '../types'

export async function fetchPrograms(clinicId: string): Promise<Program[]> {
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('code')
  if (error) throw error
  return (data ?? []).map(r => ({
    code: r.code as string,
    type: r.type as Program['type'],
    name: r.name as string,
    description: r.description as string,
    sessions: r.sessions as number | undefined,
    duration: r.duration as string | undefined,
  }))
}

export async function upsertProgram(p: Program, clinicId: string): Promise<void> {
  const { error } = await supabase.from('programs').upsert({
    code: p.code,
    clinic_id: clinicId,
    type: p.type,
    name: p.name,
    description: p.description,
    sessions: p.sessions ?? null,
    duration: p.duration ?? null,
  })
  if (error) throw error
}

export async function fetchBundles(clinicId: string): Promise<Bundle[]> {
  const { data, error } = await supabase
    .from('bundles')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('code')
  if (error) throw error
  return (data ?? []).map(r => ({
    code: r.code as string,
    name: r.name as string,
    phase: r.phase as Bundle['phase'],
    description: r.description as string,
    programs: (r.programs as string[]) ?? [],
  }))
}

export async function upsertBundle(b: Bundle, clinicId: string): Promise<void> {
  const { error } = await supabase.from('bundles').upsert({
    code: b.code,
    clinic_id: clinicId,
    name: b.name,
    phase: b.phase,
    description: b.description,
    programs: b.programs,
  })
  if (error) throw error
}
