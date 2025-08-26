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
      // Get the current session/user from Supabase
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error || !user) {
        toast.error("Login failed. Please try again.");
        router.push("/login");
        return;
      }
      // Set Zustand state
      setUser({
        id: user.id,
        name: user.user_metadata?.name || "",
        email: user.email || "",
        avatar_url: user.user_metadata?.avatar_url || "",
      });
      setAuthenticated(true);
      // Optionally, insert/update user in your custom users table
      await supabase.from("users").upsert({
        id: user.id,
        name: user.user_metadata?.name || "",
        email: user.email || "",
        avatar_url: user.user_metadata?.avatar_url || "",
      });
      router.push("/profile");
    }
    handleAuth();
  }, [router, setUser, setAuthenticated]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <span className="text-lg text-gray-300">Logging you in...</span>
    </div>
  );
}
