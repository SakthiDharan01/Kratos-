'use client'

import Layout from '@/components/Layout'
import EventCard from '@/components/EventCard'
import { motion } from 'framer-motion'
import { Event } from '@/lib/store'

export default function GroundsPage() {
  const events: Event[] = [
    {
      id: '17',
      name: 'Tech Olympics',
      description: 'Multi-sport competition with a tech twist. Physical challenges meet digital innovation.',
      price: 300,
      min_team_size: 4,
      max_team_size: 8,
      category: 'grounds'
    },
    {
      id: '18',
      name: 'Robot Soccer',
      description: 'Build and program robots to play soccer in an automated tournament.',
      price: 600,
      min_team_size: 3,
      max_team_size: 6,
      category: 'grounds'
    },
    {
      id: '19',
      name: 'Drone Racing',
      description: 'Navigate through obstacle courses with custom-built racing drones.',
      price: 400,
      min_team_size: 1,
      max_team_size: 2,
      category: 'grounds'
    },
    {
      id: '20',
      name: 'Volleyball Tournament',
      description: 'Classic volleyball tournament for tech enthusiasts to unwind and compete.',
      price: 200,
      min_team_size: 6,
      max_team_size: 8,
      category: 'grounds'
    },
    {
      id: '21',
      name: 'Cricket Match',
      description: 'T20 cricket tournament with teams from different colleges and departments.',
      price: 500,
      min_team_size: 11,
      max_team_size: 15,
      category: 'grounds'
    },
    {
      id: '22',
      name: 'Treasure Hunt',
      description: 'Physical treasure hunt with QR codes and tech-based clues across the campus.',
      price: 150,
      min_team_size: 3,
      max_team_size: 5,
      category: 'grounds'
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
          <h1 className="text-8xl font-bold text-yellow-400 mb-4 pt-20">Ground Events</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Get active and enjoy outdoor competitions! From sports tournaments to 
            robot battles, these events combine physical activity with technology.
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