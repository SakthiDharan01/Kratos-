'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/lib/store'
import { AuthError } from '@supabase/supabase-js'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setAuthenticated } = useStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('AuthProvider: Initializing authentication state...')
    
    // Get initial session
    const initializeAuth = async () => {
      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('AuthProvider: Error getting session:', error)
          setAuthenticated(false)
          setUser(null)
          setLoading(false)
          return
        }

        if (session?.user) {
          console.log('AuthProvider: Found existing session for user:', session.user.id)
          
          // Set user in store
          setUser({
            id: session.user.id,
            phone: session.user.phone ?? "",
            name: session.user.user_metadata?.name || "",
            email: session.user.email || "",
            college: session.user.user_metadata?.college || "",
            department: session.user.user_metadata?.department || "",
            year: session.user.user_metadata?.year || ""
          })
          setAuthenticated(true)
          
          // Sync with users table
          await supabase.from("users").upsert({
            id: session.user.id,
            phone: session.user.phone ?? "",
            name: session.user.user_metadata?.name || "",
            email: session.user.email || "",
            college: session.user.user_metadata?.college || "",
            department: session.user.user_metadata?.department || "",
            year: session.user.user_metadata?.year || ""
          })
        } else {
          console.log('AuthProvider: No existing session found')
          setAuthenticated(false)
          setUser(null)
        }
      } catch (error) {
        console.error('AuthProvider: Error initializing auth:', error)
        setAuthenticated(false)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthProvider: Auth state changed:', event, session?.user?.id || 'no user')
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('AuthProvider: User signed in:', session.user.id)
          setUser({
            id: session.user.id,
            phone: session.user.phone ?? "",
            name: session.user.user_metadata?.name || "",
            email: session.user.email || "",
            college: session.user.user_metadata?.college || "",
            department: session.user.user_metadata?.department || "",
            year: session.user.user_metadata?.year || ""
          })
          setAuthenticated(true)
          
          // Sync with users table
          await supabase.from("users").upsert({
            id: session.user.id,
            phone: session.user.phone ?? "",
            name: session.user.user_metadata?.name || "",
            email: session.user.email || "",
            college: session.user.user_metadata?.college || "",
            department: session.user.user_metadata?.department || "",
            year: session.user.user_metadata?.year || ""
          })
        } else if (event === 'SIGNED_OUT') {
          console.log('AuthProvider: User signed out')
          setUser(null)
          setAuthenticated(false)
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('AuthProvider: Token refreshed for user:', session.user.id)
          // Update user data in case it changed
          setUser({
            id: session.user.id,
            phone: session.user.phone ?? "",
            name: session.user.user_metadata?.name || "",
            email: session.user.email || "",
            college: session.user.user_metadata?.college || "",
            department: session.user.user_metadata?.department || "",
            year: session.user.user_metadata?.year || ""
          })
          setAuthenticated(true)
        }
      }
    )

    // Cleanup subscription
    return () => {
      console.log('AuthProvider: Cleaning up auth listener')
      subscription.unsubscribe()
    }
  }, [setUser, setAuthenticated])

  // Show loading state while initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          Initializing...
        </div>
      </div>
    )
  }

  return <>{children}</>
}
