'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function HackathonRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/htf')
    }, 2000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-purple-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center">
        <motion.div
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { repeat: Infinity, duration: 2 },
            scale: { repeat: Infinity, duration: 1.5 }
          }}
          className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto mb-6"
        />
        
        <h1 className="text-2xl font-bold text-white mb-4">
          Redirecting to Hack to the Future...
        </h1>
        
        <p className="text-gray-300 text-lg">
          The hackathon page has been updated! Taking you to the new countdown page.
        </p>
        
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 2 }}
          className="h-1 bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full mt-6 max-w-xs mx-auto"
        />
      </motion.div>
    </div>
  )
}