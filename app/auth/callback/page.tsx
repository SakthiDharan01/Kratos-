"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/store";
import toast from "react-hot-toast";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { setUser, setAuthenticated } = useStore();

  useEffect(() => {
    async function handleAuth() {
      console.log('AuthCallback: Starting authentication process...')
      
      try {
        // First try to get the session from the URL hash (for OAuth flows)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('AuthCallback: Session error:', sessionError)
          toast.error("Authentication failed. Please try again.")
          router.push("/login")
          return
        }

        if (!session?.user) {
          console.error('AuthCallback: No session or user found')
          toast.error("No authentication session found. Please try again.")
          router.push("/login")
          return
        }

        const user = session.user
        console.log('AuthCallback: Successfully authenticated user:', user.id)
        
        // Set Zustand state
        const userData = {
          id: user.id,
          phone: user.phone ?? "",
          name: user.user_metadata?.name || "",
          email: user.email || "",
          college: user.user_metadata?.college || "",
          department: user.user_metadata?.department || "",
          year: user.user_metadata?.year || ""
        }
        
        setUser(userData)
        setAuthenticated(true)
        
        console.log('AuthCallback: User data set in store:', userData)
        
        // Sync with users table
        const { error: upsertError } = await supabase.from("users").upsert({
          id: user.id,
          phone: user.phone ?? "",
          name: user.user_metadata?.name || "",
          email: user.email || "",
          college: user.user_metadata?.college || "",
          department: user.user_metadata?.department || "",
          year: user.user_metadata?.year || ""
        })
        
        if (upsertError) {
          console.error('AuthCallback: Error syncing user to database:', upsertError)
          // Don't fail the auth process for this
        }
        
        toast.success("Successfully logged in!")
        router.push("/profile")
      } catch (error) {
        console.error('AuthCallback: Unexpected error:', error)
        toast.error("An unexpected error occurred. Please try again.")
        router.push("/login")
      }
    }

    handleAuth()
  }, [router, setUser, setAuthenticated])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <span className="text-lg text-gray-300">Logging you in...</span>
    </div>
  );
}
//hello

