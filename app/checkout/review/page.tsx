"use client";
import Layout from '@/components/Layout';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

export default function CheckoutReviewPage() {
  const router = useRouter();
  const { cart, registrationDraft } = useStore();
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
      // Prefer calling edge function (atomic) – fallback to client inserts if it fails
      const { data: { user } } = await supabase.auth.getUser();
      const authedUserId = user?.id || null;

      for (const eventData of formData.events) {
        const payload = {
          event_id: Number(eventData.eventId), // Convert string to number to match SERIAL id
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

        // Try edge function first (if deployed)
        let edgeOk = false;
        try {
          const resp = await fetch('/functions/v1/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (resp.ok) {
            edgeOk = true;
          }
        } catch (_) { /* ignore edge failure and fallback */ }

        if (!edgeOk) {
          // Fallback manual flow: create team (registrants) then participants (registrations)
            // Insert team registration (registrants table)
          const { data: team, error: teamErr } = await supabase
            .from('registrants')
            .insert({
              event_id: payload.event_id,
              user_id: authedUserId,
              team_name: payload.team_name,
              payment_status: 'pending'
            })
            .select()
            .single();
          if (teamErr || !team) throw teamErr || new Error('Team registration failed');

          const participantsRows = payload.participants.map((p: any) => ({
            name: p.name,
            email: p.email,
            phone: p.phone,
            college: p.college,
            department: p.department,
            year: p.year,
            leader_id: team.id, // FK to registrants
            team_name: payload.team_name,
            event_id: payload.event_id,
            is_leader: p.is_leader
          }));

          const { error: partErr } = await supabase
            .from('registrations')
            .insert(participantsRows);
          if (partErr) throw partErr;
        }
      }

      toast.success('Registration successful!');
      router.push('/profile');
    } catch (error: any) {
      setError(error.message || 'Registration failed. Please try again.');
      toast.error(error.message || 'Registration failed. Please try again.');
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
            {loading ? 'Submitting...' : 'Confirm & Submit'}
          </button>
        </div>
      </div>
    </Layout>
  );
}
