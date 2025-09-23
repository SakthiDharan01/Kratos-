"use client";
import Layout from '@/components/Layout';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { loadRazorpayScript, RazorpayOptions, RazorpayResponse } from '@/lib/razorpay';
import { Loader2, CheckCircle, AlertCircle, CreditCard, FileText } from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutReviewPage() {
  const router = useRouter();
  const { cart, registrationDraft, clearPaidItemsFromCart, clearFormDraft, setRegistrationDraft } = useStore();
  const formData = registrationDraft;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'creating_registration' | 'creating_order' | 'processing_payment' | 'verifying_payment' | 'completed' | 'failed'>('idle');
  const [currentStep, setCurrentStep] = useState<string>('');

  // Helper to get event name from cart
  const getEventName = (eventId: string | number) => {
    const numericId = typeof eventId === 'string' ? Number(eventId) : eventId;
    const found = (cart || []).find(e => e.event.id === numericId);
    return found ? found.event.name : String(eventId);
  };

  if (!formData || !(formData.events && formData.events.length)) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h1 className="text-3xl font-bold text-yellow-400 mb-4">No Data</h1>
          <p className="text-gray-300 mb-8">No registration data to review.</p>
          <button
            onClick={() => router.push('/checkout')}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </Layout>
    );
  }

  const handleFinalSubmit = async () => {
    setLoading(true);
    setError(null);
    setPaymentStatus('creating_registration');
    setCurrentStep('Setting up your registration...');
    
    try {
      // Get authenticated user and session
      const { data: { user } } = await supabase.auth.getUser();
      const { data: { session } } = await supabase.auth.getSession();
      const authedUserId = user?.id || null;
      
      if (!authedUserId || !session) {
        throw new Error('User not authenticated');
      }

      // Create registrations with "pending" status
      const registrantIds: number[] = [];
      console.log('Starting registration creation for events:', formData.events);

      for (const eventData of formData.events) {
        setCurrentStep(`Creating registration for ${getEventName(eventData.eventId)}...`);
        
        const payload = {
          event_id: Number(eventData.eventId),
          team_name: eventData.teamName,
          participants: eventData.participants.map((p: any, idx: number) => ({
            name: p.name,
            email: p.email,
            phone: p.phone,
            college: p.college,
            department: p.department,
            year: p.year,
            is_leader: idx === 0
          })),
          user_id: authedUserId,
          payment_status: 'pending'
        };

        // Call the API to create registration
        const response = await fetch('/api/registrations', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Registration API error:', errorData);
          
          // Provide specific error messages for common issues
          if (response.status === 409 && errorData.error?.includes('already registered')) {
            throw new Error(`Team "${eventData.teamName}" is already registered for this event. Please use a different team name or contact support if you believe this is an error.`);
          }
          
          throw new Error(errorData.error || `Failed to create team registration for ${getEventName(eventData.eventId)}`);
        }

        const result = await response.json();
        console.log('Registration created:', result);
        registrantIds.push(result.registrant_id);
      }

      // Calculate total amount
      const totalAmount = (cart || []).reduce((sum, item) => {
        const eventPrice = typeof item.event.price === 'string' ? parseFloat(item.event.price) : item.event.price;
        return sum + eventPrice;
      }, 0);

      setPaymentStatus('creating_order');
      setCurrentStep('Setting up payment gateway...');
      console.log('Creating Razorpay order for amount:', totalAmount);

      // Create Razorpay order
      const orderResponse = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: totalAmount,
          metadata: { 
            registrant_ids: registrantIds,
            user_id: authedUserId 
          }
        }),
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create payment order');
      }

      const order = await orderResponse.json();
      console.log('Razorpay order created:', order);

      // Load Razorpay script
      setCurrentStep('Loading payment interface...');
      const razorpayLoaded = await loadRazorpayScript();
      if (!razorpayLoaded) {
        throw new Error('Failed to load Razorpay SDK');
      }

      setPaymentStatus('processing_payment');
      setCurrentStep('Opening payment gateway...');
      
      // Configure Razorpay options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: order.amount,
        currency: order.currency,
        name: 'Kratos Event Registration',
        description: `Registration for ${formData.events.length} event(s)`,
        order_id: order.id,
        handler: async (response: any) => {
          try {
            setPaymentStatus('verifying_payment');
            setCurrentStep('Verifying your payment...');
            console.log('Payment successful:', response);
            
            // Use the verification API to properly update payment status
            const verifyResponse = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                registrant_ids: registrantIds,
                amount: totalAmount
              })
            });

            if (!verifyResponse.ok) {
              const errorData = await verifyResponse.json();
              throw new Error(errorData.error || 'Payment verification failed');
            }

            const verifyResult = await verifyResponse.json();
            console.log('Payment verification result:', verifyResult);

            setPaymentStatus('completed');
            setCurrentStep('Registration complete! Redirecting...');

            // Clear session data and cart
            sessionStorage.removeItem('checkoutTeamData');
            clearPaidItemsFromCart(formData.events.map((e: any) => Number(e.eventId)));
            clearFormDraft();
            setRegistrationDraft(null);

            // Show success with receipt info
            toast.success('Payment successful! Confirmation email sent.', {
              duration: 6000,
            });
            
            // Show receipt notification after a delay
            setTimeout(() => {
              toast.success('📄 Your receipt is now available in your profile!', {
                duration: 8000,
                icon: '🧾',
              });
            }, 2000);
            
            // Navigate to receipt with first registration ID for QR code
            setTimeout(() => {
              router.push(`/receipt?registrant_id=${registrantIds[0]}`);
            }, 1500);
            
          } catch (error) {
            console.error('Post-payment processing error:', error);
            setPaymentStatus('failed');
            setCurrentStep('Payment successful but verification failed');
            toast.error('Payment successful but verification failed. Please contact support.');
          }
        },
        prefill: {
          name: formData.events[0]?.participants[0]?.name || '',
          email: formData.events[0]?.participants[0]?.email || '',
          contact: formData.events[0]?.participants[0]?.phone || '',
        },
        theme: {
          color: '#F59E0B',
        },
      };

      // Open Razorpay payment modal
      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error: any) {
      console.error('Registration error:', error);
      setPaymentStatus('failed');
      setCurrentStep('Registration failed');
      setError(error.message || 'Registration failed');
      toast.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = (cart || []).reduce((sum, item) => {
    const eventPrice = typeof item.event.price === 'string' ? parseFloat(item.event.price) : item.event.price;
    return sum + eventPrice;
  }, 0);

  return (
    <Layout>
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl font-bold text-yellow-400 mb-6 text-center">Review & Pay</h1>

            {/* Payment Status Indicator */}
            {paymentStatus !== 'idle' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-900 border rounded-xl p-6 mb-6"
                style={{
                  borderColor: 
                    paymentStatus === 'completed' ? '#10B981' :
                    paymentStatus === 'failed' ? '#EF4444' :
                    '#F59E0B'
                }}
              >
                <div className="flex items-center justify-center space-x-3">
                  {paymentStatus === 'creating_registration' && (
                    <Loader2 className="animate-spin text-blue-400" size={20} />
                  )}
                  {paymentStatus === 'creating_order' && (
                    <CreditCard className="text-orange-400" size={20} />
                  )}
                  {paymentStatus === 'processing_payment' && (
                    <Loader2 className="animate-spin text-orange-400" size={20} />
                  )}
                  {paymentStatus === 'verifying_payment' && (
                    <Loader2 className="animate-spin text-blue-400" size={20} />
                  )}
                  {paymentStatus === 'completed' && (
                    <CheckCircle className="text-green-400" size={20} />
                  )}
                  {paymentStatus === 'failed' && (
                    <AlertCircle className="text-red-400" size={20} />
                  )}
                  
                  <div className="text-center">
                    <p className={`font-medium ${
                      paymentStatus === 'completed' ? 'text-green-400' :
                      paymentStatus === 'failed' ? 'text-red-400' :
                      'text-yellow-400'
                    }`}>
                      {paymentStatus === 'creating_registration' && 'Setting up Registration'}
                      {paymentStatus === 'creating_order' && 'Preparing Payment'}
                      {paymentStatus === 'processing_payment' && 'Processing Payment'}
                      {paymentStatus === 'verifying_payment' && 'Verifying Payment'}
                      {paymentStatus === 'completed' && 'Registration Complete!'}
                      {paymentStatus === 'failed' && 'Registration Failed'}
                    </p>
                    {currentStep && (
                      <p className="text-sm text-gray-400 mt-1">{currentStep}</p>
                    )}
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-gray-700 rounded-full h-2 mt-4">
                  <motion.div
                    className="h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ 
                      width: 
                        paymentStatus === 'creating_registration' ? '20%' :
                        paymentStatus === 'creating_order' ? '40%' :
                        paymentStatus === 'processing_payment' ? '60%' :
                        paymentStatus === 'verifying_payment' ? '80%' :
                        paymentStatus === 'completed' ? '100%' :
                        paymentStatus === 'failed' ? '100%' :
                        '0%'
                    }}
                    style={{
                      backgroundColor: 
                        paymentStatus === 'completed' ? '#10B981' :
                        paymentStatus === 'failed' ? '#EF4444' :
                        '#F59E0B'
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </motion.div>
            )}

            {error && (
              <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 mb-6">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              {formData.events.map((eventData: any, index: number) => {
                const eventName = getEventName(eventData.eventId);
                const eventPrice = (cart || []).find(item => item.event.id === Number(eventData.eventId))?.event.price || 0;
                
                return (
                  <div key={index} className="bg-gray-900 rounded-xl p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-bold text-yellow-400">{eventName}</h2>
                      <span className="text-2xl font-bold text-yellow-400">₹{eventPrice}</span>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-gray-300"><strong>Team Name:</strong> {eventData.teamName}</p>
                      <p className="text-gray-300"><strong>Total Participants:</strong> {eventData.participants.length}</p>
                    </div>

                    <div className="space-y-3">
                      {eventData.participants.map((participant: any, pIndex: number) => (
                        <div key={pIndex} className="bg-gray-800 p-4 rounded-lg">
                          <div className="flex items-center mb-2">
                            {pIndex === 0 && <span className="text-green-400 mr-2">👑</span>}
                            <h3 className="text-white font-medium">
                              {participant.name} {pIndex === 0 && '(Team Leader)'}
                            </h3>
                          </div>
                          <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-300">
                            <p><strong>Email:</strong> {participant.email}</p>
                            <p><strong>Phone:</strong> {participant.phone}</p>
                            <p><strong>College:</strong> {participant.college}</p>
                            <p><strong>Department:</strong> {participant.department}</p>
                            <p><strong>Year:</strong> {participant.year}</p>
                            <p><strong>State:</strong> {participant.state}</p>
                            <p><strong>Location:</strong> {participant.location}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              <div className="bg-gray-900 rounded-xl p-6 border-2 border-yellow-400">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-bold text-white">Total Amount:</span>
                  <span className="text-3xl font-bold text-yellow-400">₹{totalAmount}</span>
                </div>
                
                <p className="text-gray-300 text-sm mb-6">
                  You will be redirected to a secure payment gateway to complete your registration.
                </p>

                <div className="flex justify-between">
                  <button
                    onClick={() => router.push('/checkout')}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
                    disabled={loading}
                  >
                    Back to Checkout
                  </button>
                  
                  <button
                    onClick={handleFinalSubmit}
                    disabled={loading}
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold py-4 px-8 rounded-xl text-lg transition-all duration-300 flex items-center disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                    ) : (
                      <span className="mr-2">💳</span>
                    )}
                    {loading ? 'Processing...' : 'Pay Now'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
