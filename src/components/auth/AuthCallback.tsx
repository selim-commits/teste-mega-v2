import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../contexts/AuthContext'

/**
 * Handles OAuth callback and password reset redirects.
 * Supabase automatically processes the URL hash/params,
 * so we just wait for the auth state to update then redirect.
 */
export function AuthCallback() {
  const { user, initialized } = useAuthContext()
  const navigate = useNavigate()

  useEffect(() => {
    if (!initialized) return

    if (user) {
      navigate('/dashboard', { replace: true })
    } else {
      // If no user after init, redirect to homepage
      // (e.g. expired/invalid token)
      navigate('/', { replace: true })
    }
  }, [user, initialized, navigate])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #e5e5e5', borderTopColor: '#1E3A5F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )
}
