"use client";
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout'
import ProfileGuard from '@/components/ProfileGuard'
import { motion } from 'framer-motion'
import { User, Mail, Building, BookOpen, Calendar, Phone, IndianRupee, CreditCard } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const participantSchema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Phone required'),
  college: z.string().min(1, 'College required'),
  department: z.string().min(1, 'Department required'),
  year: z.string().min(1, 'Year required'),
  sameAsLeader: z.boolean().optional(),
});

const eventSchema = z.object({
  eventId: z.string(),
  teamName: z.string().min(1, 'Team Name required'),
  participants: z.array(participantSchema)
}).refine((data) => {
  // Unique name/email/phone within team
  const names = new Set();
  const emails = new Set();
  const phones = new Set();
  for (const p of data.participants) {
    if (names.has(p.name) || emails.has(p.email) || phones.has(p.phone)) return false;
    names.add(p.name); emails.add(p.email); phones.add(p.phone);
  }
  return true;
}, {
  message: 'Names, emails, and phone numbers must be unique within the team',
  path: ['participants']
});

const formSchema = z.object({
  events: z.array(eventSchema)
});

// Function to check if participant already registered in any event
const checkParticipantRegistration = async (email: string, phone: string, excludeEventId?: string) => {
  try {
    // Check registrations table for existing participants
    const { data: registrationData, error: regError } = await supabase
      .from('registrations')
      .select(`
        id, 
        event_id, 
        email, 
        phone,
        leader_id,
        registrants!inner(payment_status),
        events(name)
      `)
      .or(`email.eq.${email},phone.eq.${phone}`)
      .in('registrants.payment_status', ['pending', 'paid']);

    if (regError) {
      console.error('Error checking registration:', regError);
      return null;
    }

    // Filter out current event if provided
    const filteredData = registrationData?.filter(reg => 
      excludeEventId ? reg.event_id !== parseInt(excludeEventId) : true
    ) || [];

    return filteredData.length > 0 ? filteredData[0] : null;
  } catch (error) {
    console.error('Error in checkParticipantRegistration:', error);
    return null;
  }
};

export default function CheckoutPage() {
  const { cart, user, getCartTotal, clearCart, setRegistrationDraft, formDraft, saveFormDraft } = useStore()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [participantValidation, setParticipantValidation] = useState<{[key: string]: boolean}>({})
  const total = getCartTotal()

  // Build initial form values from draft or defaults
  const getInitialValues = () => {
    // Check if we have a recent draft (within 24 hours) and it matches current cart
    if (formDraft && formDraft.timestamp && (Date.now() - formDraft.timestamp) < 24 * 60 * 60 * 1000) {
      console.log('Restoring form draft:', formDraft);
      // Ensure draft matches current cart structure
      if (formDraft.events && formDraft.events.length === cart.length) {
        return {
          events: formDraft.events.map((draftEvent, index) => {
            const cartItem = cart[index];
            // Ensure participant count matches cart
            const adjustedParticipants = Array.from({ length: cartItem.teamSize }, (_, idx) => {
              if (draftEvent.participants[idx]) {
                return draftEvent.participants[idx];
              }
              // Fill missing participants with default data
              return {
                name: idx === 0 ? user?.name || '' : '',
                email: idx === 0 ? user?.email || '' : '',
                phone: idx === 0 ? user?.phone || '' : '',
                college: idx === 0 ? user?.college || '' : '',
                department: idx === 0 ? user?.department || '' : '',
                year: idx === 0 ? user?.year || '' : '',
                sameAsLeader: false,
              };
            });
            
            return {
              ...draftEvent,
              eventId: String(cartItem.event.id),
              participants: adjustedParticipants
            };
          })
        };
      }
    }
    
    console.log('Creating fresh form values');
    return {
      events: cart.map(item => ({
        eventId: String(item.event.id),
        teamName: '',
        participants: Array.from({ length: item.teamSize }, (_, idx) => ({
          name: idx === 0 ? user?.name || '' : '',
          email: idx === 0 ? user?.email || '' : '',
          phone: idx === 0 ? user?.phone || '' : '',
          college: idx === 0 ? user?.college || '' : '',
          department: idx === 0 ? user?.department || '' : '',
          year: idx === 0 ? user?.year || '' : '',
          sameAsLeader: false,
        }))
      }))
    }
  }

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: getInitialValues(),
    mode: 'onBlur',
  })

  // Update form when draft data is available
  useEffect(() => {
    const initialValues = getInitialValues();
    form.reset(initialValues);
  }, [formDraft, cart, user]);

  // Auto-save form data on changes with better persistence
  useEffect(() => {
    const subscription = form.watch((data) => {
      if (data && data.events && data.events.length > 0) {
        // Save to both Zustand store and localStorage for better persistence
        const draftData = {
          ...data as any,
          total,
          userId: user?.id,
          timestamp: Date.now()
        };
        
        console.log('Auto-saving form draft:', draftData);
        saveFormDraft(draftData);
        
        // Also save to localStorage as backup
        try {
          localStorage.setItem('checkout-form-draft', JSON.stringify(draftData));
        } catch (error) {
          console.error('Failed to save to localStorage:', error);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, saveFormDraft, total, user?.id]);

  // Load from localStorage on component mount as fallback
  useEffect(() => {
    try {
      const localDraft = localStorage.getItem('checkout-form-draft');
      if (localDraft && !formDraft) {
        const parsedDraft = JSON.parse(localDraft);
        // Check if it's recent (within 24 hours)
        if (parsedDraft.timestamp && (Date.now() - parsedDraft.timestamp) < 24 * 60 * 60 * 1000) {
          console.log('Loading from localStorage backup:', parsedDraft);
          saveFormDraft(parsedDraft);
        }
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
  }, [formDraft, saveFormDraft]);

  // Real-time participant validation with debouncing
  const [validationDebounce, setValidationDebounce] = useState<{[key: string]: NodeJS.Timeout}>({});

  const validateParticipantRealTime = async (email: string, phone: string, participantKey: string, eventId: string) => {
    if (!email || !phone) return;
    
    // Clear existing timeout
    if (validationDebounce[participantKey]) {
      clearTimeout(validationDebounce[participantKey]);
    }

    // Set new timeout for debounced validation
    const timeoutId = setTimeout(async () => {
      try {
        const existingRegistration = await checkParticipantRegistration(email, phone, eventId);
        
        setParticipantValidation(prev => ({
          ...prev,
          [participantKey]: !existingRegistration
        }));

        if (existingRegistration) {
          toast.error(`This participant is already registered in another event`, {
            id: participantKey, // Prevent duplicate toasts
            duration: 3000
          });
        }
      } catch (error) {
        console.error('Error validating participant:', error);
      }
    }, 1000); // 1 second debounce

    setValidationDebounce(prev => ({
      ...prev,
      [participantKey]: timeoutId
    }));
  };

  const handleCheckout = form.handleSubmit(async (data) => {
    setLoading(true)
    try {
      // First validate form structure
      const valid = await form.trigger();
      if (!valid) {
        console.error('Form validation failed:', form.formState.errors);
        toast.error('Please fix validation errors before continuing');
        setLoading(false);
        return;
      }

      // Check if current user is already registered for any specific events in cart
      console.log('Checking user registration status for events in cart...');
      for (const event of data.events) {
        const eventRegistrationStatus = await useStore.getState().checkEventRegistrationStatus(parseInt(event.eventId));
        if (eventRegistrationStatus.isRegistered) {
          toast.error(`You are already registered for this event. Cannot register for the same event twice.`);
          setLoading(false);
          return;
        }
      }

      // Check if user has any other registrations
      const userRegistrationStatus = await useStore.getState().checkUserRegistrationStatus();
      if (userRegistrationStatus.hasRegistration) {
        toast.error(`You are already registered for "${userRegistrationStatus.eventName}". Each participant can only register for one event total.`);
        setLoading(false);
        return;
      }

      // Comprehensive participant uniqueness validation
      console.log('Validating participant uniqueness across all events...');
      
      for (let eventIndex = 0; eventIndex < data.events.length; eventIndex++) {
        const event = data.events[eventIndex];
        for (let participantIndex = 0; participantIndex < event.participants.length; participantIndex++) {
          const participant = event.participants[participantIndex];
          
          if (!participant.email || !participant.phone) {
            toast.error(`Please fill in all participant details for ${event.teamName || `Event ${eventIndex + 1}`}`);
            setLoading(false);
            return;
          }

          // Check if this participant is already registered in ANY other event
          const existingRegistration = await checkParticipantRegistration(
            participant.email, 
            participant.phone, 
            event.eventId
          );

          if (existingRegistration) {
            toast.error(
              `${participant.name || 'Participant'} (${participant.email}) is already registered in another event. Each participant can only register for one event total.`
            );
            setLoading(false);
            return;
          }
        }
      }

      // Check for duplicates within current registration
      const allEmails = new Set();
      const allPhones = new Set();
      
      for (const event of data.events) {
        for (const participant of event.participants) {
          if (allEmails.has(participant.email)) {
            toast.error(`Email ${participant.email} is used multiple times. Each participant must have a unique email.`);
            setLoading(false);
            return;
          }
          if (allPhones.has(participant.phone)) {
            toast.error(`Phone ${participant.phone} is used multiple times. Each participant must have a unique phone number.`);
            setLoading(false);
            return;
          }
          allEmails.add(participant.email);
          allPhones.add(participant.phone);
        }
      }

      console.log('All validation passed, proceeding with checkout...');
      console.log('Checkout data:', data);
      
      // Pass registration data to global state
      const formData = form.getValues();
      console.log('Setting registration draft:', formData);
      
      setRegistrationDraft({
        ...formData,
        userId: user?.id,
        total: total,
      });
      
      console.log('Navigating to review page...');
      router.push('/checkout/review');
    } catch (error: any) {
      console.error('Checkout error:', error);
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
            onClick={() => router.push('/technical')}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Browse Events
          </button>
        </div>
      </Layout>
    )
  }

  // Helper to handle 'Same as Leader' logic for college/department/year
  const handleSameAsLeaderToggle = (eventIdx: number, participantIdx: number, checked: boolean) => {
    if (!checked) return; // Only auto-fill on toggle ON
    const leader = form.getValues(`events.${eventIdx}.participants.0`);
    form.setValue(`events.${eventIdx}.participants.${participantIdx}.college`, leader.college);
    form.setValue(`events.${eventIdx}.participants.${participantIdx}.department`, leader.department);
    form.setValue(`events.${eventIdx}.participants.${participantIdx}.year`, leader.year);
  };

  return (
    <ProfileGuard requiresCompleteProfile={true}>
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

        <form onSubmit={handleCheckout} className="grid lg:grid-cols-3 gap-8">
          {/* Participant Details */}
          <div className="lg:col-span-2 space-y-6">
            {(cart || []).map((item, index) => {
              const eventField = form.getValues(`events.${index}`)
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
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Team Name *</label>
                    <input
                      type="text"
                      {...form.register(`events.${index}.teamName`)}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-red-500 focus:outline-none text-sm"
                      required
                    />
                    <span className="text-red-400 text-xs">{form.formState.errors?.events?.[index]?.teamName?.message}</span>
                  </div>
                  <div className="space-y-6">
                    {(eventField.participants || []).map((participant, participantIndex) => (
                      <div key={participantIndex} className="border-b border-gray-700 pb-4 last:border-b-0 last:pb-0">
                        <h4 className="text-lg font-semibold text-white mb-4">
                          Participant {participantIndex + 1}
                          {participantIndex === 0 && ' (Team Leader)'}
                        </h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          {/* Name */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Full Name *</label>
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

                          {/* Email */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                              <input
                                type="email"
                                {...form.register(`events.${index}.participants.${participantIndex}.email`)}
                                onBlur={(e) => {
                                  const participantKey = `${item.event.id}-${participantIndex}-${e.target.value}`;
                                  const currentParticipant = form.getValues(`events.${index}.participants.${participantIndex}`);
                                  validateParticipantRealTime(e.target.value, currentParticipant.phone, participantKey, String(item.event.id));
                                }}
                                className={`w-full bg-gray-800 border rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none text-sm ${
                                  participantValidation[`${item.event.id}-${participantIndex}-${participant.email}`] === false 
                                    ? 'border-red-500 focus:border-red-500' 
                                    : 'border-gray-600 focus:border-red-500'
                                }`}
                              />
                              <span className="text-red-400 text-xs">{form.formState.errors?.events?.[index]?.participants?.[participantIndex]?.email?.message}</span>
                              {participantValidation[`${item.event.id}-${participantIndex}-${participant.email}`] === false && (
                                <span className="text-red-400 text-xs">This participant is already registered in another event</span>
                              )}
                            </div>
                          </div>

                          {/* Phone */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Phone *</label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                              <input
                                type="tel"
                                {...form.register(`events.${index}.participants.${participantIndex}.phone`)}
                                onBlur={(e) => {
                                  const participantKey = `${item.event.id}-${participantIndex}-${participant.email}`;
                                  const currentParticipant = form.getValues(`events.${index}.participants.${participantIndex}`);
                                  validateParticipantRealTime(currentParticipant.email, e.target.value, participantKey, String(item.event.id));
                                }}
                                className={`w-full bg-gray-800 border rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none text-sm ${
                                  participantValidation[`${item.event.id}-${participantIndex}-${participant.email}`] === false 
                                    ? 'border-red-500 focus:border-red-500' 
                                    : 'border-gray-600 focus:border-red-500'
                                }`}
                              />
                              <span className="text-red-400 text-xs">{form.formState.errors?.events?.[index]?.participants?.[participantIndex]?.phone?.message}</span>
                            </div>
                          </div>

                          {/* College, Department, Year with Same as Leader toggle */}
                          {participantIndex !== 0 && (
                            <div className="md:col-span-2 flex items-center space-x-2 mt-2">
                              <input
                                type="checkbox"
                                checked={participant.sameAsLeader}
                                onChange={e => {
                                  form.setValue(`events.${index}.participants.${participantIndex}.sameAsLeader`, e.target.checked);
                                  handleSameAsLeaderToggle(index, participantIndex, e.target.checked);
                                }}
                                className="form-checkbox h-4 w-4 text-yellow-400 bg-gray-700 border-gray-600 rounded focus:ring-yellow-400"
                              />
                              <span className="text-sm text-gray-300">Same as Leader (College, Department, Year)</span>
                            </div>
                          )}

                          {/* College */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">College *</label>
                            <input
                              type="text"
                              {...form.register(`events.${index}.participants.${participantIndex}.college`)}
                              className={`w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-yellow-400 focus:outline-none text-sm ${participantIndex !== 0 && participant.sameAsLeader ? 'bg-gray-700' : ''}`}
                              disabled={participantIndex !== 0 && participant.sameAsLeader}
                              required
                            />
                            <span className="text-red-400 text-xs">{form.formState.errors?.events?.[index]?.participants?.[participantIndex]?.college?.message}</span>
                          </div>
                          {/* Department */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Department *</label>
                            <input
                              type="text"
                              {...form.register(`events.${index}.participants.${participantIndex}.department`)}
                              className={`w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-yellow-400 focus:outline-none text-sm ${participantIndex !== 0 && participant.sameAsLeader ? 'bg-gray-700' : ''}`}
                              disabled={participantIndex !== 0 && participant.sameAsLeader}
                              required
                            />
                            <span className="text-red-400 text-xs">{form.formState.errors?.events?.[index]?.participants?.[participantIndex]?.department?.message}</span>
                          </div>
                          {/* Year */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Year *</label>
                            <select
                              {...form.register(`events.${index}.participants.${participantIndex}.year`)}
                              className={`w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-yellow-400 focus:outline-none text-sm ${participantIndex !== 0 && participant.sameAsLeader ? 'bg-gray-700' : ''}`}
                              disabled={participantIndex !== 0 && participant.sameAsLeader}
                              required
                            >
                              <option value="">Select Year</option>
                              <option value="1st Year">1st Year</option>
                              <option value="2nd Year">2nd Year</option>
                              <option value="3rd Year">3rd Year</option>
                              <option value="4th Year">4th Year</option>
                              <option value="Graduate">Graduate</option>
                            </select>
                            <span className="text-red-400 text-xs">{form.formState.errors?.events?.[index]?.participants?.[participantIndex]?.year?.message}</span>
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
                {/* Payment info removed as Razorpay is not integrated */}
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
    </ProfileGuard>
  )
}