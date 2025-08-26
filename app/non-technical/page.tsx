'use client'

import Layout from '@/components/Layout'
import EventCard from '@/components/EventCard'
import { motion } from 'framer-motion'
import { Event } from '@/lib/store'

export default function NonTechnicalPage() {
  const events: Event[] = [
    {
      id: '2',
      name: 'Photography Contest',
      description: 'Capture the essence of technology and innovation through your lens.',
      price: 150,
      min_team_size: 1,
      max_team_size: 1,
      category: 'non-technical'
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
          <h1 className="text-8xl font-bold text-yellow-400 mb-4 pt-20">Non-Technical Events</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Express your creativity and showcase your talents! These events celebrate 
            the artistic and creative side of technology.
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