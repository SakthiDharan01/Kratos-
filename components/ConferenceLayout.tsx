'use client'

import { ReactNode } from 'react'
import ConferenceNavbar from './ConferenceNavbar'
import AuthProvider from './AuthProvider'
import { Toaster } from 'react-hot-toast'

interface ConferenceLayoutProps {
  children: ReactNode
}

export default function ConferenceLayout({ children }: ConferenceLayoutProps) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-900/30 via-amber-900/10 to-black text-white relative overflow-hidden conference-scrollbar">
        {/* Conference-themed background effects */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:radial-gradient(white,transparent_70%)] pointer-events-none opacity-20" />
        
        {/* Academic paper-like patterns - responsive */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-32 left-8 sm:left-20 w-16 sm:w-32 h-0.5 bg-gradient-to-r from-amber-400/30 to-transparent"></div>
          <div className="absolute top-40 left-10 sm:left-24 w-12 sm:w-24 h-0.5 bg-gradient-to-r from-amber-400/20 to-transparent"></div>
          <div className="absolute top-48 left-8 sm:left-20 w-20 sm:w-40 h-0.5 bg-gradient-to-r from-amber-400/15 to-transparent"></div>
          
          <div className="absolute bottom-32 right-8 sm:right-20 w-16 sm:w-32 h-0.5 bg-gradient-to-l from-amber-400/30 to-transparent"></div>
          <div className="absolute bottom-40 right-10 sm:right-24 w-12 sm:w-24 h-0.5 bg-gradient-to-l from-amber-400/20 to-transparent"></div>
          <div className="absolute bottom-48 right-8 sm:right-20 w-20 sm:w-40 h-0.5 bg-gradient-to-l from-amber-400/15 to-transparent"></div>
          
          {/* Floating academic elements - responsive */}
          <div className="absolute top-60 left-4 sm:left-10 w-2 h-2 bg-amber-400 rounded-full animate-pulse opacity-60"></div>
          <div className="absolute top-80 right-6 sm:right-16 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse opacity-40" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-60 left-1/3 w-1 h-1 bg-orange-400 rounded-full animate-pulse opacity-50" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Elegant gradient overlays - responsive */}
        <div className="absolute top-0 left-0 w-full h-48 sm:h-96 bg-gradient-to-b from-slate-900/40 to-transparent pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-full h-48 sm:h-96 bg-gradient-to-t from-amber-900/20 to-transparent pointer-events-none"></div>
        
        {/* Subtle academic corner decorations - responsive */}
        <div className="absolute top-0 left-0 w-32 sm:w-64 h-32 sm:h-64 bg-gradient-to-br from-amber-900/10 to-transparent pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-32 sm:w-64 h-32 sm:h-64 bg-gradient-to-tl from-slate-900/20 to-transparent pointer-events-none"></div>
        
        <ConferenceNavbar />
        
        <main className="relative z-10 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
        
        <Toaster 
          position="top-right"
          gutter={12}
          toastOptions={{
            style: {
              background: 'linear-gradient(135deg, #1e293b 0%, #374151 100%)',
              color: '#fff',
              border: '1px solid #f59e0b',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(245, 158, 11, 0.2)',
              fontSize: '14px',
            },
            success: {
              iconTheme: {
                primary: '#f59e0b',
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
          containerClassName="mt-16 mr-2 sm:mr-4 z-50"
        />
      </div>
    </AuthProvider>
  )
}