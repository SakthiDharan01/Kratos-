"use client";
import Layout from '@/components/Layout';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { loadRazorpayScript, RazorpayOptions, RazorpayResponse } from '@/lib/razorpay';

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
          throw new Error(errorData.error || 'Registration failed');
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
      const razorpayLoaded = await loadRazorpayScript();
      if (!razorpayLoaded) {
        throw new Error('Failed to load Razorpay SDK');
      }

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
            console.log('Payment successful:', response);
            
            // Update payment status to "paid" and add Razorpay details
            for (const registrantId of registrantIds) {
              await supabase
                .from('registrants')
                .update({
                  payment_status: 'paid',
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  paid_amount: totalAmount / registrantIds.length
                })
                .eq('id', registrantId);
            }

            // Create payment record
            await supabase.from('payments').insert({
              user_id: authedUserId,
              amount: totalAmount,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              status: 'paid',
              metadata: { registrant_ids: registrantIds }
            });

            // Send confirmation email
            await fetch('/api/send-confirmation-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                registration_ids: registrantIds,
                user_email: user?.email
              })
            });

            // Clear session data and cart
            sessionStorage.removeItem('checkoutTeamData');
            clearPaidItemsFromCart(formData.events.map((e: any) => Number(e.eventId)));
            clearFormDraft();
            setRegistrationDraft(null);

            toast.success('Payment successful! Confirmation email sent.');
            
            // Navigate to receipt with first registration ID for QR code
            router.push(`/receipt?registrant_id=${registrantIds[0]}`);
            
          } catch (error) {
            console.error('Post-payment processing error:', error);
            toast.error('Payment successful but email sending failed. Please contact support.');
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
            <h1 className="text-4xl font-bold text-yellow-400 mb-8 text-center">Review & Pay</h1>

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
