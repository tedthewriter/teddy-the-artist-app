import { useEffect, useState } from 'react'
import HomeScreen from './components/HomeScreen'
import LoginScreen from './components/LoginScreen'
import { isSupabaseConfigured, supabase } from './lib/supabase'

export default function App() {
  const previewMode = import.meta.env.DEV || import.meta.env.VITE_PREVIEW_MODE === 'true'
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [membership, setMembership] = useState({ loading: false, allowed: false, error: '' })

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

  useEffect(() => {
    let active = true

    async function checkMembership() {
      if (!supabase || !session?.user) {
        setMembership({ loading: false, allowed: false, error: '' })
        return
      }

      setMembership({ loading: true, allowed: false, error: '' })
      const { data, error } = await supabase
        .from('app_members')
        .select('user_id')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (!active) return
      setMembership({
        loading: false,
        allowed: Boolean(data),
        error: error ? 'The private content library could not be opened.' : '',
      })
    }

    checkMembership()
    return () => { active = false }
  }, [session])

  if (loading || membership.loading) return <div className="loading-screen">Opening a calm place…</div>

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

  if (session && !membership.allowed) {
    return (
      <main className="login-shell">
        <section className="login-card setup-card">
          <div className="brand-mark" aria-hidden="true">T</div>
          <p className="eyebrow">Teddy the Artist</p>
          <h1>This account is not connected yet.</h1>
          <p className="login-copy">
            {membership.error || 'For privacy, an account must be added to this private space before it can open the content library.'}
          </p>
          <button className="primary-button" onClick={() => supabase.auth.signOut()}>Sign out</button>
        </section>
      </main>
    )
  }

  return (
    <HomeScreen
      userId={session?.user?.id}
      onSignOut={session ? () => supabase.auth.signOut() : undefined}
    />
  )
}
