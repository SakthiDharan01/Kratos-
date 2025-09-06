'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { motion } from 'framer-motion'
import { User, Mail, Phone, Building, BookOpen, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'

interface ProfileGuardProps {
  children: React.ReactNode
  requiresCompleteProfile?: boolean
}

export default function ProfileGuard({ children, requiresCompleteProfile = true }: ProfileGuardProps) {
  const { user, isAuthenticated, isProfileComplete, setUser } = useStore()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [showProfileForm, setShowProfileForm] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    college: user?.college || '',
    department: user?.department || '',
    year: user?.year || ''
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (requiresCompleteProfile && !isProfileComplete()) {
      setShowProfileForm(true)
    }
    setLoading(false)
  }, [isAuthenticated, requiresCompleteProfile, isProfileComplete, router])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate all fields are filled
    const requiredFields = ['name', 'email', 'phone', 'college', 'department', 'year']
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData])
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`)
      return
    }

    try {
      setLoading(true)
      
      // Update user profile in database
      const { error } = await supabase
        .from('users')
        .upsert({
          id: user!.id,
          ...formData,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      // Update local state
      setUser({
        ...user!,
        ...formData
      })

      toast.success('Profile completed successfully!')
      setShowProfileForm(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect to login
  }

  if (showProfileForm) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-md mx-auto pt-20 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900/50 border border-red-500/20 rounded-xl p-8 backdrop-blur-sm"
          >
            <h1 className="text-2xl font-bold text-yellow-400 mb-6 text-center">
              Complete Your Profile
            </h1>
            <p className="text-gray-300 mb-6 text-center text-sm">
              Please fill in all your details before proceeding with registration.
            </p>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-gray-800/50 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="Email Address *"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-gray-800/50 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  placeholder="Phone Number *"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full bg-gray-800/50 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div className="relative">
                <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="College/Institution *"
                  value={formData.college}
                  onChange={(e) => setFormData(prev => ({ ...prev, college: e.target.value }))}
                  className="w-full bg-gray-800/50 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div className="relative">
                <BookOpen className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Department/Branch *"
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full bg-gray-800/50 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <select
                  value={formData.year}
                  onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                  className="w-full bg-gray-800/50 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-red-500"
                  required
                >
                  <option value="">Select Year *</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="5th Year">5th Year</option>
                  <option value="Postgraduate">Postgraduate</option>
                  <option value="PhD">PhD</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Complete Profile'}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
