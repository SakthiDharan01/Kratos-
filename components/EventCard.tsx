'use client'

import { motion } from 'framer-motion'
import { Plus, Users, IndianRupee, Lock } from 'lucide-react'
import { Event } from '@/lib/store'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useStore } from '@/lib/store'

interface EventCardProps {
  event: Event
}

export default function EventCard({ event }: EventCardProps) {
  const [teamSize, setTeamSize] = useState(event.min_team_size)
  const [userHasRegistration, setUserHasRegistration] = useState(false)
  const [registeredEventName, setRegisteredEventName] = useState('')
  const [checkingRegistration, setCheckingRegistration] = useState(false)
  const { addToCart, isAuthenticated, checkUserRegistrationStatus } = useStore()

  // Check if user already has a registration when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      setCheckingRegistration(true)
      checkUserRegistrationStatus().then((result) => {
        setUserHasRegistration(result.hasRegistration)
        setRegisteredEventName(result.eventName || '')
        setCheckingRegistration(false)
      })
    }
  }, [isAuthenticated, checkUserRegistrationStatus])

  const now = new Date()
  const regStart = event.registration_start ? new Date(event.registration_start) : null
  const regEnd = event.registration_end ? new Date(event.registration_end) : null
  const isWindowOpen = (
    (!regStart || now >= regStart) && (!regEnd || now <= regEnd)
  )
  const isDisabled = event.status !== 'open' || !isWindowOpen || userHasRegistration

  const handleAddToCart = async () => {
    if (isDisabled) return
    if (!isAuthenticated) {
      toast.error('Please login to add events to cart')
      return
    }

    // Double-check registration status before adding to cart
    const registrationStatus = await checkUserRegistrationStatus()
    if (registrationStatus.hasRegistration) {
      toast.error(`You are already registered for "${registrationStatus.eventName}". Each participant can only register for one event.`)
      setUserHasRegistration(true)
      setRegisteredEventName(registrationStatus.eventName || '')
      return
    }

    addToCart(event, teamSize)
    toast.success(`${event.name} added to cart!`)
  }

  const totalPrice = event.price * teamSize

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-gray-900/50 border border-red-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-red-500/40 transition-all duration-300"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
            {event.name}
            {isDisabled && userHasRegistration && (
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-orange-700 text-orange-300 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Already Registered
              </span>
            )}
            {isDisabled && !userHasRegistration && (
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-gray-700 text-gray-300 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Closed
              </span>
            )}
          </h3>
          <p className="text-xs text-gray-400 mt-1 uppercase">{event.event_type === 'team' ? 'Team Event' : 'Solo Event'}</p>
          {userHasRegistration && (
            <p className="text-xs text-orange-400 mt-1">
              You're registered for: {registeredEventName}
            </p>
          )}
        </div>
        <div className="flex items-center text-green-400 font-bold">
          <IndianRupee className="w-4 h-4" />
          <span>{event.price}</span>
        </div>
      </div>
      
      <p className="text-gray-300 mb-4 leading-relaxed">{event.description}</p>
      
      {event.event_type === 'team' && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-sm text-gray-400">
            <Users className="w-4 h-4 mr-1" />
            <span>Team: {event.min_team_size}-{event.max_team_size} members</span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Team Size
          </label>
          {event.event_type === 'team' ? (
            <select
              value={teamSize}
              disabled={isDisabled}
              onChange={(e) => setTeamSize(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-red-500 focus:outline-none disabled:opacity-50"
            >
              {Array.from(
                { length: event.max_team_size - event.min_team_size + 1 },
                (_, i) => event.min_team_size + i
              ).map((size) => (
                <option key={size} value={size}>
                  {size} member{size > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          ) : (
            <div className="text-sm text-gray-400">Solo participation</div>
          )}
        </div>

        <div className="flex justify-between items-center pt-2">
          <div className="text-sm text-gray-400">
            Total: <span className="text-green-400 font-bold">₹{totalPrice}</span>
          </div>
          <motion.button
            whileHover={!isDisabled ? { scale: 1.05 } : undefined}
            whileTap={!isDisabled ? { scale: 0.95 } : undefined}
            onClick={handleAddToCart}
            disabled={isDisabled || checkingRegistration}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
              isDisabled || checkingRegistration
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>
              {checkingRegistration 
                ? 'Checking...' 
                : userHasRegistration 
                  ? 'Already Registered' 
                  : isDisabled 
                    ? 'Closed' 
                    : 'Add to Cart'
              }
            </span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}