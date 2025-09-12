import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Get the current app URL for redirects (client-side safe)
export function getAppUrl(): string {
  // Client-side: use window.location.origin
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  
  // Server-side: try environment variable
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  
  // Fallback for development
  return "http://localhost:3000"
}