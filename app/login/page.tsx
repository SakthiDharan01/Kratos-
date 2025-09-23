'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Phone, User, Mail, Building, BookOpen, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useStore } from '@/lib/store'
import Layout from '@/components/Layout'
import GoogleLoginButton from '@/components/GoogleLoginButton'

export default function LoginPage() {
  return (
    <Layout>
      <main className="max-w-md mx-auto">
        {/* Add even more top margin and spacing */}
        <div className="mt-40 mb-16">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900/50 border border-red-500/20 rounded-xl p-8 backdrop-blur-sm text-center"
            role="main"
            aria-labelledby="login-title"
          >
            <h1 id="login-title" className="text-3xl font-bold text-yellow-400 mb-8">
              Join Kratos'25
            </h1>
            <p className="text-gray-300 mb-12">
              Sign in with Google to continue to event registration.
            </p>
            
            {/* Move login button even further down with more spacing */}
            <div className="mt-12 pt-8 border-t border-gray-700/50">
              <GoogleLoginButton />
            </div>
          </motion.section>
        </div>
      </main>
    </Layout>
  )
}