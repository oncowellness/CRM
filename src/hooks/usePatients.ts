import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SUPABASE_ENABLED } from '../lib/supabase'
import { fetchPatients, createPatient, updatePatient } from '../api/patients'
import { useStore } from '../store/useStore'
import type { Patient } from '../types'

const PATIENTS_KEY = ['patients']

// ── Hook unificado: Supabase o Zustand persist según flag ─────────────────────

export function usePatients() {
  const storePatients = useStore(s => s.patients)

  const query = useQuery({
    queryKey: PATIENTS_KEY,
    queryFn: fetchPatients,
    enabled: SUPABASE_ENABLED,
    initialData: SUPABASE_ENABLED ? undefined : storePatients,
  })

  return {
    patients: SUPABASE_ENABLED ? (query.data ?? []) : storePatients,
    isLoading: SUPABASE_ENABLED ? query.isLoading : false,
    error: SUPABASE_ENABLED ? query.error : null,
  }
}

export function usePatient(id: string | null) {
  const storePatients = useStore(s => s.patients)

  const query = useQuery({
    queryKey: [...PATIENTS_KEY, id],
    queryFn: fetchPatients,
    enabled: SUPABASE_ENABLED && !!id,
    select: (data: Patient[]) => data.find(p => p.id === id),
  })

  if (!id) return { patient: undefined, isLoading: false, error: null }

  return {
    patient: SUPABASE_ENABLED
      ? query.data
      : storePatients.find(p => p.id === id),
    isLoading: SUPABASE_ENABLED ? query.isLoading : false,
    error: SUPABASE_ENABLED ? query.error : null,
  }
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useAddPatient() {
  const qc = useQueryClient()
  const storeAdd = useStore(s => s.addPatient)
  const clinicId = useStore(s => s.clinicId)

  return useMutation({
    mutationFn: (data: Parameters<typeof storeAdd>[0]) => {
      if (!SUPABASE_ENABLED) {
        storeAdd(data)
        return Promise.resolve('')
      }
      return createPatient(data, clinicId ?? '')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PATIENTS_KEY }),
  })
}

export function useUpdatePatient() {
  const qc = useQueryClient()
  const storeUpdate = useStore(s => s.updatePatient)

  return useMutation({
    mutationFn: ({ id, fields }: { id: string; fields: Parameters<typeof storeUpdate>[1] }) => {
      if (!SUPABASE_ENABLED) {
        storeUpdate(id, fields)
        return Promise.resolve()
      }
      return updatePatient(id, fields)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PATIENTS_KEY }),
  })
}
