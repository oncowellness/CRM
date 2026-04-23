import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { SUPABASE_ENABLED } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { LoginPage } from './LoginPage'

export function AuthGuard({ children }: { children: ReactNode }) {
  if (!SUPABASE_ENABLED) return <>{children}</>

  return <AuthGuardInner>{children}</AuthGuardInner>
}

function AuthGuardInner({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-teal-500" />
      </div>
    )
  }

  if (!user) return <LoginPage />

  return <>{children}</>
}
