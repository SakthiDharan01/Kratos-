'use client'

import { motion } from 'framer-motion'
import { Plus, Users, IndianRupee, Lock, MapPin } from 'lucide-react'
import { Event } from '@/lib/store'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useStore } from '@/lib/store'
import { RulesModal } from './RulesModal'
import { EventDetailsModal } from './EventDetailsModal'

interface EventCardProps {
  event: Event
}

export default function EventCard({ event }: EventCardProps) {
  // Initialize teamSize with min_team_size for team events, or 1 for solo
  const [teamSize, setTeamSize] = useState(
    event.event_type === 'team' ? event.min_team_size : 1
  )
  const [isRegisteredForThisEvent, setIsRegisteredForThisEvent] = useState(false)
  const [checkingRegistration, setCheckingRegistration] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  const [showEventDetails, setShowEventDetails] = useState(false)
  const { addToCart, isAuthenticated, checkEventRegistrationStatus } = useStore()

  // Check registration status when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      setCheckingRegistration(true)
      
      // Only check if user is registered for this specific event
      checkEventRegistrationStatus(event.id).then((eventStatus) => {
        setIsRegisteredForThisEvent(eventStatus.isRegistered)
        setCheckingRegistration(false)
      }).catch(() => {
        setCheckingRegistration(false)
      })
    }
  }, [isAuthenticated, checkEventRegistrationStatus, event.id])

  const now = new Date()
  // Registration is always open now since we removed registration_start/end
  const isWindowOpen = true
  const isDisabled = event.status !== 'open' || !isWindowOpen || isRegisteredForThisEvent || 
                     (event.participant_limit != null && 
                      event.current_registrations != null && 
                      event.current_registrations >= event.participant_limit)

  // Fixed price per event, not per person
  const totalPrice = event.price

  const handleAddToCart = async () => {
    if (isDisabled) return
    if (!isAuthenticated) {
      toast.error('Please login to add events to cart')
      return
    }

    // Check if user is already registered for this specific event
    const eventStatus = await checkEventRegistrationStatus(event.id)
    
    if (eventStatus.isRegistered) {
      toast.error(`You have already paid for this event.`)
      setIsRegisteredForThisEvent(true)
      return
    }

    addToCart(event, teamSize)
    toast.success(`${event.name} added to cart!`)
  }

  return (
    <>
      <div className="w-full h-[400px] [perspective:1000px]" onClick={() => setIsFlipped(!isFlipped)}>
        <div className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
          {/* Front of card */}
          <div className="absolute w-full h-full [backface-visibility:hidden] bg-gray-900 rounded-2xl border-2 border-yellow-400 flex flex-col items-center justify-center p-8 text-center cursor-pointer hover:shadow-[0_0_30px_rgba(250,204,21,0.3)] transition-shadow duration-300">
            <p className="text-sm uppercase text-gray-400">{event.event_type === 'team' ? 'Team Event' : 'Solo Event'}</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-yellow-400 my-4">{event.name}</h2>
            {event.event_type === 'team' ? (
              <p className="font-semibold text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Size: {event.min_team_size === event.max_team_size ? 
                  `${event.min_team_size} member${event.min_team_size > 1 ? 's' : ''}` : 
                  `${event.min_team_size}-${event.max_team_size} members`}
              </p>
            ) : (
              <p className="font-semibold text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Solo Event
              </p>
            )}
            {/* <p className="mt-2 font-medium text-gray-300">₹{event.price}/member</p> */}
            <p className="mt-8 text-xs text-gray-500">Click to see details & register</p>
          </div>

          {/* Back of card */}
          <div className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-gray-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-white text-lg mb-1">{event.name}</h3>
              <p className="text-gray-300 text-sm mb-3 leading-relaxed">{event.description}</p>
              
              {/* Slot Details */}
              {event.time_slot && (
                <div className="mb-3">
                  <p className="text-sm text-gray-400 mb-1">Time Slot:</p>
                  <p className="text-sm text-yellow-400 font-medium">
                    {event.time_slot === 'morning' ? 'Morning Session' : 
                     event.time_slot === 'afternoon' ? 'Afternoon Session' : 
                     'Full Day (Morning & Afternoon)'}
                  </p>
                </div>
              )}

              <button 
                onClick={(e) => { 
                  e.stopPropagation()
                  setShowEventDetails(true)
                }} 
                className="text-sm font-semibold text-yellow-400 hover:text-yellow-300 hover:underline"
              >
                View Event Details
              </button>
              
              {(event.incharge_name1 || event.incharge_name2) && (
                <div className="mt-4 text-sm text-gray-300">
                  <p>Contact:</p>
                  {event.incharge_name1 && event.incharge_phone1 && (
                    <p>{event.incharge_name1}: {event.incharge_phone1}</p>
                  )}
                  {event.incharge_name2 && event.incharge_phone2 && (
                    <p>{event.incharge_name2}: {event.incharge_phone2}</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Team Size
                </label>
                {event.event_type === 'team' ? (
                  <div onClick={(e) => e.stopPropagation()}>
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
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">Solo participation</div>
                )}
              </div>

              <div className="flex justify-between items-center pt-2" onClick={(e) => e.stopPropagation()}>
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
                      : isRegisteredForThisEvent 
                        ? 'Already Paid' 
                        : !isWindowOpen
                          ? 'Closed' 
                          : 'Add to Cart'
                    }
                  </span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEventDetails && (
        <EventDetailsModal
          event={event}
          onClose={() => setShowEventDetails(false)}
        />
      )}
    </>
  )
}