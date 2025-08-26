'use client'

<<<<<<< HEAD
import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '@/lib/supabase'
=======
import { useState, useEffect } from 'react'
>>>>>>> f7211310917d0ad0e3a85f2918d4758cb0b2fb3c
import Layout from '@/components/Layout'
import { motion } from 'framer-motion'
import { User, Mail, Building, BookOpen, Calendar, Phone, IndianRupee, CreditCard } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

<<<<<<< HEAD

const participantSchema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Phone required'),
  college: z.string().optional(),
  department: z.string().optional(),
  year: z.string().optional(),
})

const formSchema = z.object({
  events: z.array(z.object({
    eventId: z.string(),
    participants: z.array(participantSchema)
  }))
})

=======
interface Participant {
  name: string
  email: string
  college: string
  department: string
  year: string
  phone: string
  sameAsLeader?: boolean
}
>>>>>>> f7211310917d0ad0e3a85f2918d4758cb0b2fb3c

export default function CheckoutPage() {
  const { cart, user, getCartTotal, clearCart } = useStore()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const total = getCartTotal()

<<<<<<< HEAD
  // Build initial form values
  const defaultValues = {
    events: cart.map(item => ({
      eventId: item.event.id,
      participants: Array.from({ length: item.teamSize }, (_, idx) => ({
        name: idx === 0 ? user?.name || '' : '',
        email: idx === 0 ? user?.email || '' : '',
        phone: idx === 0 ? user?.phone || '' : '',
        college: idx === 0 ? user?.college || '' : '',
        department: idx === 0 ? user?.department || '' : '',
        year: idx === 0 ? user?.year || '' : '',
      }))
    }))
  }

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: 'onBlur',
  })
=======
  // Initializes the participant structure for an event when it's first rendered.
  const initializeParticipants = (eventId: string, teamSize: number) => {
    if (!participants[eventId]) {
      const newParticipants = Array.from({ length: teamSize }, (_, index) => ({
        name: index === 0 ? user?.name || '' : '',
        email: index === 0 ? user?.email || '' : '',
        college: index === 0 ? user?.college || '' : '',
        department: index === 0 ? user?.department || '' : '',
        year: index === 0 ? user?.year || '' : '',
        phone: index === 0 ? user?.phone || '' : '',
        sameAsLeader: false
      }))
      setParticipants(prev => ({ ...prev, [eventId]: newParticipants }))
    }
  }

  // Effect to initialize participants for all cart items on mount
  useEffect(() => {
    cart.forEach(item => {
      initializeParticipants(item.event.id, item.teamSize);
    });
  }, [cart]);


  // Updates a specific field for a participant.
  const updateParticipant = (eventId: string, index: number, field: keyof Participant, value: string | boolean) => {
    setParticipants(prev => {
      const eventParticipants = [...(prev[eventId] || [])]
       if (!eventParticipants[index]) return prev;

      const updatedParticipant = { ...eventParticipants[index], [field]: value };

      // If the leader's college, department, or year is updated, sync with followers.
      if (index === 0 && ['college', 'department', 'year'].includes(field as string)) {
          eventParticipants[0] = updatedParticipant;
          for (let i = 1; i < eventParticipants.length; i++) {
              if (eventParticipants[i].sameAsLeader) {
                  eventParticipants[i] = { ...eventParticipants[i], [field]: value };
              }
          }
      } else {
          eventParticipants[index] = updatedParticipant;
      }

      return { ...prev, [eventId]: eventParticipants }
    })
  }

  // Toggles the "Same as Leader" status for a participant.
  const toggleSameAsLeader = (eventId: string, index: number, checked: boolean) => {
    setParticipants(prev => {
      const eventParticipants = [...prev[eventId]]
      const leader = eventParticipants[0]

      if (checked) {
        // When checked, copy leader's details but keep fields editable.
        eventParticipants[index] = {
          ...eventParticipants[index],
          college: leader.college,
          department: leader.department,
          year: leader.year,
          sameAsLeader: true
        }
      } else {
        // When unchecked, just update the flag.
        eventParticipants[index] = {
          ...eventParticipants[index],
          sameAsLeader: false
        }
      }

      return { ...prev, [eventId]: eventParticipants }
    })
  }

  // Validates that all required participant fields are filled out.
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

  // Handles the final checkout process.
  const handleCheckout = async () => {
    if (!validateParticipants()) {
      toast.error('Please fill in all required participant details')
      return
    }
>>>>>>> f7211310917d0ad0e3a85f2918d4758cb0b2fb3c

  const handleCheckout = form.handleSubmit(async (data) => {
    setLoading(true)
    try {
<<<<<<< HEAD
      // Create registration
      const { data: reg, error: regErr } = await supabase
        .from('registrations')
        .insert({
          user_id: user?.id,
          total_amount: total,
          status: 'pending',
        })
        .select()
        .single()
      if (regErr || !reg) throw regErr || new Error('Registration failed')

      // Insert participants
      let allRows: any[] = []
      for (const event of data.events) {
        for (let i = 0; i < event.participants.length; i++) {
          const p = event.participants[i]
          allRows.push({
            registration_id: reg.id,
            event_id: event.eventId,
            name: p.name,
            email: p.email,
            phone: p.phone,
            college: p.college,
            department: p.department,
            year: p.year,
            is_leader: i === 0,
          })
        }
=======
      const receiptId = `TECH${Date.now()}`
      
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
>>>>>>> f7211310917d0ad0e3a85f2918d4758cb0b2fb3c
      }
      const { error: partErr } = await supabase
        .from('registration_participants')
        .insert(allRows)
      if (partErr) throw partErr

<<<<<<< HEAD
=======
      // Simulate API call
      console.log("Order Data:", orderData);
      await new Promise(resolve => setTimeout(resolve, 2000))

>>>>>>> f7211310917d0ad0e3a85f2918d4758cb0b2fb3c
      clearCart()
      toast.success('Order placed successfully!')
      router.push(`/receipt?id=${reg.id}`)
    } catch (error: any) {
      toast.error(error.message || 'Checkout failed. Please try again.')
    } finally {
      setLoading(false)
    }
  })

  // Display message if the cart is empty.
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

<<<<<<< HEAD
        <form onSubmit={handleCheckout} className="grid lg:grid-cols-3 gap-8">
          {/* Participant Details */}
          <div className="lg:col-span-2 space-y-6">
            {cart.map((item, index) => {
              const eventField = form.getValues(`events.${index}`)
=======
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Participant Details Section */}
          <div className="lg:col-span-2 space-y-6">
            {cart.map((item, index) => {
              const eventParticipants = participants[item.event.id] || []

>>>>>>> f7211310917d0ad0e3a85f2918d4758cb0b2fb3c
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
<<<<<<< HEAD
                    {eventField.participants.map((_, participantIndex) => (
                      <div key={participantIndex} className="border-b border-gray-700 pb-4">
=======
                    {eventParticipants.map((participant, participantIndex) => (
                      <div key={participantIndex} className="border-b border-gray-700 pb-4 last:border-b-0 last:pb-0">
>>>>>>> f7211310917d0ad0e3a85f2918d4758cb0b2fb3c
                        <h4 className="text-lg font-semibold text-white mb-4">
                          Participant {participantIndex + 1}
                          {participantIndex === 0 && ' (Team Leader)'}
                        </h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          {/* Name */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Full Name *
                            </label>
                            <div className="relative">
                              <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                {...form.register(`events.${index}.participants.${participantIndex}.name`)}
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white focus:border-red-500 focus:outline-none text-sm"
                              />
                              <span className="text-red-400 text-xs">{form.formState.errors?.events?.[index]?.participants?.[participantIndex]?.name?.message}</span>
                            </div>
                          </div>
<<<<<<< HEAD
=======

                          {/* Email */}
>>>>>>> f7211310917d0ad0e3a85f2918d4758cb0b2fb3c
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Email *
                            </label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                              <input
                                type="email"
                                {...form.register(`events.${index}.participants.${participantIndex}.email`)}
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white focus:border-red-500 focus:outline-none text-sm"
                              />
                              <span className="text-red-400 text-xs">{form.formState.errors?.events?.[index]?.participants?.[participantIndex]?.email?.message}</span>
                            </div>
                          </div>
<<<<<<< HEAD
=======

                          {/* Phone */}
>>>>>>> f7211310917d0ad0e3a85f2918d4758cb0b2fb3c
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Phone *
                            </label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                              <input
                                type="tel"
                                {...form.register(`events.${index}.participants.${participantIndex}.phone`)}
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white focus:border-red-500 focus:outline-none text-sm"
                              />
                              <span className="text-red-400 text-xs">{form.formState.errors?.events?.[index]?.participants?.[participantIndex]?.phone?.message}</span>
                            </div>
                          </div>
<<<<<<< HEAD
=======

                          {/* College */}
>>>>>>> f7211310917d0ad0e3a85f2918d4758cb0b2fb3c
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              College
                            </label>
                            <div className="relative">
                              <Building className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                {...form.register(`events.${index}.participants.${participantIndex}.college`)}
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white focus:border-red-500 focus:outline-none text-sm"
                              />
                            </div>
                          </div>
<<<<<<< HEAD
=======

                          {/* Department */}
>>>>>>> f7211310917d0ad0e3a85f2918d4758cb0b2fb3c
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Department
                            </label>
                            <div className="relative">
                              <BookOpen className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                {...form.register(`events.${index}.participants.${participantIndex}.department`)}
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white focus:border-red-500 focus:outline-none text-sm"
                              />
                            </div>
                          </div>
<<<<<<< HEAD
=======

                          {/* Year */}
>>>>>>> f7211310917d0ad0e3a85f2918d4758cb0b2fb3c
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Year
                            </label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                              <select
<<<<<<< HEAD
                                {...form.register(`events.${index}.participants.${participantIndex}.year`)}
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white focus:border-red-500 focus:outline-none text-sm"
=======
                                value={participant.year}
                                onChange={(e) => updateParticipant(item.event.id, participantIndex, 'year', e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white focus:border-red-500 focus:outline-none text-sm appearance-none"
>>>>>>> f7211310917d0ad0e3a85f2918d4758cb0b2fb3c
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

                        {/* Same as Leader Checkbox */}
                        {participantIndex !== 0 && (
                          <div className="col-span-2 mt-4">
                            <label className="inline-flex items-center space-x-2 text-sm text-gray-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={participant.sameAsLeader || false}
                                onChange={(e) => toggleSameAsLeader(item.event.id, participantIndex, e.target.checked)}
                                className="form-checkbox h-4 w-4 text-red-500 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
                              />
                              <span>Same as Leader (College, Department, Year)</span>
                            </label>
                          </div>
                        )}
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
                className="bg-gradient-to-br from-gray-900 to-black border border-red-500/30 p-6 rounded-xl shadow-lg"
              >
                <h3 className="text-2xl font-bold text-white mb-6">Order Summary</h3>
                <div className="space-y-4 mb-6">
                  {cart.map((item) => (
                    <div key={item.event.id} className="flex justify-between items-start border-b border-white/20 pb-3 last:border-b-0 last:pb-0">
                      <div className="flex-1 pr-4">
                        <h4 className="text-white font-medium">{item.event.name}</h4>
                        <p className="text-white/80 text-sm">{item.teamSize} participant(s)</p>
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
<<<<<<< HEAD
                <div className="bg-blue-600 text-white px-4 py-2 rounded-lg mb-6 text-center">
                  <span className="text-sm">💳 Razorpay integration ready</span>
=======

                <div className="bg-blue-600 text-white px-4 py-2 rounded-lg mb-6 text-center text-sm">
                  <span>💳 Secure payment via Razorpay</span>
>>>>>>> f7211310917d0ad0e3a85f2918d4758cb0b2fb3c
                </div>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Complete Registration'}
                </motion.button>
              </motion.div>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  )
}