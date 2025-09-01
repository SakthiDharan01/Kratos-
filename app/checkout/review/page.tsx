"use client";

import Layout from '@/components/Layout';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

interface Participant {
  name: string;
  email: string;
  phone: string;
  college: string;
  department: string;
  year: string;
}

export default function CheckoutReviewPage() {
  const router = useRouter();
  const { cart, registrationDraft, user, isAuthenticated } = useStore();
  const formData = registrationDraft;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!formData || !formData.events || formData.events.length === 0) {
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
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }

      // First, create/update user record
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();

      let userId = existingUser?.id;

      if (!userId) {
        // Create new user
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert([{
            name: user.name,
            email: user.email,
            phone: user.phone,
            department: user.department,
            year: user.year,
            college: user.college,
            role: 'user'
          }])
          .select('id')
          .single();

        if (userError) throw userError;
        userId = newUser.id;
      }

      // Process each event registration
      for (const eventReg of formData.events) {
        const event = cart.find(c => c.event.id.toString() === eventReg.eventId)?.event;
        if (!event) continue;

        // Create registrant (team registration)
        const { data: registrant, error: registrantError } = await supabase
          .from('registrants')
          .insert([{
            event_id: event.id,
            user_id: userId,
            team_name: eventReg.teamName,
            payment_status: 'pending'
          }])
          .select('id')
          .single();

        if (registrantError) throw registrantError;

        // Create registrations (team members)
        const registrationData = eventReg.participants.map((participant: Participant, index: number) => ({
          name: participant.name,
          email: participant.email,
          phone: participant.phone,
          college: participant.college,
          department: participant.department,
          year: participant.year,
          leader_id: registrant.id,
          team_name: eventReg.teamName,
          event_id: event.id,
          is_leader: index === 0 // First participant is leader
        }));

        const { error: participantError } = await supabase
          .from('registrations')
          .insert(registrationData);

        if (participantError) throw participantError;
      }

      toast.success('Registration submitted successfully!');
      router.push('/receipt?success=true');
      
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Failed to submit registration');
      toast.error(error.message || 'Failed to submit registration');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = formData.events.reduce((sum: number, eventReg: any) => {
    const event = cart.find(c => c.event.id.toString() === eventReg.eventId)?.event;
    return sum + (event ? event.price * eventReg.participants.length : 0);
  }, 0);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="text-center">
            <h1 className="text-4xl font-bold text-yellow-400 mb-4">Review Registration</h1>
            <p className="text-gray-300">Please review your registration details before submitting</p>
          </div>

          {/* Registration Summary */}
          <div className="bg-gray-900/50 border border-red-500/20 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-yellow-400 mb-6">Registration Summary</h2>
            
            {formData.events.map((eventReg: any, index: number) => {
              const event = cart.find(c => c.event.id.toString() === eventReg.eventId)?.event;
              if (!event) return null;

              return (
                <div key={index} className="mb-8 last:mb-0">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white">{event.name}</h3>
                      <p className="text-gray-400">Team: {eventReg.teamName}</p>
                      <p className="text-gray-400">
                        Price: ₹{event.price} × {eventReg.participants.length} = ₹{event.price * eventReg.participants.length}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-lg font-medium text-yellow-400">Team Members:</h4>
                    {eventReg.participants.map((participant: Participant, pIndex: number) => (
                      <div key={pIndex} className="bg-gray-800/50 p-4 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="font-medium text-white">{participant.name}</p>
                            <p className="text-sm text-gray-400">{pIndex === 0 ? 'Team Leader' : 'Member'}</p>
                          </div>
                          <div>
                            <p className="text-gray-300">{participant.email}</p>
                            <p className="text-gray-300">{participant.phone}</p>
                          </div>
                          <div>
                            <p className="text-gray-300">{participant.college}</p>
                            <p className="text-gray-300">{participant.department} - {participant.year}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <div className="border-t border-gray-700 pt-6 mt-6">
              <div className="flex justify-between items-center text-xl font-bold">
                <span className="text-yellow-400">Total Amount:</span>
                <span className="text-green-400">₹{totalAmount}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            <button
              onClick={() => router.push('/checkout')}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Back to Edit
            </button>
            
            <button
              onClick={handleFinalSubmit}
              disabled={loading}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Confirm Registration'}
            </button>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
