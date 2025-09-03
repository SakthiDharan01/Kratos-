'use client'

import Layout from '@/components/Layout'
import EventCard from '@/components/EventCard'
import { motion } from 'framer-motion'
import { Event } from '@/lib/store'
import { useEffect, useState } from 'react'
import { fetchEvents } from '@/lib/events'
import { EventModal } from '@/components/EventModal'

export default function NoCodePage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Event | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchEvents('no-code')
        setEvents(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <Layout>
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-8xl font-bold text-yellow-400 mb-4 pt-20">No-Code Events</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Build without coding! These events focus on visual development 
            and low-code/no-code platform solutions.
          </p>
        </motion.div>

        {loading ? (
          <div className="text-center text-gray-400 py-20">Loading events...</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelected(event)}
                className="cursor-pointer"
              >
                <EventCard event={event} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <EventModal open={!!selected} onOpenChange={(o) => !o && setSelected(null)} event={selected} />
    </Layout>
  )
}