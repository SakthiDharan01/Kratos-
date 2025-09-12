'use client'

import { ReactNode } from 'react'
import HackathonNavbar from './HackathonNavbar'
import AuthProvider from './AuthProvider'
import { Toaster } from 'react-hot-toast'

interface HackathonLayoutProps {
  children: ReactNode
}

export default function HackathonLayout({ children }: HackathonLayoutProps) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-900/20 via-blue-900/20 to-black text-white relative overflow-hidden hackathon-scrollbar">
        {/* Hackathon-themed background effects */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:radial-gradient(white,transparent_70%)] pointer-events-none opacity-30" />
        
        {/* Animated circuit patterns */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-20 left-10 w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
          <div className="absolute top-32 right-20 w-1 h-1 bg-purple-400 rounded-full animate-pulse"></div>
          <div className="absolute bottom-40 left-1/4 w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce"></div>
          <div className="absolute top-1/2 right-10 w-2 h-2 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
        </div>

        {/* Gradient overlays for depth */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-purple-900/30 to-transparent pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-full h-96 bg-gradient-to-t from-blue-900/30 to-transparent pointer-events-none"></div>
        
        <HackathonNavbar />
        
        <main className="relative z-10">
          {children}
        </main>
        
        <Toaster 
          position="top-right"
          gutter={12}
          toastOptions={{
            style: {
              background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
              color: '#fff',
              border: '1px solid #06b6d4',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(6, 182, 212, 0.2)',
            },
            success: {
              iconTheme: {
                primary: '#06b6d4',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
          containerClassName="mt-16 mr-4"
        />
      </div>
    </AuthProvider>
  )
}