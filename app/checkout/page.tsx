'use client'

import { useState } from 'react'
import Layout from '@/components/Layout'
import { motion } from 'framer-motion'
import { User, Mail, Building, BookOpen, Calendar, Phone, IndianRupee, CreditCard } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Participant {
  name: string
  email: string
  college: string
  department: string
  year: string
  phone: string
}

export default function CheckoutPage() {
  const { cart, user, getCartTotal, clearCart } = useStore()
  const router = useRouter()
  const [participants, setParticipants] = useState<{ [eventId: string]: Participant[] }>({})
  const [loading, setLoading] = useState(false)

  const total = getCartTotal()

  const initializeParticipants = (eventId: string, teamSize: number) => {
    if (!participants[eventId]) {
      const newParticipants = Array.from({ length: teamSize }, (_, index) => ({
        name: index === 0 ? user?.name || '' : '',
        email: index === 0 ? user?.email || '' : '',
        college: index === 0 ? user?.college || '' : '',
        department: index === 0 ? user?.department || '' : '',
        year: index === 0 ? user?.year || '' : '',
        phone: index === 0 ? user?.phone || '' : ''
      }))
      setParticipants(prev => ({ ...prev, [eventId]: newParticipants }))
    }
  }

  const updateParticipant = (eventId: string, index: number, field: keyof Participant, value: string) => {
    setParticipants(prev => ({
      ...prev,
      [eventId]: prev[eventId].map((p, i) => i === index ? { ...p, [field]: value } : p)
    }))
  }

  const validateParticipants = () => {
    for (const item of cart) {
      const eventParticipants = participants[item.event.id] || []
      if (eventParticipants.length !== item.teamSize) {
        return false
      }
      for (const participant of eventParticipants) {
        if (!participant.name || !participant.email || !participant.phone) {
          return false
        }
      }
    }
    return true
  }

  const handleCheckout = async () => {
    if (!validateParticipants()) {
      toast.error('Please fill in all required participant details')
      return
    }

    setLoading(true)
    try {
      // Generate receipt ID
      const receiptId = `TECH${Date.now()}`
      
      // Create order object
      const orderData = {
        user_id: user?.id || '',
        events: cart.map(item => ({
          event: item.event,
          teamSize: item.teamSize,
          participants: participants[item.event.id]
        })),
        participants: participants,
        total_amount: total,
        receipt_id: receiptId,
        status: 'pending'
      }

      // Simulate order creation - replace with actual Supabase integration
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Clear cart and redirect to receipt
      clearCart()
      toast.success('Order placed successfully!')
      router.push(`/receipt?id=${receiptId}`)
    } catch (error) {
      toast.error('Checkout failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (cart.length === 0) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h1 className="text-3xl font-bold text-yellow-400 mb-4">No Items to Checkout</h1>
          <p className="text-gray-300 mb-8">Your cart is empty. Add some events first!</p>
          <button
            onClick={() => router.push('/pre-events')}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Browse Events
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-5xl font-bold text-yellow-400 mb-4 flex items-center justify-center gap-3">
            <CreditCard className="w-12 h-12" />
            Checkout
          </h1>
          <p className="text-xl text-gray-300">
            Fill in participant details for all events
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Participant Details */}
          <div className="lg:col-span-2 space-y-6">
            {cart.map((item, index) => {
              initializeParticipants(item.event.id, item.teamSize)
              const eventParticipants = participants[item.event.id] || []

              return (
                <motion.div
                  key={item.event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-900/50 border border-red-500/20 rounded-xl p-6 backdrop-blur-sm"
                >
                  <h3 className="text-2xl font-bold text-yellow-400 mb-4">
                    {item.event.name}
                  </h3>
                  
                  <div className="space-y-6">
                    {eventParticipants.map((participant, participantIndex) => (
                      <div key={participantIndex} className="border-b border-gray-700 pb-4">
                        <h4 className="text-lg font-semibold text-white mb-4">
                          Participant {participantIndex + 1}
                          {participantIndex === 0 && ' (Team Leader)'}
                        </h4>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Full Name *
                            </label>
                            <div className="relative">
                              <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                value={participant.name}
                                onChange={(e) => updateParticipant(item.event.id, participantIndex, 'name', e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white focus:border-red-500 focus:outline-none text-sm"
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Email *
                            </label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                              <input
                                type="email"
                                value={participant.email}
                                onChange={(e) => updateParticipant(item.event.id, participantIndex, 'email', e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white focus:border-red-500 focus:outline-none text-sm"
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Phone *
                            </label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                              <input
                                type="tel"
                                value={participant.phone}
                                onChange={(e) => updateParticipant(item.event.id, participantIndex, 'phone', e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white focus:border-red-500 focus:outline-none text-sm"
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              College
                            </label>
                            <div className="relative">
                              <Building className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                value={participant.college}
                                onChange={(e) => updateParticipant(item.event.id, participantIndex, 'college', e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white focus:border-red-500 focus:outline-none text-sm"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Department
                            </label>
                            <div className="relative">
                              <BookOpen className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                value={participant.department}
                                onChange={(e) => updateParticipant(item.event.id, participantIndex, 'department', e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white focus:border-red-500 focus:outline-none text-sm"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Year
                            </label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                              <select
                                value={participant.year}
                                onChange={(e) => updateParticipant(item.event.id, participantIndex, 'year', e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white focus:border-red-500 focus:outline-none text-sm"
                              >
                                <option value="">Select Year</option>
                                <option value="1st Year">1st Year</option>
                                <option value="2nd Year">2nd Year</option>
                                <option value="3rd Year">3rd Year</option>
                                <option value="4th Year">4th Year</option>
                                <option value="Graduate">Graduate</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-r from-red-600 to-maroon-700 p-6 rounded-xl"
              >
                <h3 className="text-2xl font-bold text-white mb-6">Order Summary</h3>
                
                <div className="space-y-4 mb-6">
                  {cart.map((item) => (
                    <div key={item.event.id} className="flex justify-between items-start border-b border-white/20 pb-3">
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{item.event.name}</h4>
                        <p className="text-white/80 text-sm">{item.teamSize} participants</p>
                      </div>
                      <div className="text-white font-bold flex items-center">
                        <IndianRupee className="w-4 h-4" />
                        {item.event.price * item.teamSize}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-white/20 pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-white">Total</span>
                    <div className="text-2xl font-bold text-white flex items-center">
                      <IndianRupee className="w-5 h-5" />
                      {total}
                    </div>
                  </div>
                </div>

                <div className="bg-blue-600 text-white px-4 py-2 rounded-lg mb-6 text-center">
                  <span className="text-sm">💳 Razorpay integration ready</span>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Complete Registration'}
                </motion.button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}