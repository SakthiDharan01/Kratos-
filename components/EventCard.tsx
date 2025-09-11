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
          <div className="absolute w-full h-full [backface-visibility:hidden] bg-gray-900 rounded-2xl border-2 border-yellow-400 flex flex-col items-center justify-center p-6 sm:p-8 text-center cursor-pointer hover:shadow-lg hover:shadow-yellow-500/30 transition-shadow duration-300">
            <p className="font-semibold text-white flex items-center gap-2 mb-4">
              {event.event_type === 'team' ? 'Team Event' : 'Solo Event'}
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-yellow-400 mb-3">{event.name}</h2>
            <p className="text-gray-300 text-sm mb-4 line-clamp-3">{event.description}</p>
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
            <p className="mt-8 text-xs text-gray-500">Click to see details & register</p>
          </div>

          {/* Back of card */}
          <div className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl overflow-hidden">
            {/* Glass effect background */}
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-xl backdrop-saturate-150" />
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 via-transparent to-yellow-400/5" />
            
            {/* Content container with better spacing */}
            <div className="relative h-full p-5 flex flex-col">
              {/* Top section with scrollable content */}
              <div className="flex-1 overflow-y-auto space-y-3 pb-4 scrollbar-thin scrollbar-track-gray-900/20 scrollbar-thumb-yellow-400/20">
                <h3 className="font-bold text-white text-lg">{event.name}</h3>
                <p className="text-gray-200 text-sm leading-relaxed">{event.description}</p>
                
                {/* Event Details Button */}
                <button 
                  onClick={(e) => { 
                    e.stopPropagation()
                    setShowEventDetails(true)
                  }} 
                  className="text-sm font-semibold text-yellow-400 hover:text-yellow-300 transition-colors"
                >
                  <u>View Event Details</u>
                </button>

                {/* Time slot info - more compact */}
                {event.time_slot && (
                  <div className="bg-black/20 rounded-lg p-2.5 border border-white/5">
                    <p className="text-yellow-400 text-sm font-medium">
                      {event.time_slot === 'morning' ? 'Morning Session' : 
                       event.time_slot === 'afternoon' ? 'Afternoon Session' : 
                       'Full Day'}
                    </p>
                  </div>
                )}
                
                {/* Contact Information - more compact */}
                {(event.incharge_name1 || event.incharge_name2) && (
                  <div className="bg-black/20 rounded-lg p-2.5 border border-white/5">
                    <div className="space-y-1">
                      {event.incharge_name1 && event.incharge_phone1 && (
                        <p className="text-sm text-gray-200">
                          {event.incharge_name1}: <span className="text-yellow-400">{event.incharge_phone1}</span>
                        </p>
                      )}
                      {event.incharge_name2 && event.incharge_phone2 && (
                        <p className="text-sm text-gray-200">
                          {event.incharge_name2}: <span className="text-yellow-400">{event.incharge_phone2}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom section - fixed height and more compact */}
              <div className="pt-3 border-t border-white/10">
                {/* Team Size Selection */}
                {event.event_type === 'team' && (
                  <div className="mb-3" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={teamSize}
                      disabled={isDisabled}
                      onChange={(e) => setTeamSize(Number(e.target.value))}
                      className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-yellow-400 focus:outline-none disabled:opacity-50"
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
                )}

                {/* Price and Add to Cart - more compact */}
                <div className="flex items-center justify-between gap-4" onClick={(e) => e.stopPropagation()}>
                  <div className="text-sm text-gray-300">
                    Total: <span className="text-yellow-400 font-bold">₹{totalPrice}</span>
                  </div>
                  <motion.button
                    whileHover={!isDisabled ? { scale: 1.02 } : undefined}
                    whileTap={!isDisabled ? { scale: 0.98 } : undefined}
                    onClick={handleAddToCart}
                    disabled={isDisabled || checkingRegistration}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm font-medium transition-all ${
                      isDisabled || checkingRegistration
                        ? 'bg-gray-800/50 text-gray-400 cursor-not-allowed' 
                        : 'bg-yellow-400 hover:bg-yellow-500 text-gray-900'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>
                      {checkingRegistration ? 'Checking...' : 
                       isRegisteredForThisEvent ? 'Paid' : 
                       !isWindowOpen ? 'Closed' : 
                       'Add to Cart'}
                    </span>
                  </motion.button>
                </div>
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