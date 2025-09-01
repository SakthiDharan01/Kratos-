'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { motion } from 'framer-motion'
import EventCard from '@/components/EventCard'
import { EventModal } from '@/components/EventModal'
import { fetchEvents } from '@/lib/events'
import { Event } from '@/lib/store'

export default function NoCodePage() {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadEvents() {
      try {
        const allEvents = await fetchEvents()
        const noCodeEvents = allEvents.filter(event => event.category === 'no_code')
        setEvents(noCodeEvents)
      } catch (error) {
        console.error('Error loading no-code events:', error)
      } finally {
        setLoading(false)
      }
    }
    loadEvents()
  }, [])

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-gray-300">Loading no-code events...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-yellow-400 mb-4">
            No-Code Events
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Build amazing applications without writing a single line of code. Use platforms like Bubble, Webflow, and more!
          </p>
        </motion.div>

        {events.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-300 mb-4">No Events Available</h2>
            <p className="text-gray-400">Check back later for exciting no-code events!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedEvent(event)}
                className="cursor-pointer"
              >
                <EventCard event={event} />
              </motion.div>
            ))}
          </div>
        )}

        <EventModal
          open={!!selectedEvent}
          onOpenChange={() => setSelectedEvent(null)}
          event={selectedEvent}
        />
      </div>
    </Layout>
  )
}
