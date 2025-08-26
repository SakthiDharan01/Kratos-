'use client'

import { motion } from 'framer-motion'
import { Plus, Users, IndianRupee } from 'lucide-react'
import { Event } from '@/lib/store'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useStore } from '@/lib/store'

interface EventCardProps {
  event: Event
}

export default function EventCard({ event }: EventCardProps) {
  const [teamSize, setTeamSize] = useState(event.min_team_size)
  const { addToCart, isAuthenticated } = useStore()

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('Please login to add events to cart')
      return
    }
    
    addToCart(event, teamSize)
    toast.success(`${event.name} added to cart!`)
  }

  const totalPrice = event.price * teamSize

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-gray-900/50 border border-red-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-red-500/40 transition-all duration-300"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-yellow-400">{event.name}</h3>
        <div className="flex items-center text-green-400 font-bold">
          <IndianRupee className="w-4 h-4" />
          <span>{event.price}</span>
        </div>
      </div>
      
      <p className="text-gray-300 mb-4 leading-relaxed">{event.description}</p>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center text-sm text-gray-400">
          <Users className="w-4 h-4 mr-1" />
          <span>Team: {event.min_team_size}-{event.max_team_size} members</span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Team Size
          </label>
          <select
            value={teamSize}
            onChange={(e) => setTeamSize(Number(e.target.value))}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-red-500 focus:outline-none"
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

        <div className="flex justify-between items-center pt-2">
          <div className="text-sm text-gray-400">
            Total: <span className="text-green-400 font-bold">₹{totalPrice}</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddToCart}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add to Cart</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}