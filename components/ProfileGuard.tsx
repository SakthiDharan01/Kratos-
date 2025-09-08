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
  const [profileCheckDone, setProfileCheckDone] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    college: user?.college || '',
    department: user?.department || '',
    year: user?.year || ''
  })

  useEffect(() => {
    const checkProfileStatus = async () => {
      if (!isAuthenticated) {
        router.push('/login')
        return
      }

      // Skip profile check if we've already done it recently in this session
      const profileCompleted = sessionStorage.getItem('profileCompleted')
      if (profileCompleted === 'true') {
        setLoading(false)
        setProfileCheckDone(true)
        return
      }

      // Update form data with current user data
      if (user) {
        setFormData({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          college: user.college || '',
          department: user.department || '',
          year: user.year || ''
        })
      }

      const isComplete = isProfileComplete()
      
      if (requiresCompleteProfile && !isComplete) {
        setShowProfileForm(true)
      } else {
        // Mark that profile is complete for this session
        sessionStorage.setItem('profileCompleted', 'true')
        setProfileCheckDone(true)
      }
      
      setLoading(false)
    }

    checkProfileStatus()
  }, [isAuthenticated, requiresCompleteProfile, isProfileComplete, router, user])

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
      
      // First, try to check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', user!.id)
        .single()

      // Prepare update data
      const updateData = {
        id: user!.id,
        ...formData,
        updated_at: new Date().toISOString()
      }

      let error
      if (existingUser) {
        // User exists, do UPDATE
        const result = await supabase
          .from('users')
          .update(updateData)
          .eq('id', user!.id)
        error = result.error
      } else {
        // User doesn't exist, do INSERT
        const result = await supabase
          .from('users')
          .insert(updateData)
        error = result.error
      }

      if (error) {
        console.error('Profile update error details:', error)
        throw error
      }

      // Update local state
      setUser({
        ...user!,
        ...formData
      })

      // Mark profile as completed for this session
      sessionStorage.setItem('profileCompleted', 'true')

      toast.success('Profile completed successfully!')
      setShowProfileForm(false)
      setProfileCheckDone(true)
    } catch (error) {
      console.error('Error updating profile:', error)
      
      // More detailed error logging for 409 debugging
      if (error && typeof error === 'object') {
        const err = error as any
        console.error('Error details:', {
          message: err.message,
          details: err.details,
          hint: err.hint,
          code: err.code,
          status: err.status
        })
        
        if (err.code === '23505') {
          toast.error('This email or phone number is already in use by another account.')
        } else if (err.status === 409) {
          toast.error('Profile update conflict. Please try again or contact support.')
        } else {
          toast.error('Failed to update profile. Please try again.')
        }
      } else {
        toast.error('Failed to update profile. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-12 w-12 border-2 border-gray-700 mx-auto"></div>
          </div>
          <p className="text-gray-300 mt-4 text-sm">Checking profile...</p>
        </div>
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
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-3 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving Profile...
                  </>
                ) : (
                  'Complete Profile'
                )}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
