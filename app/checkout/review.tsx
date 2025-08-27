import Layout from '@/components/Layout';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function ReviewPage({ searchParams }: { searchParams: any }) {
  const router = useRouter();
  const { cart } = useStore();
  // Assume form data is passed via query or state (for demo, use searchParams)
  const formData = searchParams?.formData ? JSON.parse(searchParams.formData) : null;

  const [loading, setLoading] = useState(false);

  if (!formData) {
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
    try {
      // Create registration
      const { data: reg, error: regErr } = await supabase
        .from('registrations')
        .insert({
          user_id: formData.userId, // You may need to pass userId in formData
          total_amount: formData.total || 0,
          status: 'pending',
        })
        .select()
        .single();
      if (regErr || !reg) throw regErr || new Error('Registration failed');

      // Insert participants
      let allRows: any[] = [];
      for (const event of formData.events) {
        for (let i = 0; i < event.participants.length; i++) {
          const p = event.participants[i];
          allRows.push({
            registration_id: reg.id,
            event_id: event.eventId,
            name: p.name,
            email: p.email,
            phone: p.phone,
            college: p.college,
            department: p.department,
            year: p.year,
            is_leader: i === 0,
            team_name: event.teamName,
          });
        }
      }
      const { error: partErr } = await supabase
        .from('registration_participants')
        .insert(allRows);
      if (partErr) throw partErr;

      toast.success('Registration successful!');
      router.push(`/receipt?id=${reg.id}`);
    } catch (error: any) {
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
            Review & Confirm
          </h1>
          <p className="text-xl text-gray-300">
            Please review your registration details before submitting.
          </p>
        </motion.div>
        <div className="space-y-8">
          {formData.events.map((event: any, idx: number) => (
            <div key={idx} className="bg-gray-900/50 border border-yellow-400/20 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-yellow-400 mb-2">{event.eventId}</h2>
              <div className="mb-2 text-white font-semibold">Team Name: {event.teamName}</div>
              <div className="text-white">Participants:</div>
              <ul className="ml-4 mt-1">
                {event.participants.map((p: any, i: number) => (
                  <li key={i} className="text-gray-200">
                    {i === 0 ? <span className="text-yellow-400 font-bold">Leader:</span> : null} {p.name} ({p.email}, {p.phone})
                    <span className="ml-2 text-gray-400">{p.college}, {p.department}, {p.year}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
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
