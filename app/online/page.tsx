'use client'

import Layout from '@/components/Layout'
import EventCard from '@/components/EventCard'
import { motion } from 'framer-motion'
import { Event } from '@/lib/store'
import { useEffect, useState } from 'react'
import { fetchEvents } from '@/lib/events'
import { EventModal } from '@/components/EventModal'

export default function OnlinePage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Event | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const data = await fetchEvents('Online Events')
        if (!data) throw new Error('No data received')
        setEvents(data)
      } catch (err) {
        const errorMessage = err instanceof Error 
          ? `Failed to load events: ${err.message}`
          : 'An unexpected error occurred while loading events'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    return () => {
      setEvents([])
      setError(null)
    }
  }, [])

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-center py-20">
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 transition-colors"
          >
            Try Again
          </button>
        </div>
      )
    }

    if (!events.length) {
      return (
        <div className="text-center text-gray-400 py-20">
          No events available at the moment
        </div>
      )
    }

    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 md:px-8">
        {events.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <EventCard event={event} />
          </motion.div>
        ))}
      </div>
    )
  }

  return (
    <Layout>
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-8xl font-bold text-yellow-400 mb-4 pt-20">Online Events</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Participate from anywhere in the world! These virtual events bring 
            competition and collaboration to your fingertips.
          </p>
        </motion.div>

        {renderContent()}
      </div>
    </Layout>
  )
}
