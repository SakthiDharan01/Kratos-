'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/lib/store'
import { AuthError } from '@supabase/supabase-js'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setAuthenticated } = useStore()
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  const updateUserState = useCallback(async (session: any) => {
    if (session?.user) {
      const userData = {
        id: session.user.id,
        phone: session.user.phone ?? "",
        name: session.user.user_metadata?.name || "",
        email: session.user.email || "",
        college: session.user.user_metadata?.college || "",
        department: session.user.user_metadata?.department || "",
        year: session.user.user_metadata?.year || ""
      }
      
      setUser(userData)
      setAuthenticated(true)
      
      // Sync with users table (non-blocking)
      const { error: syncError } = await supabase.from("users").upsert({
        id: session.user.id,
        phone: session.user.phone ?? "",
        name: session.user.user_metadata?.name || "",
        email: session.user.email || "",
        college: session.user.user_metadata?.college || "",
        department: session.user.user_metadata?.department || "",
        year: session.user.user_metadata?.year || ""
      })
      
      if (syncError) {
        console.error('AuthProvider: Non-critical error syncing user:', syncError)
      }
    } else {
      setUser(null)
      setAuthenticated(false)
    }
  }, [setUser, setAuthenticated])

  useEffect(() => {
    let mounted = true
    
    const initializeAuth = async () => {
      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('AuthProvider: Error getting session:', error)
          if (mounted) {
            setAuthenticated(false)
            setUser(null)
          }
          return
        }

        if (mounted) {
          await updateUserState(session)
          console.log('AuthProvider: Auth initialized for user:', session?.user?.id || 'none')
        }
      } catch (error) {
        console.error('AuthProvider: Error initializing auth:', error)
        if (mounted) {
          setAuthenticated(false)
          setUser(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    if (!initialized) {
      initializeAuth()
    }

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        
        console.log('AuthProvider: Auth state changed:', event)
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await updateUserState(session)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setAuthenticated(false)
          // Clear all session storage on logout
          sessionStorage.removeItem('profileCompleted')
          sessionStorage.removeItem('lastProfileCheck')
        }
      }
    )

    // Cleanup
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [initialized, updateUserState])

  // Show loading state while initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-12 w-12 border-2 border-gray-700 mx-auto"></div>
          </div>
          <p className="text-gray-300 mt-4 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
