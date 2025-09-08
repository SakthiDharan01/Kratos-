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
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </div>
        <Toaster 
            position="top-right"
            gutter={12} // spacing between toasts
            toastOptions={{
              style: {
                background: '#1a1a1a',
                color: '#fff',
                border: '1px solid #dc2626',
              },
            }}
            containerClassName="mt-16 mr-4" // offset below navbar
          />
      </div>
    </AuthProvider>
  )
}