'use client'

import Layout from '@/components/Layout'
import EventCard from '@/components/EventCard'
import { motion } from 'framer-motion'
import { Event } from '@/lib/store'

export default function PreEventsPage() {
  // Mock data - replace with actual data from Supabase
  const events: Event[] = [
    {
      id: '3',
      name: 'Code Hunt',
      description: 'A treasure hunt but for programmers! Solve coding clues to find the next location.',
      price: 100,
      min_team_size: 2,
      max_team_size: 4,
      category: 'pre-events'
    }
  ]

  return (
    <Layout>
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-8xl font-bold text-yellow-400 mb-4 pt-20">Pre-Events</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Get warmed up with these exciting preliminary events! Perfect for testing 
            the waters before the main competitions.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      </div>
    </Layout>
  )
}