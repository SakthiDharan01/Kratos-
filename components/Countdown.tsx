'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock } from 'lucide-react'

interface CountdownProps {
  targetDate: string
  title?: string
  subtitle?: string
  onComplete?: () => void
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function Countdown({ 
  targetDate, 
  title = "Registration Opens In", 
  subtitle = "Get ready to hack!",
  onComplete 
}: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date()

      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        }
      } else {
        if (!isComplete) {
          setIsComplete(true)
          onComplete?.()
        }
        return { days: 0, hours: 0, minutes: 0, seconds: 0 }
      }
    }

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    // Initial calculation
    setTimeLeft(calculateTimeLeft())

    return () => clearInterval(timer)
  }, [targetDate, isComplete, onComplete])

  if (isComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 rounded-2xl border border-green-400/30">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            🎉 Registration is Now Open!
          </h2>
          <p className="text-xl text-green-100 mb-6">
            Ready to hack the future? Join us now!
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center"
    >
      <div className="bg-gradient-to-r from-blue-900/80 to-purple-900/80 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Clock className="w-8 h-8 text-blue-400" />
            {title}
          </h2>
          <p className="text-lg text-gray-300">{subtitle}</p>
        </motion.div>

        <div className="grid grid-cols-4 gap-4 md:gap-8 mb-6">
          {[
            { label: 'Days', value: timeLeft.days },
            { label: 'Hours', value: timeLeft.hours },
            { label: 'Minutes', value: timeLeft.minutes },
            { label: 'Seconds', value: timeLeft.seconds }
          ].map((unit, index) => (
            <motion.div
              key={unit.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl p-4 border border-blue-500/20"
            >
              <div className="text-3xl md:text-5xl font-bold text-blue-400 mb-2">
                {String(unit.value).padStart(2, '0')}
              </div>
              <div className="text-sm md:text-base text-gray-400 uppercase tracking-wider">
                {unit.label}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex items-center justify-center gap-2 text-blue-300"
        >
          <Calendar className="w-5 h-5" />
          <span className="text-lg">
            Registration opens: <span className="font-semibold text-blue-200">September 15, 2025</span>
          </span>
        </motion.div>
      </div>
    </motion.div>
  )
}
