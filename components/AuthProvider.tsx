'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/lib/store'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setAuthenticated } = useStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    
    const initializeAuth = async () => {
      try {
        // Quick check for existing session without waiting for network
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return

        if (session?.user && !error) {
          // User is authenticated, set state immediately
          const userData = {
            id: session.user.id,
            phone: session.user.user_metadata?.phone || "",
            name: session.user.user_metadata?.name || "",
            email: session.user.email || "",
            college: session.user.user_metadata?.college || "",
            department: session.user.user_metadata?.department || "",
            year: session.user.user_metadata?.year || ""
          }
          
          console.log('AuthProvider: Setting user data:', userData);
          console.log('AuthProvider: Raw session user metadata:', session.user.user_metadata);
          
          setUser(userData)
          setAuthenticated(true)
          
          // Only sync user data if profile is complete and different from current
          if (userData.name && userData.college && userData.department && userData.year) {
            const userDataForSync = {
              id: session.user.id,
              phone: session.user.user_metadata?.phone || "",
              name: session.user.user_metadata?.name || "",
              email: session.user.email || "",
              college: session.user.user_metadata?.college || "",
              department: session.user.user_metadata?.department || "",
              year: session.user.user_metadata?.year || ""
            }
            
            // Only sync if data might be different (avoid unnecessary updates)
            supabase.from("users").upsert(userDataForSync, { 
              onConflict: 'id',
              ignoreDuplicates: true 
            }).then(({ error }) => {
              if (error && error.code !== '23505' && error.code !== '23503') {
                console.error('Background user sync error:', error)
              }
            })
          }
        } else {
          setUser(null)
          setAuthenticated(false)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mounted) {
          setAuthenticated(false)
          setUser(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    // Initialize immediately
    initializeAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            const userData = {
              id: session.user.id,
              phone: session.user.user_metadata?.phone || "",
              name: session.user.user_metadata?.name || "",
              email: session.user.email || "",
              college: session.user.user_metadata?.college || "",
              department: session.user.user_metadata?.department || "",
              year: session.user.user_metadata?.year || ""
            }
            setUser(userData)
            setAuthenticated(true)
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setAuthenticated(false)
          sessionStorage.removeItem('profileCompleted')
        }
      }
    )

    // Cleanup
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [setUser, setAuthenticated])

  // Show minimal loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
      </div>
    )
  }

  return <>{children}</>
}
