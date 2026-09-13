import { useEffect, useState } from 'react'
import HomeScreen from './components/HomeScreen'
import LoginScreen from './components/LoginScreen'
import { isSupabaseConfigured, supabase } from './lib/supabase'

export default function App() {
  const previewMode = import.meta.env.DEV || import.meta.env.VITE_PREVIEW_MODE === 'true'
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!supabase) return undefined

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  if (loading) return <div className="loading-screen">Opening a calm place…</div>

  if (isSupabaseConfigured && !session) return <LoginScreen />

  if (!isSupabaseConfigured && !previewMode) {
    return (
      <main className="login-shell">
        <section className="login-card setup-card">
          <div className="brand-mark" aria-hidden="true">T</div>
          <p className="eyebrow">Teddy the Artist</p>
          <h1>Setup is still in progress.</h1>
          <p className="login-copy">This private space will be available after its secure connection is configured.</p>
        </section>
      </main>
    )
  }

  return <HomeScreen onSignOut={session ? () => supabase.auth.signOut() : undefined} />
}
