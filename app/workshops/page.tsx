'use client'

import Layout from '@/components/Layout'
import EventCard from '@/components/EventCard'
import { motion } from 'framer-motion'
import { Event } from '@/lib/store'
import { useEffect, useState } from 'react'
import { fetchEvents } from '@/lib/events'
import { EventModal } from '@/components/EventModal'

export default function WorkshopsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Event | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching workshop events...')
      const data = await fetchEvents('workshops')
      console.log('Workshop events fetched:', data)
      setEvents(data)
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? `Failed to load events: ${err.message}`
        : 'An unexpected error occurred while loading events'
      setError(errorMessage)
      console.error('Error loading workshop events:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
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
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Try Again'}
          </button>
        </div>
      )
    }

    if (!events.length) {
      return (
        <div className="text-center py-20">
          <div className="text-gray-400 mb-4">
            <h3 className="text-xl mb-2">No Workshops Available</h3>
            <p>Check back later or try refreshing the page</p>
          </div>
          <button 
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
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
          <h1 className="text-8xl font-bold text-yellow-400 mb-4 pt-20">Workshops</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Enhance your skills with hands-on learning experiences. Join expert-led workshops 
            covering the latest technologies and industry best practices!
          </p>
        </motion.div>

        {renderContent()}
      </div>
    </Layout>
  )
}