'use client'

import { useState } from 'react'
import Layout from '@/components/Layout'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Users, IndianRupee, ShoppingCart } from 'lucide-react'
import { useStore } from '@/lib/store'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export default function CartPage() {
  const { cart, removeFromCart, updateCartItem, getCartTotal, isAuthenticated } = useStore()
  const router = useRouter()

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h1 className="text-3xl font-bold text-yellow-400 mb-4">Please Login</h1>
          <p className="text-gray-300 mb-8">You need to be logged in to view your cart.</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Go to Login
          </button>
        </div>
      </Layout>
    )
  }

  const handleRemoveFromCart = (eventId: string | number) => {
    removeFromCart(eventId)
    toast.success('Item removed from cart')
  }

  const handleProceedToCheckout = () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty')
      return
    }
    router.push('/checkout')
  }

  const total = getCartTotal()

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-5xl font-bold text-yellow-400 mb-4 flex items-center justify-center gap-3">
            <ShoppingCart className="w-12 h-12" />
            Your Cart
          </h1>
          <p className="text-xl text-gray-300">
            Review your selected events before checkout
          </p>
        </motion.div>

        {cart.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <ShoppingCart className="w-24 h-24 text-gray-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-400 mb-4">Your cart is empty</h2>
            <p className="text-gray-500 mb-8">Start adding events to your cart to get started!</p>
            <button
              onClick={() => router.push('/technical')}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Browse Events
            </button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {cart.map((item, index) => (
                <motion.div
                  key={item.event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-900/50 border border-red-500/20 rounded-xl p-6 backdrop-blur-sm"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-yellow-400 mb-2">
                        {item.event.name}
                      </h3>
                      <p className="text-gray-300 mb-3">{item.event.description}</p>
                      <div className="flex items-center text-sm text-gray-400 space-x-4">
                        <span className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          Team Size: {item.teamSize}
                        </span>
                        <span className="flex items-center">
                          <IndianRupee className="w-4 h-4 mr-1" />
                          {item.event.price} per person
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Team Size
                        </label>
                        <select
                          value={item.teamSize}
                          onChange={(e) => updateCartItem(item.event.id, Number(e.target.value))}
                          className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-red-500 focus:outline-none"
                        >
                          {Array.from(
                            { length: 10 },
                            (_, i) => i + 1
                          ).map((size) => (
                            <option key={size} value={size}>
                              {size}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="text-center">
                        <div className="text-sm text-gray-400 mb-2">Total</div>
                        <div className="text-lg font-bold text-green-400 flex items-center">
                          <IndianRupee className="w-4 h-4" />
                          {item.event.price * item.teamSize}
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveFromCart(item.event.id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-red-600 to-maroon-700 p-6 rounded-xl"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Order Summary</h3>
                  <p className="text-white/80">
                    {cart.length} event{cart.length > 1 ? 's' : ''} • {cart.reduce((sum, item) => sum + item.teamSize, 0)} total participants
                  </p>
                </div>
                
                <div className="text-right">
                  <div className="text-3xl font-bold text-white flex items-center justify-end">
                    <IndianRupee className="w-6 h-6" />
                    {total}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleProceedToCheckout}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-8 py-3 rounded-lg transition-colors mt-4"
                  >
                    Proceed to Checkout
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </Layout>
  )
}