"use client";
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout'
import { motion } from 'framer-motion'
import { User, Mail, Building, BookOpen, Calendar, Phone, IndianRupee, CreditCard, ArrowRight, Users, Plus, X } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

type CheckoutStep = 'profile' | 'team' | 'participants' | 'review'

interface Participant {
  name: string
  email: string
  phone: string
  college: string
  department: string
  year: string
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
  
  // Form for current team being edited
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0)
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm()

  // Load data from session storage on mount
  useEffect(() => {
    const savedData = sessionStorage.getItem('checkoutTeamData')
    if (savedData) {
      try {
        setTeamData(JSON.parse(savedData))
      } catch (error) {
        console.error('Error loading saved checkout data:', error)
      }
    }
  }, [])

  // Save to session storage whenever teamData changes
  useEffect(() => {
    if (teamData.length > 0) {
      sessionStorage.setItem('checkoutTeamData', JSON.stringify(teamData))
    }
  }, [teamData])

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

  // Refresh user data when component mounts
  useEffect(() => {
    const refreshUserData = async () => {
      if (isAuthenticated && user?.id) {
        try {
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (userData && !error) {
            useStore.getState().setUser(userData);
          }
        } catch (error) {
          console.error('Error refreshing user data:', error);
        }
      }
    };
    
    refreshUserData();
  }, [isAuthenticated, user?.id]);

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
          isLeader: true
        },
        participants: []
      }))
      setTeamData(initialTeamData)
    }
  }, [isProfileComplete, cart, user, teamData.length])

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
      year: ''
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
      reset({
        teamName: team.teamName,
        ...team.leaderDetails
      })
    }
  }, [currentTeamIndex, teamData, reset])

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
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                      placeholder="Enter team name"
                    />
                    {errors.teamName && <p className="text-red-400 text-sm mt-1">{errors.teamName.message as string}</p>}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Leader Name</label>
                      <input
                        {...register('name', { required: 'Name is required' })}
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                        placeholder="Leader name"
                      />
                      {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message as string}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                      <input
                        {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } })}
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                        placeholder="Email address"
                        type="email"
                      />
                      {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email.message as string}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                      <input
                        {...register('phone', { required: 'Phone is required' })}
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                        placeholder="Phone number"
                      />
                      {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone.message as string}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">College</label>
                      <input
                        {...register('college', { required: 'College is required' })}
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                        placeholder="College name"
                      />
                      {errors.college && <p className="text-red-400 text-sm mt-1">{errors.college.message as string}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Department</label>
                      <input
                        {...register('department', { required: 'Department is required' })}
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                        placeholder="Department"
                      />
                      {errors.department && <p className="text-red-400 text-sm mt-1">{errors.department.message as string}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Year</label>
                      <select
                        {...register('year', { required: 'Year is required' })}
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                      >
                        <option value="">Select Year</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                      </select>
                      {errors.year && <p className="text-red-400 text-sm mt-1">{errors.year.message as string}</p>}
                    </div>
                  </div>

                  <div className="flex justify-between pt-6">
                    <button
                      type="button"
                      onClick={() => setCurrentStep('profile')}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
                    >
                      Back to Profile
                    </button>
                    <button
                      type="submit"
                      className="bg-yellow-600 hover:bg-yellow-700 text-black px-6 py-3 rounded-lg font-medium transition-colors"
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
                  return (
                    <div key={teamIndex} className="mb-8 p-4 border border-gray-600 rounded-lg">
                      <h3 className="text-xl font-bold text-yellow-400 mb-4">{event?.name} - {team.teamName}</h3>
                      
                      <div className="mb-4">
                        <h4 className="text-lg font-medium text-white mb-2">Team Leader</h4>
                        <div className="bg-gray-800 p-3 rounded-lg">
                          <p className="text-gray-300">{team.leaderDetails.name} ({team.leaderDetails.email})</p>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-lg font-medium text-white">Team Members</h4>
                          <button
                            type="button"
                            onClick={() => addParticipant(teamIndex)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm flex items-center"
                          >
                            <Plus size={16} className="mr-1" />
                            Add Member
                          </button>
                        </div>

                        {team.participants.map((participant, participantIndex) => (
                          <div key={participantIndex} className="bg-gray-800 p-4 rounded-lg mb-4">
                            <div className="flex justify-between items-center mb-3">
                              <h5 className="text-white font-medium">Participant {participantIndex + 1}</h5>
                              <button
                                type="button"
                                onClick={() => removeParticipant(teamIndex, participantIndex)}
                                className="bg-red-600 hover:bg-red-700 text-white p-1 rounded"
                              >
                                <X size={16} />
                              </button>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-3">
                              <input
                                value={participant.name}
                                onChange={(e) => updateParticipant(teamIndex, participantIndex, 'name', e.target.value)}
                                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                                placeholder="Name"
                              />
                              <input
                                value={participant.email}
                                onChange={(e) => updateParticipant(teamIndex, participantIndex, 'email', e.target.value)}
                                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                                placeholder="Email"
                                type="email"
                              />
                              <input
                                value={participant.phone}
                                onChange={(e) => updateParticipant(teamIndex, participantIndex, 'phone', e.target.value)}
                                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                                placeholder="Phone"
                              />
                              <input
                                value={participant.college}
                                onChange={(e) => updateParticipant(teamIndex, participantIndex, 'college', e.target.value)}
                                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                                placeholder="College"
                              />
                              <input
                                value={participant.department}
                                onChange={(e) => updateParticipant(teamIndex, participantIndex, 'department', e.target.value)}
                                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                                placeholder="Department"
                              />
                              <select
                                value={participant.year}
                                onChange={(e) => updateParticipant(teamIndex, participantIndex, 'year', e.target.value)}
                                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                              >
                                <option value="">Select Year</option>
                                <option value="1">1st Year</option>
                                <option value="2">2nd Year</option>
                                <option value="3">3rd Year</option>
                                <option value="4">4th Year</option>
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
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
                    onClick={() => setCurrentStep('review')}
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
                        </div>
                        
                        {team.participants.map((participant, pIndex) => (
                          <div key={pIndex} className="bg-gray-800 p-3 rounded">
                            <p className="text-white">{participant.name}</p>
                            <p className="text-gray-300 text-sm">{participant.email} | {participant.college}</p>
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

                  <div className="flex justify-between">
                    <button
                      onClick={() => setCurrentStep('participants')}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
                    >
                      Back to Participants
                    </button>
                    <button
                      onClick={proceedToPayment}
                      disabled={loading}
                      className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold py-4 px-8 rounded-xl text-lg transition-all duration-300 flex items-center"
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
