'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Navbar from './Navbar'
import AnimatedBackground from './AnimatedBackground'
import AuthProvider from './AuthProvider'
import { Toaster } from 'react-hot-toast'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname()
  const isMainPage = pathname === '/'

  return (
    <AuthProvider>
      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        <AnimatedBackground />
        <div className="sticky top-0 z-50">
          <Navbar enableAutoHide={isMainPage} />
        </div>
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 relative z-10">
          {children}
        </main>
        <Toaster 
          position="top-right"
          gutter={12}
          toastOptions={{
            style: {
              background: '#1a1a1a',
              color: '#fff',
              border: '1px solid #dc2626',
              fontSize: '14px',
              maxWidth: '90vw',
              wordBreak: 'break-word',
            },
          }}
          containerClassName="mt-16 mr-2 sm:mr-4 z-50"
        />
      </div>
    </AuthProvider>
  )
}