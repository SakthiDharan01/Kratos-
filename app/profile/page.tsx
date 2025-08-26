'use client'

import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { motion } from 'framer-motion'
import { User, Mail, Building, BookOpen, Calendar, Phone, Edit, ShoppingBag } from 'lucide-react'
import { useStore } from '@/lib/store'

export default function ProfilePage() {
  const { user, isAuthenticated } = useStore()
  const router = useRouter()

  if (!isAuthenticated || !user) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h1 className="text-3xl font-bold text-yellow-400 mb-4">Please Login</h1>
          <p className="text-gray-300 mb-8">You need to be logged in to view your profile.</p>
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

  const profileFields = [
    { icon: <User className="w-5 h-5" />, label: 'Full Name', value: user.name },
    { icon: <Mail className="w-5 h-5" />, label: 'Email', value: user.email },
    { icon: <Phone className="w-5 h-5" />, label: 'Phone', value: user.phone },
    { icon: <Building className="w-5 h-5" />, label: 'College', value: user.college },
    { icon: <BookOpen className="w-5 h-5" />, label: 'Department', value: user.department },
    { icon: <Calendar className="w-5 h-5" />, label: 'Year', value: user.year },
  ]

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-5xl font-bold text-yellow-400 mb-4 flex items-center justify-center gap-3">
            <User className="w-12 h-12" />
            My Profile
          </h1>
          <p className="text-xl text-gray-300">
            Manage your account information and preferences
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gray-900/50 border border-red-500/20 rounded-xl p-8 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-white">Personal Information</h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Profile</span>
                </motion.button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {profileFields.map((field, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="space-y-2"
                  >
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-300">
                      {field.icon}
                      <span>{field.label}</span>
                    </label>
                    <div className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white">
                      {field.value}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-r from-red-600 to-maroon-700 p-6 rounded-xl text-white"
              >
                <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/cart')}
                    className="w-full bg-white/20 hover:bg-white/30 text-white py-3 px-4 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    <span>View Cart</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/pre-events')}
                    className="w-full bg-white/20 hover:bg-white/30 text-white py-3 px-4 rounded-lg transition-colors"
                  >
                    Browse Events
                  </motion.button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gray-900/50 border border-red-500/20 rounded-xl p-6 backdrop-blur-sm"
              >
                <h3 className="text-xl font-bold text-white mb-4">Account Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Registered Events</span>
                    <span className="text-yellow-400 font-bold">0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Total Spent</span>
                    <span className="text-green-400 font-bold">₹0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Account Status</span>
                    <span className="text-blue-400 font-bold">Active</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-blue-600 text-white p-4 rounded-lg text-center"
              >
                <p className="text-sm font-medium">🎯 Complete your registration to unlock exclusive events and early bird discounts!</p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}