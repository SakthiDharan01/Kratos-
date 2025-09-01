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
      try {
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
        
        // Find or create user in our users table
        let userData = null;
        
        // First check if user exists in our users table
        const { data: existingUser } = await supabase
          .from("users")
          .select("*")
          .eq("email", user.email)
          .single();

        if (existingUser) {
          userData = existingUser;
        } else {
          // Create new user record
          const { data: newUser, error: createError } = await supabase
            .from("users")
            .insert([{
              name: user.user_metadata?.name || user.email?.split('@')[0] || "",
              email: user.email || "",
              phone: user.phone || "",
              department: user.user_metadata?.department || "",
              year: user.user_metadata?.year || "1st",
              college: user.user_metadata?.college || "",
              role: "user"
            }])
            .select("*")
            .single();

          if (createError) {
            console.error("Error creating user:", createError);
            toast.error("Failed to create user profile");
            router.push("/login");
            return;
          }
          userData = newUser;
        }

        // Set Zustand state with our users table data
        setUser({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          phone: userData.phone,
          department: userData.department,
          year: userData.year,
          college: userData.college,
          is_active: userData.is_active,
          created_at: userData.created_at,
          updated_at: userData.updated_at
        });
        setAuthenticated(true);
        
        toast.success("Login successful!");
        router.push("/profile");
        
      } catch (error) {
        console.error("Auth error:", error);
        toast.error("Authentication failed");
        router.push("/login");
      }
    }
    
    handleAuth();
  }, [router, setUser, setAuthenticated]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <span className="text-lg text-gray-300">Logging you in...</span>
    </div>
  );
}
