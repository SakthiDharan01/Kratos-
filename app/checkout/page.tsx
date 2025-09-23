"use client";
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout'
import { motion } from 'framer-motion'
import { User, Mail, Building, BookOpen, Calendar, Phone, IndianRupee, CreditCard, ArrowRight, Users, Plus, X, Check, Clock, AlertTriangle, Copy } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { withRetry } from '@/lib/error-recovery'

type CheckoutStep = 'profile' | 'team' | 'participants' | 'review'
//hello there 
interface Participant {
  name: string
  email: string
  phone: string
  college: string
  department: string
  year: string
  state: string
  location: string
  isLeader?: boolean
}

interface TeamData {
  eventId: string
  teamName: string
  leaderDetails: Participant
  participants: Participant[]
}

export default function CheckoutPage() {
  const { cart, user, isAuthenticated } = useStore()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('profile')
  const [teamData, setTeamData] = useState<TeamData[]>([])
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [pendingRegistrations, setPendingRegistrations] = useState<any[]>([])
  const [checkingPendingRegistrations, setCheckingPendingRegistrations] = useState(true)
  
  // Form for current team being edited
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0)
  const [validationErrors, setValidationErrors] = useState<{[key: string]: {[key: string]: string}}>({})
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm()

  // Load data from session storage on mount
  useEffect(() => {
    recoverSavedData()
  }, [])

  // Check for pending registrations
  useEffect(() => {
    if (user?.id) {
      checkPendingRegistrations()
    }
  }, [user?.id])

  const checkPendingRegistrations = async () => {
    try {
      setCheckingPendingRegistrations(true)
      const { data: pendingRegs, error } = await supabase
        .from('registrants')
        .select('*')
        .eq('created_by', user?.id)
        .eq('status', 'pending')
      
      if (error) {
        console.error('Error checking pending registrations:', error)
        return
      }
      
      setPendingRegistrations(pendingRegs || [])
    } catch (error) {
      console.error('Error checking pending registrations:', error)
    } finally {
      setCheckingPendingRegistrations(false)
    }
  }

  // Save to session storage whenever teamData changes with status indicator
  useEffect(() => {
    if (teamData.length > 0) {
      setAutoSaveStatus('saving')
      try {
        sessionStorage.setItem('checkoutTeamData', JSON.stringify(teamData))
        setAutoSaveStatus('saved')
        setLastSaved(new Date())
        setTimeout(() => setAutoSaveStatus('idle'), 2000)
      } catch (error) {
        console.error('Error auto-saving team data:', error)
        setAutoSaveStatus('error')
        setTimeout(() => setAutoSaveStatus('idle'), 3000)
      }
    }
  }, [teamData])

  // Save current step and team index to session storage
  useEffect(() => {
    sessionStorage.setItem('checkoutCurrentStep', currentStep)
    sessionStorage.setItem('checkoutCurrentTeamIndex', currentTeamIndex.toString())
  }, [currentStep, currentTeamIndex])

  // Enhanced auto-save function with status indicators
  const autoSaveFormData = (formData: any, skipStatusUpdate = false) => {
    if (!skipStatusUpdate) {
      setAutoSaveStatus('saving')
    }
    
    try {
      sessionStorage.setItem('checkoutFormData', JSON.stringify(formData))
      if (!skipStatusUpdate) {
        setAutoSaveStatus('saved')
        setLastSaved(new Date())
        
        // Reset to idle after 2 seconds
        setTimeout(() => setAutoSaveStatus('idle'), 2000)
      }
    } catch (error) {
      console.error('Error auto-saving form data:', error)
      if (!skipStatusUpdate) {
        setAutoSaveStatus('error')
        toast.error('Failed to save progress. Please try again.')
        
        // Reset to idle after 3 seconds
        setTimeout(() => setAutoSaveStatus('idle'), 3000)
      }
    }
  }

  // Enhanced data recovery with better error handling
  const recoverSavedData = () => {
    try {
      const savedData = sessionStorage.getItem('checkoutTeamData')
      const savedStep = sessionStorage.getItem('checkoutCurrentStep')
      const savedTeamIndex = sessionStorage.getItem('checkoutCurrentTeamIndex')
      const savedFormData = sessionStorage.getItem('checkoutFormData')
      
      let hasRecoveredData = false
      
      if (savedData) {
        const parsedTeamData = JSON.parse(savedData)
        if (Array.isArray(parsedTeamData) && parsedTeamData.length > 0) {
          setTeamData(parsedTeamData)
          hasRecoveredData = true
        }
      }
      
      if (savedStep && ['profile', 'team', 'participants', 'review'].includes(savedStep)) {
        setCurrentStep(savedStep as CheckoutStep)
        hasRecoveredData = true
      }
      
      if (savedTeamIndex) {
        const parsedIndex = parseInt(savedTeamIndex)
        if (!isNaN(parsedIndex) && parsedIndex >= 0) {
          setCurrentTeamIndex(parsedIndex)
          hasRecoveredData = true
        }
      }
      
      if (savedFormData) {
        const parsedFormData = JSON.parse(savedFormData)
        reset(parsedFormData)
        hasRecoveredData = true
      }
      
      if (hasRecoveredData) {
        toast.success('Previous progress restored!', {
          duration: 4000,
          icon: '💾'
        })
        setLastSaved(new Date())
      }
      
    } catch (error) {
      console.error('Error recovering saved checkout data:', error)
      toast.error('Failed to recover saved progress')
    }
  }

  // Clear all session data
  const clearSessionData = () => {
    sessionStorage.removeItem('checkoutTeamData')
    sessionStorage.removeItem('checkoutCurrentStep')
    sessionStorage.removeItem('checkoutCurrentTeamIndex')
    sessionStorage.removeItem('checkoutFormData')
  }

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
  }, [isAuthenticated, router])

  // Check if profile is complete (with more robust checking)
  const isProfileComplete = user?.name && user?.college && user?.department && user?.year && user?.phone && 
                            user.name.trim() !== '' && user.college.trim() !== '' && 
                            user.department.trim() !== '' && user.year.trim() !== '' && user.phone.trim() !== ''

  // Initialize team data from user profile and cart
  useEffect(() => {
    if (isProfileComplete && cart.length > 0 && teamData.length === 0) {
      const initialTeamData = cart.map(item => ({
        eventId: item.event.id.toString(),
        teamName: `${user.name}'s Team`,
        leaderDetails: {
          name: user.name,
          email: user.email,
          phone: user.phone,
          college: user.college,
          department: user.department,
          year: user.year,
          state: '', // Initialize as empty, user will fill it
          location: '', // Initialize as empty, user will fill it
          isLeader: true
        },
        participants: []
      }))
      setTeamData(initialTeamData)
    }
  }, [isProfileComplete, cart.length, user?.name, user?.email, user?.phone, user?.college, user?.department, user?.year]) // Remove teamData.length dependency

  const handleStepNavigation = (step: CheckoutStep) => {
    if (step === 'profile' && !isProfileComplete) {
      router.push('/profile')
      return
    }
    if (step === 'team' && isProfileComplete) {
      setCurrentStep('team')
    }
    if (step === 'participants') {
      setCurrentStep('participants')
    }
    if (step === 'review') {
      setCurrentStep('review')
    }
  }

  const handleTeamDetailsSubmit = (data: any) => {
    // Auto-save form data before processing
    autoSaveFormData(data)
    
    const updatedTeamData = [...teamData]
    updatedTeamData[currentTeamIndex] = {
      ...updatedTeamData[currentTeamIndex],
      teamName: data.teamName,
      leaderDetails: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        college: data.college,
        department: data.department,
        year: data.year,
        state: data.state,
        location: data.location,
        isLeader: true
      }
    }
    setTeamData(updatedTeamData)
    
    // Move to next team or participants step
    if (currentTeamIndex < teamData.length - 1) {
      setCurrentTeamIndex(currentTeamIndex + 1)
      // Pre-fill form with next team's data
      const nextTeam = updatedTeamData[currentTeamIndex + 1]
      reset({
        teamName: nextTeam.teamName,
        ...nextTeam.leaderDetails
      })
    } else {
      setCurrentStep('participants')
    }
  }

  const addParticipant = (teamIndex: number) => {
    const updatedTeamData = [...teamData]
    updatedTeamData[teamIndex].participants.push({
      name: '',
      email: '',
      phone: '',
      college: '',
      department: '',
      year: '',
      state: '',
      location: ''
    })
    setTeamData(updatedTeamData)
  }

  const removeParticipant = (teamIndex: number, participantIndex: number) => {
    const updatedTeamData = [...teamData]
    updatedTeamData[teamIndex].participants.splice(participantIndex, 1)
    setTeamData(updatedTeamData)
  }

  const updateParticipant = (teamIndex: number, participantIndex: number, field: string, value: string) => {
    const updatedTeamData = [...teamData]
    updatedTeamData[teamIndex].participants[participantIndex] = {
      ...updatedTeamData[teamIndex].participants[participantIndex],
      [field]: value
    }
    setTeamData(updatedTeamData)
    
    // Clear existing error for this field when user starts typing
    const key = `${teamIndex}-${participantIndex}`
    if (validationErrors[key]?.[field]) {
      const newErrors = { ...validationErrors }
      delete newErrors[key][field]
      if (Object.keys(newErrors[key]).length === 0) {
        delete newErrors[key]
      }
      setValidationErrors(newErrors)
    }
    
    // Auto-save updated participant data with visual feedback
    autoSaveFormData({ teamData: updatedTeamData })
  }

  // Quick fill functions
  const copyFromLeader = (teamIndex: number, participantIndex: number, fields: string[]) => {
    const updatedTeamData = [...teamData]
    const leader = updatedTeamData[teamIndex].leaderDetails
    
    fields.forEach(field => {
      if (leader[field as keyof Participant]) {
        updatedTeamData[teamIndex].participants[participantIndex] = {
          ...updatedTeamData[teamIndex].participants[participantIndex],
          [field]: leader[field as keyof Participant]
        }
      }
    })
    
    setTeamData(updatedTeamData)
    autoSaveFormData({ teamData: updatedTeamData })
    
    toast.success(`Copied ${fields.length} field(s) from team leader`, {
      icon: '📋',
      duration: 2000
    })
  }

  const applyToAllParticipants = (teamIndex: number, field: string, value: string) => {
    const updatedTeamData = [...teamData]
    
    updatedTeamData[teamIndex].participants.forEach((_, index) => {
      updatedTeamData[teamIndex].participants[index] = {
        ...updatedTeamData[teamIndex].participants[index],
        [field]: value
      }
    })
    
    setTeamData(updatedTeamData)
    autoSaveFormData({ teamData: updatedTeamData })
    
    toast.success(`Applied ${field} to all team members`, {
      icon: '🔄',
      duration: 2000
    })
  }

  const copyCommonFields = (teamIndex: number, participantIndex: number) => {
    copyFromLeader(teamIndex, participantIndex, ['college', 'department', 'year', 'state', 'location'])
  }

  // Enhanced validation functions
  const validateParticipant = (participant: Participant, teamIndex: number, participantIndex: number) => {
    const errors: {[key: string]: string} = {}
    
    // Required field validation
    if (!participant.name?.trim()) {
      errors.name = 'Name is required'
    }
    
    if (!participant.email?.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(participant.email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    if (!participant.phone?.trim()) {
      errors.phone = 'Phone number is required'
    } else if (!/^\d{10}$/.test(participant.phone.replace(/\D/g, ''))) {
      errors.phone = 'Phone number should be 10 digits'
    }
    
    if (!participant.college?.trim()) {
      errors.college = 'College is required'
    }
    
    if (!participant.department?.trim()) {
      errors.department = 'Department is required'
    }
    
    if (!participant.year?.trim()) {
      errors.year = 'Year is required'
    }
    
    return errors
  }

  const validateAllParticipants = () => {
    const newErrors: {[key: string]: {[key: string]: string}} = {}
    let hasErrors = false
    
    teamData.forEach((team, teamIndex) => {
      team.participants.forEach((participant, participantIndex) => {
        const participantErrors = validateParticipant(participant, teamIndex, participantIndex)
        if (Object.keys(participantErrors).length > 0) {
          const key = `${teamIndex}-${participantIndex}`
          newErrors[key] = participantErrors
          hasErrors = true
        }
      })
    })
    
    setValidationErrors(newErrors)
    return !hasErrors
  }

  const getFieldError = (teamIndex: number, participantIndex: number, field: string) => {
    const key = `${teamIndex}-${participantIndex}`
    return validationErrors[key]?.[field]
  }

  const hasFieldError = (teamIndex: number, participantIndex: number, field: string) => {
    return !!getFieldError(teamIndex, participantIndex, field)
  }

  // Progress tracking functions
  const getParticipantCompletionStatus = (participant: Participant) => {
    const requiredFields = ['name', 'email', 'phone', 'college', 'department', 'year']
    const completedFields = requiredFields.filter(field => participant[field as keyof Participant]?.toString().trim())
    return {
      completed: completedFields.length,
      total: requiredFields.length,
      percentage: Math.round((completedFields.length / requiredFields.length) * 100)
    }
  }

  const getTeamCompletionStatus = (team: TeamData) => {
    if (team.participants.length === 0) return { completed: 1, total: 1, percentage: 100 }
    
    let totalCompleted = 0
    let totalFields = 0
    
    team.participants.forEach(participant => {
      const status = getParticipantCompletionStatus(participant)
      totalCompleted += status.completed
      totalFields += status.total
    })
    
    return {
      completed: totalCompleted,
      total: totalFields,
      percentage: totalFields > 0 ? Math.round((totalCompleted / totalFields) * 100) : 100
    }
  }

  const proceedToPayment = () => {
    // Store final data in store for review page
    useStore.getState().setRegistrationDraft({ 
      events: teamData.map(team => ({
        eventId: team.eventId,
        teamName: team.teamName,
        participants: [team.leaderDetails, ...team.participants]
      }))
    })
    router.push('/checkout/review')
  }

  if (!isAuthenticated) {
    return <div>Redirecting to login...</div>
  }

  if (checkingPendingRegistrations) {
    return (
      <Layout>
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
          <p className="text-gray-300 mt-4">Checking existing registrations...</p>
        </div>
      </Layout>
    )
  }

  if (pendingRegistrations.length > 0) {
    return (
      <Layout>
        <div className="text-center py-20 max-w-2xl mx-auto">
          <div className="bg-orange-900/20 border border-orange-500/30 rounded-xl p-8 mb-8">
            <h1 className="text-3xl font-bold text-orange-400 mb-4 flex items-center justify-center gap-2">
              <AlertTriangle className="w-8 h-8" />
              Pending Payment Required
            </h1>
            <p className="text-gray-300 mb-6">
              You have {pendingRegistrations.length} pending registration{pendingRegistrations.length > 1 ? 's' : ''} that need{pendingRegistrations.length === 1 ? 's' : ''} to be completed before you can make new registrations.
            </p>
            <div className="space-y-3 mb-8">
              {pendingRegistrations.map((reg) => (
                <div key={reg.id} className="bg-gray-800/50 border border-gray-600 rounded-lg p-4 text-left">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white font-semibold">{reg.team_name}</p>
                      <p className="text-gray-400 text-sm">{reg.event_name}</p>
                      <p className="text-yellow-400 text-sm">₹{reg.amount}</p>
                    </div>
                    <span className="px-3 py-1 rounded text-xs font-semibold bg-yellow-700 text-yellow-300">
                      Pending
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push('/profile')}
              className="bg-yellow-600 hover:bg-yellow-700 text-black px-6 py-3 rounded-lg transition-colors font-semibold"
            >
              Complete Pending Payments
            </button>
            <button
              onClick={() => router.push('/')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Browse Events
            </button>
          </div>
        </div>
      </Layout>
    )
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

  // Pre-fill form when team changes
  useEffect(() => {
    if (teamData[currentTeamIndex]) {
      const team = teamData[currentTeamIndex]
      const formData = {
        teamName: team.teamName,
        ...team.leaderDetails
      }
      reset(formData)
    }
  }, [currentTeamIndex]) // Only depend on currentTeamIndex to avoid loops

  return (
    <Layout>
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl font-bold text-yellow-400 mb-4 text-center">Checkout</h1>

            {/* Auto-Save Status Indicator */}
            <div className="flex justify-center mb-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ 
                  opacity: autoSaveStatus !== 'idle' ? 1 : 0.6,
                  scale: autoSaveStatus !== 'idle' ? 1 : 0.95
                }}
                className="flex items-center space-x-2 text-sm"
              >
                {autoSaveStatus === 'saving' && (
                  <>
                    <Clock size={14} className="animate-spin text-blue-400" />
                    <span className="text-blue-400">Saving...</span>
                  </>
                )}
                {autoSaveStatus === 'saved' && (
                  <>
                    <Check size={14} className="text-green-400" />
                    <span className="text-green-400">Auto-saved</span>
                    {lastSaved && (
                      <span className="text-gray-500">
                        at {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </>
                )}
                {autoSaveStatus === 'error' && (
                  <>
                    <AlertTriangle size={14} className="text-red-400" />
                    <span className="text-red-400">Save failed</span>
                  </>
                )}
                {autoSaveStatus === 'idle' && lastSaved && (
                  <span className="text-gray-500">
                    Last saved: {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </motion.div>
            </div>

            {/* Step Indicator */}
            <div className="flex justify-center mb-8">
              <div className="flex items-center space-x-4">
                {[
                  { key: 'profile', label: 'Profile', icon: User },
                  { key: 'team', label: 'Team Details', icon: Users },
                  { key: 'participants', label: 'Participants', icon: Plus },
                  { key: 'review', label: 'Review', icon: CreditCard }
                ].map((step, index) => {
                  const Icon = step.icon
                  const isActive = currentStep === step.key
                  const isCompleted = 
                    (step.key === 'profile' && isProfileComplete) ||
                    (step.key === 'team' && currentStep !== 'profile' && currentStep !== 'team') ||
                    (step.key === 'participants' && currentStep === 'review')
                  
                  return (
                    <div key={step.key} className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isActive ? 'bg-yellow-400 text-black' :
                        isCompleted ? 'bg-green-500 text-white' :
                        'bg-gray-600 text-gray-300'
                      }`}>
                        <Icon size={20} />
                      </div>
                      <span className={`ml-2 ${isActive ? 'text-yellow-400' : 'text-gray-300'}`}>
                        {step.label}
                      </span>
                      {index < 3 && (
                        <div className={`w-8 h-0.5 mx-4 ${
                          isCompleted ? 'bg-green-500' : 'bg-gray-600'
                        }`} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Step Content */}
            {currentStep === 'profile' && (
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
                    <button
                      onClick={() => handleStepNavigation('team')}
                      className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-black px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Continue to Team Details
                    </button>
                  </div>
                ) : (
                  <div className="bg-red-900/30 border border-red-500 rounded-lg p-4">
                    <p className="text-red-400 font-medium">❌ Profile Incomplete</p>
                    <p className="text-sm text-gray-300 mt-2">
                      Please complete your profile before proceeding.
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
            )}

            {currentStep === 'team' && teamData[currentTeamIndex] && (
              <div className="bg-gray-900 rounded-xl p-6 mb-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <Users className="mr-2" />
                  Team Details - {cart.find(item => item.event.id.toString() === teamData[currentTeamIndex].eventId)?.event.name}
                </h2>
                
                <form onSubmit={handleSubmit(handleTeamDetailsSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Team Name</label>
                    <input
                      {...register('teamName', { required: 'Team name is required' })}
                      className="w-full p-4 bg-gray-800 border border-gray-600 rounded-lg text-white text-base min-h-[48px] focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                      placeholder="Enter team name"
                    />
                    {errors.teamName && <p className="text-red-400 text-sm mt-1">{errors.teamName.message as string}</p>}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Leader Name</label>
                      <input
                        {...register('name', { required: 'Name is required' })}
                        className="w-full p-4 bg-gray-800 border border-gray-600 rounded-lg text-white text-base min-h-[48px] focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                        placeholder="Leader name"
                      />
                      {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message as string}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                      <input
                        {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } })}
                        className="w-full p-4 bg-gray-800 border border-gray-600 rounded-lg text-white text-base min-h-[48px] focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                        placeholder="Email address"
                        type="email"
                      />
                      {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email.message as string}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                      <input
                        {...register('phone', { required: 'Phone is required' })}
                        className="w-full p-4 bg-gray-800 border border-gray-600 rounded-lg text-white text-base min-h-[48px] focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                        placeholder="Phone number"
                      />
                      {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone.message as string}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">College</label>
                      <input
                        {...register('college', { required: 'College is required' })}
                        className="w-full p-4 bg-gray-800 border border-gray-600 rounded-lg text-white text-base min-h-[48px] focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                        placeholder="College name"
                      />
                      {errors.college && <p className="text-red-400 text-sm mt-1">{errors.college.message as string}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Department</label>
                      <input
                        {...register('department', { required: 'Department is required' })}
                        className="w-full p-4 bg-gray-800 border border-gray-600 rounded-lg text-white text-base min-h-[48px] focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                        placeholder="Department"
                      />
                      {errors.department && <p className="text-red-400 text-sm mt-1">{errors.department.message as string}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Year</label>
                      <select
                        {...register('year', { required: 'Year is required' })}
                        className="w-full p-4 bg-gray-800 border border-gray-600 rounded-lg text-white text-base min-h-[48px] focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                      >
                        <option value="">Select Year</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                      </select>
                      {errors.year && <p className="text-red-400 text-sm mt-1">{errors.year.message as string}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">State</label>
                      <input
                        {...register('state', { required: 'State is required' })}
                        className="w-full p-4 bg-gray-800 border border-gray-600 rounded-lg text-white text-base min-h-[48px] focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                        placeholder="State"
                      />
                      {errors.state && <p className="text-red-400 text-sm mt-1">{errors.state.message as string}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Location/City</label>
                      <input
                        {...register('location', { required: 'Location is required' })}
                        className="w-full p-4 bg-gray-800 border border-gray-600 rounded-lg text-white text-base min-h-[48px] focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                        placeholder="City/Location"
                      />
                      {errors.location && <p className="text-red-400 text-sm mt-1">{errors.location.message as string}</p>}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6">
                    <button
                      type="button"
                      onClick={() => setCurrentStep('profile')}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-4 rounded-lg transition-colors min-h-[48px] text-base font-medium"
                    >
                      Back to Profile
                    </button>
                    <button
                      type="submit"
                      className="bg-yellow-600 hover:bg-yellow-700 text-black px-6 py-4 rounded-lg font-medium transition-colors min-h-[48px] text-base"
                    >
                      {currentTeamIndex < teamData.length - 1 ? 'Next Event' : 'Continue to Participants'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {currentStep === 'participants' && (
              <div className="bg-gray-900 rounded-xl p-6 mb-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <Plus className="mr-2" />
                  Add Team Participants
                </h2>

                {teamData.map((team, teamIndex) => {
                  const event = cart.find(item => item.event.id.toString() === team.eventId)?.event
                  const isSoloEvent = event?.event_type === 'solo' || (event?.min_team_size === 1 && event?.max_team_size === 1)
                  const currentTeamSize = 1 + team.participants.length // Leader + participants
                  const maxTeamSize = event?.max_team_size || 1
                  const minTeamSize = event?.min_team_size || 1
                  
                  return (
                    <div key={teamIndex} className="mb-8 p-4 border border-gray-600 rounded-lg">
                      <h3 className="text-xl font-bold text-yellow-400 mb-4">{event?.name} - {team.teamName}</h3>
                      
                      <div className="mb-4">
                        <h4 className="text-lg font-medium text-white mb-2">Team Leader</h4>
                        <div className="bg-gray-800 p-3 rounded-lg">
                          <p className="text-gray-300">{team.leaderDetails.name} ({team.leaderDetails.email})</p>
                        </div>
                      </div>

                      {!isSoloEvent && (
                        <div>
                          <div className="flex justify-between items-center mb-4">
                            <div>
                              <h4 className="text-lg font-medium text-white">Team Members</h4>
                              <p className="text-sm text-gray-400">
                                Current: {currentTeamSize}/{maxTeamSize} members
                                {minTeamSize > 1 && currentTeamSize < minTeamSize && (
                                  <span className="text-red-400 ml-2">
                                    (Minimum {minTeamSize} required)
                                  </span>
                                )}
                              </p>
                              
                              {/* Team Completion Progress */}
                              {team.participants.length > 0 && (() => {
                                const teamStatus = getTeamCompletionStatus(team)
                                return (
                                  <div className="mt-2 flex items-center gap-2">
                                    <div className="flex-1 bg-gray-700 rounded-full h-2">
                                      <div 
                                        className={`h-2 rounded-full transition-all duration-500 ${
                                          teamStatus.percentage === 100 
                                            ? 'bg-green-500' 
                                            : teamStatus.percentage >= 70 
                                              ? 'bg-yellow-500' 
                                              : 'bg-red-500'
                                        }`}
                                        style={{ width: `${teamStatus.percentage}%` }}
                                      ></div>
                                    </div>
                                    <span className={`text-xs font-medium ${
                                      teamStatus.percentage === 100 
                                        ? 'text-green-400' 
                                        : teamStatus.percentage >= 70 
                                          ? 'text-yellow-400' 
                                          : 'text-red-400'
                                    }`}>
                                      {teamStatus.percentage}% complete
                                    </span>
                                  </div>
                                )
                              })()}
                            </div>
                            {currentTeamSize < maxTeamSize && (
                              <button
                                type="button"
                                onClick={() => addParticipant(teamIndex)}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg text-base flex items-center min-h-[48px] font-medium transition-colors"
                              >
                                <Plus size={18} className="mr-2" />
                                Add Member
                              </button>
                            )}
                          </div>

                          {team.participants.map((participant, participantIndex) => (
                            <div key={participantIndex} className="bg-gray-800 p-6 rounded-lg mb-4 border border-gray-600">
                              {/* Participant Header with Quick Fill */}
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h5 className="text-white font-medium text-lg">Participant {participantIndex + 1}</h5>
                                    <div className="flex gap-2 flex-wrap">
                                      <button
                                        type="button"
                                        onClick={() => copyCommonFields(teamIndex, participantIndex)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-1"
                                        title="Copy college, department, year, state, and location from team leader"
                                      >
                                        📋 Copy from Leader
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {/* Progress Indicator */}
                                  {(() => {
                                    const status = getParticipantCompletionStatus(participant)
                                    return (
                                      <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-gray-700 rounded-full h-2">
                                          <div 
                                            className={`h-2 rounded-full transition-all duration-500 ${
                                              status.percentage === 100 
                                                ? 'bg-green-500' 
                                                : status.percentage >= 50 
                                                  ? 'bg-yellow-500' 
                                                  : 'bg-red-500'
                                            }`}
                                            style={{ width: `${status.percentage}%` }}
                                          ></div>
                                        </div>
                                        <span className={`text-xs font-medium ${
                                          status.percentage === 100 
                                            ? 'text-green-400' 
                                            : status.percentage >= 50 
                                              ? 'text-yellow-400' 
                                              : 'text-red-400'
                                        }`}>
                                          {status.completed}/{status.total} fields
                                        </span>
                                      </div>
                                    )
                                  })()}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeParticipant(teamIndex, participantIndex)}
                                  className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-lg min-h-[48px] min-w-[48px] flex items-center justify-center transition-colors shrink-0"
                                  aria-label="Remove participant"
                                >
                                  <X size={18} />
                                </button>
                              </div>
                              
                              {/* Form Fields */}
                              <div className="space-y-4">
                                {/* Essential Fields Row */}
                                <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                                    <input
                                      value={participant.name}
                                      onChange={(e) => updateParticipant(teamIndex, participantIndex, 'name', e.target.value)}
                                      className={`w-full p-4 bg-gray-700 border rounded text-white text-base min-h-[48px] focus:ring-2 focus:border-transparent transition-all ${
                                        hasFieldError(teamIndex, participantIndex, 'name')
                                          ? 'border-red-500 focus:ring-red-400'
                                          : 'border-gray-600 focus:ring-yellow-400'
                                      }`}
                                      placeholder="Full Name"
                                      required
                                    />
                                    {hasFieldError(teamIndex, participantIndex, 'name') && (
                                      <p className="mt-1 text-sm text-red-400">
                                        {getFieldError(teamIndex, participantIndex, 'name')}
                                      </p>
                                    )}
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                                    <input
                                      value={participant.email}
                                      onChange={(e) => updateParticipant(teamIndex, participantIndex, 'email', e.target.value)}
                                      className={`w-full p-4 bg-gray-700 border rounded text-white text-base min-h-[48px] focus:ring-2 focus:border-transparent transition-all ${
                                        hasFieldError(teamIndex, participantIndex, 'email')
                                          ? 'border-red-500 focus:ring-red-400'
                                          : 'border-gray-600 focus:ring-yellow-400'
                                      }`}
                                      placeholder="email@example.com"
                                      type="email"
                                      required
                                    />
                                    {hasFieldError(teamIndex, participantIndex, 'email') && (
                                      <p className="mt-1 text-sm text-red-400">
                                        {getFieldError(teamIndex, participantIndex, 'email')}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Contact Info */}
                                <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-1">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Phone *</label>
                                    <input
                                      value={participant.phone}
                                      onChange={(e) => updateParticipant(teamIndex, participantIndex, 'phone', e.target.value)}
                                      className={`w-full p-4 bg-gray-700 border rounded text-white text-base min-h-[48px] focus:ring-2 focus:border-transparent transition-all ${
                                        hasFieldError(teamIndex, participantIndex, 'phone')
                                          ? 'border-red-500 focus:ring-red-400'
                                          : 'border-gray-600 focus:ring-yellow-400'
                                      }`}
                                      placeholder="Phone Number"
                                      required
                                    />
                                    {hasFieldError(teamIndex, participantIndex, 'phone') && (
                                      <p className="mt-1 text-sm text-red-400">
                                        {getFieldError(teamIndex, participantIndex, 'phone')}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Academic Info with Quick Fill */}
                                {/* Academic Info with Quick Fill */}
                                <div className="bg-gray-700/50 p-4 rounded-lg">
                                  <h6 className="text-sm font-medium text-gray-300 mb-3">Academic Information</h6>
                                  <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2">
                                    <div>
                                      <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-medium text-gray-300">College *</label>
                                        {team.leaderDetails.college && (
                                          <button
                                            type="button"
                                            onClick={() => applyToAllParticipants(teamIndex, 'college', team.leaderDetails.college)}
                                            className="text-xs text-blue-400 hover:text-blue-300 underline"
                                          >
                                            Apply to all
                                          </button>
                                        )}
                                      </div>
                                      <input
                                        value={participant.college}
                                        onChange={(e) => updateParticipant(teamIndex, participantIndex, 'college', e.target.value)}
                                        className={`w-full p-4 bg-gray-700 border rounded text-white text-base min-h-[48px] focus:ring-2 focus:border-transparent transition-all ${
                                          hasFieldError(teamIndex, participantIndex, 'college')
                                            ? 'border-red-500 focus:ring-red-400'
                                            : 'border-gray-600 focus:ring-yellow-400'
                                        }`}
                                        placeholder="College Name"
                                        required
                                      />
                                      {hasFieldError(teamIndex, participantIndex, 'college') && (
                                        <p className="mt-1 text-sm text-red-400">
                                          {getFieldError(teamIndex, participantIndex, 'college')}
                                        </p>
                                      )}
                                    </div>
                                    <div>
                                      <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-medium text-gray-300">Department *</label>
                                        {team.leaderDetails.department && (
                                          <button
                                            type="button"
                                            onClick={() => applyToAllParticipants(teamIndex, 'department', team.leaderDetails.department)}
                                            className="text-xs text-blue-400 hover:text-blue-300 underline"
                                          >
                                            Apply to all
                                          </button>
                                        )}
                                      </div>
                                      <input
                                        value={participant.department}
                                        onChange={(e) => updateParticipant(teamIndex, participantIndex, 'department', e.target.value)}
                                        className={`w-full p-4 bg-gray-700 border rounded text-white text-base min-h-[48px] focus:ring-2 focus:border-transparent transition-all ${
                                          hasFieldError(teamIndex, participantIndex, 'department')
                                            ? 'border-red-500 focus:ring-red-400'
                                            : 'border-gray-600 focus:ring-yellow-400'
                                        }`}
                                        placeholder="Department"
                                        required
                                      />
                                      {hasFieldError(teamIndex, participantIndex, 'department') && (
                                        <p className="mt-1 text-sm text-red-400">
                                          {getFieldError(teamIndex, participantIndex, 'department')}
                                        </p>
                                      )}
                                    </div>
                                    <div>
                                      <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-medium text-gray-300">Year *</label>
                                        {team.leaderDetails.year && (
                                          <button
                                            type="button"
                                            onClick={() => applyToAllParticipants(teamIndex, 'year', team.leaderDetails.year)}
                                            className="text-xs text-blue-400 hover:text-blue-300 underline"
                                          >
                                            Apply to all
                                          </button>
                                        )}
                                      </div>
                                      <select
                                        value={participant.year}
                                        onChange={(e) => updateParticipant(teamIndex, participantIndex, 'year', e.target.value)}
                                        className={`w-full p-4 bg-gray-700 border rounded text-white text-base min-h-[48px] focus:ring-2 focus:border-transparent transition-all ${
                                          hasFieldError(teamIndex, participantIndex, 'year')
                                            ? 'border-red-500 focus:ring-red-400'
                                            : 'border-gray-600 focus:ring-yellow-400'
                                        }`}
                                        required
                                      >
                                        <option value="">Select Year</option>
                                        <option value="1">1st Year</option>
                                        <option value="2">2nd Year</option>
                                        <option value="3">3rd Year</option>
                                        <option value="4">4th Year</option>
                                      </select>
                                      {hasFieldError(teamIndex, participantIndex, 'year') && (
                                        <p className="mt-1 text-sm text-red-400">
                                          {getFieldError(teamIndex, participantIndex, 'year')}
                                        </p>
                                      )}
                                    </div>
                                    <div>
                                      <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-medium text-gray-300">State</label>
                                        {team.leaderDetails.state && (
                                          <button
                                            type="button"
                                            onClick={() => applyToAllParticipants(teamIndex, 'state', team.leaderDetails.state)}
                                            className="text-xs text-blue-400 hover:text-blue-300 underline"
                                          >
                                            Apply to all
                                          </button>
                                        )}
                                      </div>
                                      <input
                                        value={participant.state || ''}
                                        onChange={(e) => updateParticipant(teamIndex, participantIndex, 'state', e.target.value)}
                                        className="w-full p-4 bg-gray-700 border border-gray-600 rounded text-white text-base min-h-[48px] focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                                        placeholder="State"
                                      />
                                    </div>
                                  </div>
                                  <div className="mt-3">
                                    <div className="flex justify-between items-center mb-2">
                                      <label className="text-sm font-medium text-gray-300">City/Location</label>
                                      {team.leaderDetails.location && (
                                        <button
                                          type="button"
                                          onClick={() => applyToAllParticipants(teamIndex, 'location', team.leaderDetails.location)}
                                          className="text-xs text-blue-400 hover:text-blue-300 underline"
                                        >
                                          Apply to all
                                        </button>
                                      )}
                                    </div>
                                    <input
                                      value={participant.location || ''}
                                      onChange={(e) => updateParticipant(teamIndex, participantIndex, 'location', e.target.value)}
                                      className="w-full p-4 bg-gray-700 border border-gray-600 rounded text-white text-base min-h-[48px] focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                                      placeholder="City/Location"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {isSoloEvent && (
                        <div className="bg-blue-900/30 border border-blue-500 p-4 rounded-lg">
                          <p className="text-blue-300 text-center">
                            <Users className="inline w-5 h-5 mr-2" />
                            This is a solo event. Only the team leader will participate.
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}

                <div className="flex justify-between pt-6">
                  <button
                    onClick={() => setCurrentStep('team')}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    Back to Team Details
                  </button>
                  <button
                    onClick={() => {
                      // Validate all participants first
                      if (!validateAllParticipants()) {
                        toast.error('Please fix the highlighted errors before proceeding', {
                          duration: 4000,
                          icon: '⚠️'
                        })
                        return
                      }
                      
                      // Validate team sizes before proceeding
                      const isValid = teamData.every(team => {
                        const event = cart.find(item => item.event.id.toString() === team.eventId)?.event
                        const isSoloEvent = event?.event_type === 'solo' || (event?.min_team_size === 1 && event?.max_team_size === 1)
                        const currentTeamSize = 1 + team.participants.length
                        const minTeamSize = event?.min_team_size || 1
                        
                        return isSoloEvent || currentTeamSize >= minTeamSize
                      })
                      
                      if (!isValid) {
                        toast.error('Please ensure all teams meet the minimum size requirements')
                        return
                      }
                      
                      setCurrentStep('review')
                    }}
                    className="bg-yellow-600 hover:bg-yellow-700 text-black px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Review & Pay
                  </button>
                </div>
              </div>
            )}

            {currentStep === 'review' && (
              <div className="bg-gray-900 rounded-xl p-6 mb-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <CreditCard className="mr-2" />
                  Review Your Registration
                </h2>

                {teamData.map((team, index) => {
                  const event = cart.find(item => item.event.id.toString() === team.eventId)?.event
                  return (
                    <div key={index} className="mb-6 p-4 border border-gray-600 rounded-lg">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-yellow-400">{event?.name}</h3>
                        <span className="text-2xl font-bold text-yellow-400">₹{event?.price}</span>
                      </div>
                      
                      <p className="text-gray-300 mb-2"><strong>Team Name:</strong> {team.teamName}</p>
                      <p className="text-gray-300 mb-4"><strong>Total Members:</strong> {1 + team.participants.length}</p>
                      
                      <div className="space-y-2">
                        <div className="bg-gray-800 p-3 rounded">
                          <p className="text-green-400 font-medium">👑 {team.leaderDetails.name} (Leader)</p>
                          <p className="text-gray-300 text-sm">{team.leaderDetails.email} | {team.leaderDetails.college}</p>
                          <p className="text-gray-300 text-sm">{team.leaderDetails.state}, {team.leaderDetails.location}</p>
                        </div>
                        
                        {team.participants.map((participant, pIndex) => (
                          <div key={pIndex} className="bg-gray-800 p-3 rounded">
                            <p className="text-white">{participant.name}</p>
                            <p className="text-gray-300 text-sm">{participant.email} | {participant.college}</p>
                            <p className="text-gray-300 text-sm">{participant.state}, {participant.location}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}

                <div className="border-t border-gray-600 pt-6">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-2xl font-bold text-white">Total Amount:</span>
                    <span className="text-3xl font-bold text-yellow-400">₹{totalAmount}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <button
                      onClick={() => setCurrentStep('participants')}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-4 rounded-lg transition-colors min-h-[48px] text-base font-medium"
                    >
                      Back to Participants
                    </button>
                    <button
                      onClick={proceedToPayment}
                      disabled={loading}
                      className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold py-4 px-8 rounded-xl text-lg transition-all duration-300 flex items-center justify-center min-h-[48px]"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                      ) : (
                        <CreditCard className="mr-2" />
                      )}
                      Proceed to Payment
                      <ArrowRight className="ml-2" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  )
}
