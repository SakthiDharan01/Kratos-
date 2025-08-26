'use client'

import Layout from '@/components/Layout'
import EventCard from '@/components/EventCard'
import { motion } from 'framer-motion'
import { Event } from '@/lib/store'

export default function TechnicalPage() {
  const events: Event[] = [
    {
      id: '4',
      name: 'Hackathon',
      description: 'Build innovative solutions in 24 hours. Bring your ideas to life and compete for amazing prizes.',
      price: 500,
      min_team_size: 2,
      max_team_size: 6,
      category: 'technical'
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
          <h1 className="text-8xl font-bold text-yellow-400 mb-4 pt-20">Technical Events</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Challenge yourself with cutting-edge technical competitions. From hackathons 
            to algorithmic challenges, test your programming prowess!
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