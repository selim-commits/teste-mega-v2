import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthContext } from '../../contexts/AuthContext'
import { isDemoMode } from '../../lib/supabase'

interface AuthGuardProps {
  children: ReactNode
  /**
   * Path to redirect to if user is not authenticated
   * @default '/'
   */
  redirectTo?: string
  /**
   * If true, shows a loading spinner while checking auth state
   * @default true
   */
  showLoader?: boolean
  /**
   * Custom loading component to show while checking auth state
   */
  loadingComponent?: ReactNode
}

/**
 * AuthGuard component that protects routes from unauthenticated access.
 * Wraps protected routes and redirects to login if user is not authenticated.
 *
 * @example
 * ```tsx
 * <Route
 *   path="/dashboard"
 *   element={
 *     <AuthGuard>
 *       <Dashboard />
 *     </AuthGuard>
 *   }
 * />
 * ```
 */
export function AuthGuard({
  children,
  redirectTo = '/',
  showLoader = true,
  loadingComponent,
}: AuthGuardProps) {
  const { user, initialized, loading } = useAuthContext()
  const location = useLocation()

  // In demo mode, skip auth checks entirely
  if (isDemoMode) {
    return <>{children}</>
  }

  // Show loading state while auth is initializing
  if (!initialized || loading) {
    if (!showLoader) {
      return null
    }

    if (loadingComponent) {
      return <>{loadingComponent}</>
    }

    return (
      <div className="auth-guard-loading">
        <div className="auth-guard-spinner" />
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    // Save the attempted location for redirecting after login
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  // User is authenticated, render children
  return <>{children}</>
}

interface GuestGuardProps {
  children: ReactNode
  /**
   * Path to redirect to if user is already authenticated
   * @default '/dashboard'
   */
  redirectTo?: string
}

/**
 * GuestGuard component that protects routes from authenticated access.
 * Used for login/signup pages to redirect authenticated users away.
 *
 * @example
 * ```tsx
 * <Route
 *   path="/"
 *   element={
 *     <GuestGuard>
 *       <Login />
 *     </GuestGuard>
 *   }
 * />
 * ```
 */
export function GuestGuard({ children, redirectTo = '/dashboard' }: GuestGuardProps) {
  const { user, initialized } = useAuthContext()
  const location = useLocation()

  // In demo mode, show the page immediately (no auth needed)
  if (isDemoMode) {
    return <>{children}</>
  }

  // Wait only for initialization, NOT for loading (operations like signIn)
  // Otherwise the page disappears during login attempts
  if (!initialized) {
    return (
      <div className="auth-guard-loading">
        <div className="auth-guard-spinner" />
      </div>
    )
  }

  // Redirect authenticated users
  if (user) {
    const from = (location.state as { from?: Location })?.from?.pathname ?? redirectTo
    return <Navigate to={from} replace />
  }

  // User is not authenticated, render children
  return <>{children}</>
}

export default AuthGuard
