'use client'

import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { motion } from 'framer-motion'
import { User, Mail, Building, BookOpen, Calendar, Phone, Edit, ShoppingBag, Loader2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, isAuthenticated, setUser } = useStore();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    college: user?.college || '',
    department: user?.department || '',
    year: user?.year || '',
  });
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [regLoading, setRegLoading] = useState(true);
  const [search, setSearch] = useState('');
  // Helper to get event name from cart (fallback to eventId)
  const { cart } = useStore();
  const getEventName = (eventId: string | number) => {
    const found = cart.find(e => e.event.id === eventId);
    return found ? found.event.name : String(eventId);
  };

  // Fetch registration history on mount
  // Add a refresh function for registration history
  const refreshRegistrations = async () => {
    if (!user) return;
    setRegLoading(true);
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          id, 
          event_id, 
          team_name, 
          status, 
          created_at,
          registrants (
            name, 
            email, 
            is_leader,
            college,
            department,
            year
          )
        `)
        .eq('leader_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setRegistrations(data || []);
    } catch (error: any) {
      toast.error('Failed to load registrations');
    } finally {
      setRegLoading(false);
    }
  };
  
  useEffect(() => {
    refreshRegistrations();
  }, [user]);

  // Listen for receipt page navigation and refresh registrations
  if (typeof window !== 'undefined') {
    window.addEventListener('focus', refreshRegistrations);
  }

  if (!isAuthenticated || !user) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h1 className="text-3xl font-bold text-yellow-400 mb-4">Please Login</h1>
          <p className="text-gray-300 mb-8">You need to be logged in to view your profile.</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Go to Login
          </button>
        </div>
      </Layout>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('users').update({
        name: form.name,
        email: form.email,
        phone: form.phone,
        college: form.college,
        department: form.department,
        year: form.year,
      }).eq('id', user.id);
      if (error) throw error;
      setUser({ ...user, ...form, year: form.year as '1st' | '2nd' | '3rd' | '4th' | '5th' | 'Graduate' });
      toast.success('Profile updated!');
      setEditing(false);
    } catch (err: any) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Registration History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900/50 border border-yellow-400/20 rounded-xl p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6" /> Registration History
          </h2>
          <div className="mb-4 flex justify-end">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by team name or event..."
              className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white text-sm w-64"
            />
          </div>
          {regLoading ? (
            <div className="text-gray-300">Loading...</div>
          ) : registrations.length === 0 ? (
            <div className="text-gray-400">No registrations found.</div>
          ) : (
            <div className="space-y-6">
              {registrations
                .filter(reg =>
                  reg.team_name.toLowerCase().includes(search.toLowerCase()) ||
                  getEventName(reg.event_id).toLowerCase().includes(search.toLowerCase())
                )
                .map(reg => (
                  <div key={reg.id} className="border-b border-gray-700 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-white">{reg.team_name}</span>
                      <span className={`px-3 py-1 rounded text-xs font-semibold ${reg.status === 'confirmed' ? 'bg-green-700 text-green-300' : 'bg-yellow-700 text-yellow-300'}`}>{reg.status}</span>
                    </div>
                    <div className="text-yellow-400 font-semibold mb-1">Event: {getEventName(reg.event_id)}</div>
                    <div className="text-gray-300 text-sm mb-2">Registered on: {new Date(reg.created_at).toLocaleString()}</div>
                    <div className="text-white text-sm">Participants:</div>
                    <ul className="ml-4 mt-1">
                      {reg.members?.map((p: any, idx: number) => (
                        <li key={idx} className="text-gray-200">
                          {p.is_leader ? <span className="text-yellow-400 font-bold">Leader:</span> : null} {p.name} ({p.email})
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          )}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-5xl font-bold text-yellow-400 mb-4 flex items-center justify-center gap-3">
            <User className="w-12 h-12" />
            My Profile
          </h1>
          <p className="text-xl text-gray-300">
            Manage your account information and preferences
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gray-900/50 border border-red-500/20 rounded-xl p-8 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-white">Personal Information</h2>
                {!editing && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                    onClick={() => setEditing(true)}
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </motion.button>
                )}
              </div>

              {editing ? (
                <form onSubmit={handleSave} className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-300">
                      <User className="w-5 h-5" />
                      <span>Full Name</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-300">
                      <Mail className="w-5 h-5" />
                      <span>Email</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-300">
                      <Phone className="w-5 h-5" />
                      <span>Phone</span>
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-300">
                      <Building className="w-5 h-5" />
                      <span>College</span>
                    </label>
                    <input
                      type="text"
                      value={form.college}
                      onChange={e => setForm(f => ({ ...f, college: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-300">
                      <BookOpen className="w-5 h-5" />
                      <span>Department</span>
                    </label>
                    <input
                      type="text"
                      value={form.department}
                      onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-300">
                      <Calendar className="w-5 h-5" />
                      <span>Year</span>
                    </label>
                    <select
                      value={form.year}
                      onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white"
                      required
                    >
                      <option value="">Select Year</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="Graduate">Graduate</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 flex space-x-4 mt-4">
                    <button
                      type="button"
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 rounded-lg transition-colors"
                      onClick={() => setEditing(false)}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : null}
                      {loading ? 'Saving...' : 'Save Profile'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  <motion.div className="space-y-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-300"><User className="w-5 h-5" /><span>Full Name</span></label>
                    <div className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white">{user.name}</div>
                  </motion.div>
                  <motion.div className="space-y-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-300"><Mail className="w-5 h-5" /><span>Email</span></label>
                    <div className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white">{user.email}</div>
                  </motion.div>
                  <motion.div className="space-y-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-300"><Phone className="w-5 h-5" /><span>Phone</span></label>
                    <div className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white">{user.phone}</div>
                  </motion.div>
                  <motion.div className="space-y-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-300"><Building className="w-5 h-5" /><span>College</span></label>
                    <div className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white">{user.college}</div>
                  </motion.div>
                  <motion.div className="space-y-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-300"><BookOpen className="w-5 h-5" /><span>Department</span></label>
                    <div className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white">{user.department}</div>
                  </motion.div>
                  <motion.div className="space-y-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-300"><Calendar className="w-5 h-5" /><span>Year</span></label>
                    <div className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white">{user.year}</div>
                  </motion.div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-r from-red-600 to-maroon-700 p-6 rounded-xl text-white"
              >
                <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/cart')}
                    className="w-full bg-white/20 hover:bg-white/30 text-white py-3 px-4 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    <span>View Cart</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/pre-events')}
                    className="w-full bg-white/20 hover:bg-white/30 text-white py-3 px-4 rounded-lg transition-colors"
                  >
                    Browse Events
                  </motion.button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gray-900/50 border border-red-500/20 rounded-xl p-6 backdrop-blur-sm"
              >
                <h3 className="text-xl font-bold text-white mb-4">Account Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Registered Events</span>
                    <span className="text-yellow-400 font-bold">0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Total Spent</span>
                    <span className="text-green-400 font-bold">₹0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Account Status</span>
                    <span className="text-blue-400 font-bold">Active</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-blue-600 text-white p-4 rounded-lg text-center"
              >
                <p className="text-sm font-medium">🎯 Complete your registration to unlock exclusive events and early bird discounts!</p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}