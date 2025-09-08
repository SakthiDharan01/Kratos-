"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout'
import { motion } from 'framer-motion'
import { User, Mail, Building, BookOpen, Calendar, Phone, IndianRupee, CreditCard, ArrowRight } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function CheckoutPage() {
  const { cart, user, isAuthenticated } = useStore()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
  }, [isAuthenticated, router])

  // Check if profile is complete
  const isProfileComplete = user?.name && user?.college && user?.department && user?.year && user?.phone

  const handleProceedToPayment = () => {
    if (!isProfileComplete) {
      toast.error('Please complete your profile first')
      router.push('/profile')
      return
    }

    // Create registration draft using profile data
    const registrationData = {
      events: cart.map(item => ({
        eventId: item.event.id.toString(),
        teamName: `${user.name}'s Team`,
        participants: [{
          name: user.name,
          email: user.email,
          phone: user.phone,
          college: user.college,
          department: user.department,
          year: user.year,
          sameAsLeader: true
        }]
      }))
    }

    useStore.getState().setRegistrationDraft(registrationData)
    router.push('/checkout/review')
  }

  if (!isAuthenticated) {
    return <div>Redirecting to login...</div>
  }

  if (cart.length === 0) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h1 className="text-3xl font-bold text-yellow-400 mb-4">Your Cart is Empty</h1>
          <p className="text-gray-300 mb-8">Add some events to your cart first.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Browse Events
          </button>
        </div>
      </Layout>
    )
  }

  const totalAmount = cart.reduce((sum, item) => sum + item.event.price, 0)

  return (
    <Layout>
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl font-bold text-yellow-400 mb-8 text-center">Checkout</h1>

            {/* Profile Status */}
            <div className="bg-gray-900 rounded-xl p-6 mb-8">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <User className="mr-2" />
                Profile Status
              </h2>
              
              {isProfileComplete ? (
                <div className="bg-green-900/30 border border-green-500 rounded-lg p-4">
                  <p className="text-green-400 font-medium">✅ Profile Complete</p>
                  <div className="mt-2 text-sm text-gray-300">
                    <p><strong>Name:</strong> {user.name}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Phone:</strong> {user.phone}</p>
                    <p><strong>College:</strong> {user.college}</p>
                    <p><strong>Department:</strong> {user.department}</p>
                    <p><strong>Year:</strong> {user.year}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-red-900/30 border border-red-500 rounded-lg p-4">
                  <p className="text-red-400 font-medium">❌ Profile Incomplete</p>
                  <p className="text-sm text-gray-300 mt-2">
                    Please complete your profile before proceeding to payment.
                  </p>
                  <button
                    onClick={() => router.push('/profile')}
                    className="mt-3 bg-yellow-600 hover:bg-yellow-700 text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Complete Profile
                  </button>
                </div>
              )}
            </div>

            {/* Cart Items */}
            <div className="bg-gray-900 rounded-xl p-6 mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Order Summary</h2>
              
              {cart.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-3 border-b border-gray-700 last:border-b-0">
                  <div>
                    <h3 className="text-lg font-medium text-white">{item.event.name}</h3>
                    <p className="text-sm text-gray-400">{item.event.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-yellow-400">₹{item.event.price}</p>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-700">
                <span className="text-xl font-bold text-white">Total:</span>
                <span className="text-2xl font-bold text-yellow-400">₹{totalAmount}</span>
              </div>
            </div>

            {/* Proceed Button */}
            <div className="text-center">
              <button
                onClick={handleProceedToPayment}
                disabled={!isProfileComplete || loading}
                className={`${
                  isProfileComplete 
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600' 
                    : 'bg-gray-600 cursor-not-allowed'
                } text-black font-bold py-4 px-8 rounded-xl text-lg transition-all duration-300 flex items-center mx-auto`}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                ) : (
                  <CreditCard className="mr-2" />
                )}
                Proceed to Payment
                <ArrowRight className="ml-2" />
              </button>
              
              {!isProfileComplete && (
                <p className="text-red-400 text-sm mt-2">
                  Complete your profile to proceed
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  )
}
