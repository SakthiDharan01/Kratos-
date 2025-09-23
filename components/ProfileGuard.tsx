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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    college: user?.college || '',
    department: user?.department || '',
    year: user?.year || ''
  })

  // Field validation functions
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Name is required'
        if (value.length < 2) return 'Name must be at least 2 characters'
        if (!/^[a-zA-Z\s]+$/.test(value)) return 'Name can only contain letters and spaces'
        return ''
      case 'email':
        if (!value.trim()) return 'Email is required'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address'
        return ''
      case 'phone':
        if (!value.trim()) return 'Phone number is required'
        if (!/^[6-9]\d{9}$/.test(value.replace(/\D/g, ''))) return 'Please enter a valid 10-digit Indian mobile number'
        return ''
      case 'college':
        if (!value.trim()) return 'College name is required'
        if (value.length < 3) return 'College name must be at least 3 characters'
        return ''
      case 'department':
        if (!value.trim()) return 'Department is required'
        if (value.length < 2) return 'Department must be at least 2 characters'
        return ''
      case 'year':
        if (!value.trim()) return 'Academic year is required'
        return ''
      default:
        return ''
    }
  }

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Real-time validation
    const error = validateField(field, value)
    setFieldErrors(prev => ({
      ...prev,
      [field]: error
    }))
  }

  useEffect(() => {
    // Fast synchronous check - no async needed
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    // Skip profile check if already completed in this session
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

    // Quick profile completeness check
    const isComplete = isProfileComplete()
    
    if (requiresCompleteProfile && !isComplete) {
      setShowProfileForm(true)
    } else {
      sessionStorage.setItem('profileCompleted', 'true')
      setProfileCheckDone(true)
    }
    
    setLoading(false)
  }, [isAuthenticated, requiresCompleteProfile, isProfileComplete, router, user])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate all fields
    const errors: Record<string, string> = {}
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData])
      if (error) errors[field] = error
    })

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      const firstError = Object.keys(errors)[0]
      toast.error(`Please fix the error in ${firstError}: ${errors[firstError]}`)
      // Focus the first error field
      const errorElement = document.querySelector(`[name="${firstError}"]`) as HTMLInputElement
      if (errorElement) errorElement.focus()
      return
    }

    try {
      setLoading(true)
      
      // Check if user already exists
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

      toast.success('✅ Profile completed successfully!')
      setShowProfileForm(false)
      setProfileCheckDone(true)
    } catch (error) {
      console.error('Error updating profile:', error)
      
      // More detailed error handling
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
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
                  name="name"
                  placeholder="Full Name *"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className={`w-full bg-gray-800/50 border rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none transition-colors ${
                    fieldErrors.name ? 'border-red-500 focus:border-red-400' : 'border-gray-600 focus:border-red-500'
                  }`}
                  required
                  aria-describedby={fieldErrors.name ? "name-error" : undefined}
                />
                {fieldErrors.name && (
                  <p id="name-error" className="text-red-400 text-xs mt-1 ml-1">
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address *"
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  className={`w-full bg-gray-800/50 border rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none transition-colors ${
                    fieldErrors.email ? 'border-red-500 focus:border-red-400' : 'border-gray-600 focus:border-red-500'
                  }`}
                  required
                  aria-describedby={fieldErrors.email ? "email-error" : undefined}
                />
                {fieldErrors.email && (
                  <p id="email-error" className="text-red-400 text-xs mt-1 ml-1">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div className="relative">
                <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number *"
                  value={formData.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  className={`w-full bg-gray-800/50 border rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none transition-colors ${
                    fieldErrors.phone ? 'border-red-500 focus:border-red-400' : 'border-gray-600 focus:border-red-500'
                  }`}
                  required
                  aria-describedby={fieldErrors.phone ? "phone-error" : undefined}
                />
                {fieldErrors.phone && (
                  <p id="phone-error" className="text-red-400 text-xs mt-1 ml-1">
                    {fieldErrors.phone}
                  </p>
                )}
              </div>

              <div className="relative">
                <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="college"
                  placeholder="College/Institution *"
                  value={formData.college}
                  onChange={(e) => handleFieldChange('college', e.target.value)}
                  className={`w-full bg-gray-800/50 border rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none transition-colors ${
                    fieldErrors.college ? 'border-red-500 focus:border-red-400' : 'border-gray-600 focus:border-red-500'
                  }`}
                  required
                  aria-describedby={fieldErrors.college ? "college-error" : undefined}
                />
                {fieldErrors.college && (
                  <p id="college-error" className="text-red-400 text-xs mt-1 ml-1">
                    {fieldErrors.college}
                  </p>
                )}
              </div>

              <div className="relative">
                <BookOpen className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="department"
                  placeholder="Department/Branch *"
                  value={formData.department}
                  onChange={(e) => handleFieldChange('department', e.target.value)}
                  className={`w-full bg-gray-800/50 border rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none transition-colors ${
                    fieldErrors.department ? 'border-red-500 focus:border-red-400' : 'border-gray-600 focus:border-red-500'
                  }`}
                  required
                  aria-describedby={fieldErrors.department ? "department-error" : undefined}
                />
                {fieldErrors.department && (
                  <p id="department-error" className="text-red-400 text-xs mt-1 ml-1">
                    {fieldErrors.department}
                  </p>
                )}
              </div>

              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <select
                  name="year"
                  value={formData.year}
                  onChange={(e) => handleFieldChange('year', e.target.value)}
                  className={`w-full bg-gray-800/50 border rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none transition-colors ${
                    fieldErrors.year ? 'border-red-500 focus:border-red-400' : 'border-gray-600 focus:border-red-500'
                  }`}
                  required
                  aria-describedby={fieldErrors.year ? "year-error" : undefined}
                >
                  <option value="">Select Academic Year *</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="5th Year">5th Year</option>
                  <option value="Graduate">Graduate</option>
                  <option value="Post Graduate">Post Graduate</option>
                </select>
                {fieldErrors.year && (
                  <p id="year-error" className="text-red-400 text-xs mt-1 ml-1">
                    {fieldErrors.year}
                  </p>
                )}
              </div>

              {/* Field completion indicator */}
              <div className="flex items-center justify-between py-2 px-3 bg-gray-800/30 rounded-lg">
                <span className="text-sm text-gray-400">Profile Completion</span>
                <div className="flex items-center gap-2">
                  {Object.values(fieldErrors).every(error => !error) && Object.values(formData).every(value => value.trim()) ? (
                    <span className="text-green-400 text-sm font-medium">✅ Complete</span>
                  ) : (
                    <span className="text-yellow-400 text-sm font-medium">
                      {Object.values(formData).filter(value => value.trim()).length}/6 fields
                    </span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || Object.values(fieldErrors).some(error => error) || !Object.values(formData).every(value => value.trim())}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors duration-200"
              >
                {loading ? 'Updating Profile...' : 'Continue Registration →'}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
