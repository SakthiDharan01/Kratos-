"use client";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/store";
import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, LogIn } from "lucide-react";
import toast from "react-hot-toast";

export default function GoogleLoginButton() {
  const { setUser, setAuthenticated } = useStore();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback`,
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
      className="w-full bg-white text-black font-medium py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-70"
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
      <span>{loading ? "Connecting..." : "Continue with Google"}</span>
    </motion.button>
  );
}
