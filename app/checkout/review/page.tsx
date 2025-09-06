"use client";
import Layout from '@/components/Layout';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { loadRazorpayScript, RazorpayOptions, RazorpayResponse } from '@/lib/razorpay';

export default function CheckoutReviewPage() {
  const router = useRouter();
  const { cart, registrationDraft, setUser, clearPaidItemsFromCart, clearFormDraft, setRegistrationDraft } = useStore();
  const formData = registrationDraft;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Helper to get event name from cart (handle both string and numeric event ids)
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
      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      const authedUserId = user?.id || null;
      
      if (!authedUserId) {
        throw new Error('User not authenticated');
      }

      // Ensure user exists in users table (upsert from auth.users + store data)
      const userFromStore = formData.events?.[0]?.participants?.[0]; // Get leader info from first event
      if (userFromStore) {
        const userData = {
          id: authedUserId,
          name: userFromStore.name,
          email: userFromStore.email,
          phone: userFromStore.phone,
          college: userFromStore.college,
          department: userFromStore.department,
          year: userFromStore.year,
        };
        
        const { error: userUpsertError } = await supabase
          .from('users')
          .upsert(userData, {
            onConflict: 'id'
          });
        
        if (userUpsertError) {
          console.error('User upsert error:', userUpsertError);
          throw new Error('Failed to create/update user record');
        }
        
        // Update store with latest user data
        setUser(userData);
      }

      // Create registrations and collect registrant IDs
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
          user_id: authedUserId
        };
        console.log('Processing event registration:', payload);

        // Check if team already exists for this event
        const { data: existingTeam } = await supabase
          .from('registrants')
          .select('id, payment_status')
          .eq('event_id', payload.event_id)
          .eq('team_name', payload.team_name)
          .single();

        console.log('Existing team check result:', existingTeam);

        let team: any = null;
        if (existingTeam) {
          console.log('Found existing team:', existingTeam);
          // If team exists and payment is pending/failed, update it
          if (existingTeam.payment_status === 'pending' || existingTeam.payment_status === 'failed') {
            const { data: updatedTeam, error: updateErr } = await supabase
              .from('registrants')
              .update({
                user_id: authedUserId,
                payment_status: 'pending',
                updated_at: new Date().toISOString()
              })
              .eq('id', existingTeam.id)
              .select()
              .single();
            
            if (updateErr) {
              console.error('Error updating existing team:', updateErr);
              throw updateErr;
            }
            team = updatedTeam;
            console.log('Updated existing team:', team);
          } else if (existingTeam.payment_status === 'paid') {
            throw new Error(`Team "${payload.team_name}" is already registered and paid for this event. Please use a different team name.`);
          }
        } else {
          console.log('Creating new team registration...');
          // Create new team registration
          const { data: newTeam, error: teamErr } = await supabase
            .from('registrants')
            .insert({
              event_id: payload.event_id,
              user_id: authedUserId,
              team_name: payload.team_name,
              payment_status: 'pending'
            })
            .select()
            .single();

          if (teamErr) {
            console.error('Error creating new team:', teamErr);
            throw teamErr;
          }
          team = newTeam;
          console.log('Created new team:', team);
        }

        if (!team) {
          console.error('Team registration failed - no team object');
          throw new Error('Team registration failed');
        }
        console.log('Adding registrant ID to list:', team.id);
        registrantIds.push(team.id);

        // Handle participant records - delete existing and create new ones
        // First, delete existing participants for this team/event to avoid duplicates
        await supabase
          .from('registrations')
          .delete()
          .eq('leader_id', team.id)
          .eq('event_id', payload.event_id);

        // Create new participant records
        const participantsRows = payload.participants.map((p: any) => ({
          name: p.name,
          email: p.email,
          phone: p.phone,
          college: p.college,
          department: p.department,
          year: p.year,
          leader_id: team.id,
          team_name: payload.team_name,
          event_id: payload.event_id,
          is_leader: p.is_leader
        }));

        const { error: partErr } = await supabase
          .from('registrations')
          .insert(participantsRows);
        if (partErr) throw partErr;
      }

      // If total is 0, mark as paid and redirect
      if (formData.total === 0) {
        for (const registrantId of registrantIds) {
          await supabase
            .from('registrants')
            .update({ payment_status: 'paid' })
            .eq('id', registrantId);
        }
        
        // Clear cart and form data for free events too
        const paidEventIds = formData.events.map((e: any) => parseInt(e.eventId));
        clearPaidItemsFromCart(paidEventIds);
        clearFormDraft();
        setRegistrationDraft(null);
        
        // Also clear localStorage backup
        try {
          localStorage.removeItem('checkout-form-draft');
        } catch (error) {
          console.error('Failed to clear localStorage:', error);
        }
        
        toast.success('Registration successful!');
        router.push('/profile');
        return;
      }

      // Initialize Razorpay payment
      await initiateRazorpayPayment(registrantIds);

    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle specific database constraint errors
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.message?.includes('registrants_event_id_team_name_key')) {
        errorMessage = 'A team with this name is already registered for this event. Please choose a different team name.';
      } else if (error.message?.includes('already registered and paid')) {
        errorMessage = error.message; // Use the custom message we set above
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  const initiateRazorpayPayment = async (registrantIds: number[]) => {
    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay SDK');
      }

      // Create Razorpay order
      const orderResponse = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: formData.total }),
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create payment order');
      }

      const orderData = await orderResponse.json();
      const userFromStore = formData.events?.[0]?.participants?.[0];

      // Configure Razorpay options
      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: Number(orderData.amount),
        currency: orderData.currency,
        name: 'Kratos 2k25',
        description: 'Event Registration Payment',
        order_id: orderData.orderId,
        handler: async (response: RazorpayResponse) => {
          await handlePaymentSuccess(response, registrantIds);
        },
        prefill: {
          name: userFromStore?.name || '',
          email: userFromStore?.email || '',
          contact: userFromStore?.phone || '',
        },
        theme: {
          color: '#FBBF24', // Yellow theme color
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast.error('Payment cancelled');
          },
        },
      };

      // Open Razorpay checkout
      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();

    } catch (error: any) {
      console.error('Payment initiation error:', error);
      toast.error(error.message || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (response: RazorpayResponse, registrantIds: number[]) => {
    try {
      console.log('Payment success response:', response);
      console.log('Registrant IDs to verify:', registrantIds);
      
      // Verify payment with all registrant IDs at once
      const verifyResponse = await fetch('/api/razorpay/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          registrant_ids: registrantIds, // Send all IDs at once
          amount: formData.total, // Send the total amount
        }),
      });

      console.log('Verify response status:', verifyResponse.status);

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        console.error('Verification failed:', errorData);
        throw new Error(errorData.error || 'Payment verification failed');
      }

      const verifyData = await verifyResponse.json();
      console.log('Payment verification successful:', verifyData);

      // Clear paid items from cart and reset form data
      const paidEventIds = formData.events.map((e: any) => parseInt(e.eventId));
      clearPaidItemsFromCart(paidEventIds);
      clearFormDraft();
      setRegistrationDraft(null);
      
      // Also clear localStorage backup
      try {
        localStorage.removeItem('checkout-form-draft');
      } catch (error) {
        console.error('Failed to clear localStorage:', error);
      }

      toast.success('Payment successful! Registration completed.');
      
      // Add a small delay to ensure database is updated before redirect
      setTimeout(() => {
        router.push('/receipt?payment_id=' + response.razorpay_payment_id);
      }, 1000);

    } catch (error: any) {
      console.error('Payment verification error:', error);
      toast.error(error.message || 'Payment verification failed');
    } finally {
      setLoading(false);
    }
  };
  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-5xl font-bold text-yellow-400 mb-4 flex items-center justify-center gap-3">
            Registration Review
          </h1>
          <p className="text-xl text-gray-300">
            Please review your registration details before confirming.
          </p>
        </motion.div>
        <div className="space-y-8">
          {(formData.events || []).map((event: any, idx: number) => (
            <div key={idx} className="bg-gray-900/50 border border-yellow-400/20 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-yellow-400 mb-2">{getEventName(event.eventId as number)}</h2>
              <div className="mb-2 text-white font-semibold">Team Name: {event.teamName}</div>
              <div className="text-white">Participants:</div>
              <ul className="ml-4 mt-1">
                {(event.participants || []).map((p: any, i: number) => (
                  <li key={i} className="text-gray-200">
                    {i === 0 ? <span className="text-yellow-400 font-bold">Leader:</span> : null} {p.name} ({p.email}, {p.phone})
                    <span className="ml-2 text-gray-400">{p.college}, {p.department}, {p.year}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 text-right text-2xl font-bold text-yellow-400">
          Total: ₹{formData.total || 0}
        </div>
        {error && <div className="text-red-400 text-center mb-4">{error}</div>}
        <div className="flex justify-end mt-8 gap-4">
          <button
            onClick={() => router.push('/checkout')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
            disabled={loading}
          >
            Edit Details
          </button>
          <button
            onClick={handleFinalSubmit}
            className="bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Processing...' : 
             formData.total > 0 ? `Pay ₹${formData.total}` : 'Confirm Registration'}
          </button>
        </div>
      </div>
    </Layout>
  );
}
