'use client'

import Layout from '@/components/Layout'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { fetchEvents } from '@/lib/events'
import { Event, useStore } from '@/lib/store'
import toast from 'react-hot-toast'
import { Sparkles, FileText, Users, Calendar, MapPin, ScrollText } from 'lucide-react'


const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-20">
    <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-blue-500 border-r-purple-500 border-b-pink-500 border-l-yellow-500"></div>
  </div>
);

const ErrorDisplay = ({ error, onRetry }: { error: string, onRetry: () => void }) => (
  <div className="flex flex-col justify-center items-center text-center px-4 py-20">
    <h2 className="text-2xl font-bold text-pink-500 mb-2">Oops! Something went wrong.</h2>
    <p className="text-gray-300 mb-6 max-w-md">{error}</p>
    <button
      onClick={onRetry}
      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:scale-105 transition-all duration-300 shadow-lg shadow-purple-500/30"
    >
      Try Again
    </button>
  </div>
);

const EventDetailItem = ({ icon: Icon, label, children }: { icon: any, label: string, children: React.ReactNode }) => (
  <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 group">
    <div className="flex items-center gap-3 mb-2">
      <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 group-hover:from-blue-500 group-hover:to-purple-500 transition-all duration-300">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h3 className="font-medium text-white/70 group-hover:text-white transition-colors">{label}</h3>
    </div>
    <p className="text-lg font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
      {children}
    </p>
  </div>
);

// --- Main Page Component ---

export default function ConferencePage() {
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teamSize, setTeamSize] = useState(1)
  const [isRegisteredForThisEvent, setIsRegisteredForThisEvent] = useState(false)
  const [checkingRegistration, setCheckingRegistration] = useState(false)
  
  const { addToCart, isAuthenticated, checkEventRegistrationStatus } = useStore()

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchEvents('conference')
      if (data.length > 0) {
        setEvent(data[0]) // Assume only one conference event
      } else {
        setError('The conference details could not be found. Please check back later.')
      }
    } catch (err) {
      const errorMessage = err instanceof Error
        ? `Failed to load event: ${err.message}`
        : 'An unexpected error occurred while loading the event'
      setError(errorMessage)
      console.error('Error loading conference:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Check registration status
  useEffect(() => {
    if (isAuthenticated && event) {
      setCheckingRegistration(true)
      checkEventRegistrationStatus(event.id)
        .then((eventStatus) => {
          setIsRegisteredForThisEvent(eventStatus.isRegistered)
        })
        .catch((error) => {
          console.error('Error checking registration:', error)
        })
        .finally(() => {
          setCheckingRegistration(false)
        })
    }
  }, [isAuthenticated, event, checkEventRegistrationStatus])

  // Initialize team size when event loads
  useEffect(() => {
    if (event) {
      setTeamSize(event.event_type === 'team' ? event.min_team_size : 1)
    }
  }, [event])

  const handleAddToCart = async () => {
    if (!event) return
    
    if (!isAuthenticated) {
      toast.error('Please login to register for events')
      return
    }

    if (isRegisteredForThisEvent) {
      toast.error('You have already registered for this event')
      return
    }

    try {
      addToCart(event, teamSize)
      toast.success(`${event.name} added to cart!`)
    } catch (error) {
      toast.error('Failed to add event to cart')
    }
  }

  // Animation variants for Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  }

  // Add a function to calculate total price
  const calculateTotalPrice = (basePrice: number, size: number) => {
    return basePrice * size;
  }

  const renderContent = () => {
    if (loading) return <LoadingSpinner />;
    if (error || !event) return <ErrorDisplay error={error || 'Event not found.'} onRetry={fetchData} />;

    // Calculate total price based on team size
    const totalPrice = calculateTotalPrice(event.price, teamSize);

    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto w-full"
      >
        {/* Hero Section */}
        <motion.div variants={itemVariants} className="text-center mb-16 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-3xl -z-10" />
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-white/10 mb-6">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-white/70">Paper Presentation</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-black mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              {event.name}
            </span>
          </h1>
          <p className="text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
            {event.description_detailed}
          </p>
        </motion.div>

        {/* Details Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <EventDetailItem icon={Calendar} label="Date">
            {new Date(event.event_date).toLocaleDateString()}
          </EventDetailItem>
          <EventDetailItem icon={MapPin} label="Venue">
            {event.venue}
          </EventDetailItem>
          <EventDetailItem icon={Users} label="Team Size">
            {event.event_type === 'solo'
              ? 'Solo Event'
              : event.min_team_size === event.max_team_size
              ? `${event.min_team_size} members`
              : `${event.min_team_size}-${event.max_team_size} members`}
          </EventDetailItem>
          <EventDetailItem icon={FileText} label="Price">
            ₹{event.price}
          </EventDetailItem>
        </motion.div>

        {/* Rounds and Rules Sections */}
        <motion.div variants={itemVariants} className="space-y-8 mb-12">
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500">
                <ScrollText className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Rounds</h2>
            </div>
            <div className="prose prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-sans bg-black/20 p-6 rounded-xl border border-white/5">
                {event.rounds}
              </pre>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
                <ScrollText className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Rules</h2>
            </div>
            <div className="prose prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-sans bg-black/20 p-6 rounded-xl border border-white/5">
                {event.rules}
              </pre>
            </div>
          </div>
        </motion.div>

        {/* Registration Section */}
        <motion.div variants={itemVariants}>
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10">
            <div className="flex flex-col sm:flex-row items-center gap-6 justify-between">
              {event.event_type === 'team' && (
                <div className="w-full sm:w-auto space-y-2">
                  <label className="block text-sm text-gray-400">Team Size</label>
                  <select
                    value={teamSize}
                    onChange={(e) => setTeamSize(Number(e.target.value))}
                    disabled={isRegisteredForThisEvent || checkingRegistration}
                    className="w-full sm:w-auto bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none disabled:opacity-50 transition-all"
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

              <div className="flex items-center gap-6">
                <div className="text-xl font-semibold space-y-1">

                  <p className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    ₹{event.price}
                  </p>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={isRegisteredForThisEvent || checkingRegistration || !isAuthenticated}
                  className={`px-8 py-3 rounded-xl font-medium transition-all duration-300 disabled:cursor-not-allowed ${
                    isRegisteredForThisEvent
                      ? 'bg-green-500 text-white'
                      : checkingRegistration
                      ? 'bg-gray-600 text-white/70'
                      : !isAuthenticated
                      ? 'bg-gray-600 text-white/70'
                      : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105'
                  }`}
                >
                  {isRegisteredForThisEvent
                    ? '✓ Already Registered'
                    : checkingRegistration
                    ? 'Checking...'
                    : !isAuthenticated
                    ? 'Login to Register'
                    : 'Add to Cart'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-black via-purple-900/20 to-black text-white px-6 py-20">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:radial-gradient(white,transparent_70%)] pointer-events-none" />
        <AnimatePresence mode="wait">
          <motion.div
            key={loading ? 'loading' : (error ? 'error' : 'content')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </Layout>
  );
}
