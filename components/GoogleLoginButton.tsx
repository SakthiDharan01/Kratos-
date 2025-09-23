"use client";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/store";
import { getAppUrl } from "@/lib/utils";
import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, LogIn } from "lucide-react";
import toast from "react-hot-toast";

export default function GoogleLoginButton() {
  const { setUser, setAuthenticated } = useStore();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Localhost test mode: set mock user
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      setLoading(true);
      setTimeout(() => {
        setUser({
          id: 'test-user',
          name: 'Test User',
          email: 'test@localhost.com',
          phone: '9999999999',
          college: 'Test College',
          department: 'Testing',
          year: '4th Year',
        });
        setAuthenticated(true);
        setLoading(false);
        toast.success('Logged in as Test User');
      }, 500);
      return;
    }
    // Production: normal Google login
    try {
      setLoading(true);
      
      // Get the current app URL for redirect
      const currentOrigin = getAppUrl();
      const redirectUrl = `${currentOrigin}/auth/callback`;
      
      console.log('OAuth redirect URL will be:', redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });
      if (error) throw error;
      if (data?.url) {
        // Supabase will redirect
      }
    } catch (e: any) {
      toast.error(e.message || "Google login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleLogin}
      disabled={loading}
      className="w-full bg-white text-black font-medium py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-3 disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-gray-900 min-h-[48px]"
      aria-label={loading ? "Signing in with Google..." : "Sign in with Google"}
      type="button"
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
          <span>Connecting...</span>
        </>
      ) : (
        <>
          <LogIn className="w-5 h-5" aria-hidden="true" />
          <span>Continue with Google</span>
        </>
      )}
    </motion.button>
  );
}
