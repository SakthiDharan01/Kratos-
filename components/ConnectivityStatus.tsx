'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react'

export default function ConnectivityStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [showStatus, setShowStatus] = useState(false)

  useEffect(() => {
    // Check initial connectivity
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine)
    }

    const handleOnline = () => {
      setIsOnline(true)
      setShowStatus(true)
      // Hide after 3 seconds
      setTimeout(() => setShowStatus(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowStatus(true)
      // Keep showing while offline
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Don't show status for normal online state initially
  if (!showStatus && isOnline) {
    return null
  }

  return (
    <AnimatePresence>
      {(showStatus || !isOnline) && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ 
            type: 'spring',
            stiffness: 400,
            damping: 25,
            duration: 0.3
          }}
          className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-[60] px-4 py-2 rounded-lg shadow-lg border backdrop-blur-sm ${
            isOnline
              ? 'bg-green-900/80 border-green-500/50 text-green-100'
              : 'bg-red-900/80 border-red-500/50 text-red-100'
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4" />
                <span>Connection restored</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                <span>You're offline</span>
              </>
            )}
          </div>
          
          {/* Offline mode message */}
          {!isOnline && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ delay: 0.2 }}
              className="text-xs text-red-200 mt-1 flex items-center gap-1"
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Some features may be limited</span>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Hook to check connectivity status
export function useConnectivity() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine)
    }

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}