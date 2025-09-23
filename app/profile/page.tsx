'use client'

import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { motion } from 'framer-motion'
import { User, Mail, Building, BookOpen, Calendar, Phone, Edit, ShoppingBag, Loader2, Receipt, RefreshCw, X, AlertCircle } from 'lucide-react'
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

  // Update form when user data changes or when entering edit mode
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        college: user.college || '',
        department: user.department || '',
        year: user.year || '',
      });
    }
  }, [user]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [regLoading, setRegLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({
    registeredEvents: 0,
    totalSpent: 0,
    pendingPayments: 0,
  });

  const [verifyingPayment, setVerifyingPayment] = useState<number | null>(null);
  const [cancellingPayment, setCancellingPayment] = useState<number | null>(null);

  // Function to verify pending payment
  const verifyPendingPayment = async (registrantId: number) => {
    setVerifyingPayment(registrantId);
    try {
      const response = await fetch('/api/verify-pending-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ registrantId }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Payment verified successfully! Redirecting to receipt...', {
          duration: 4000,
        });
        refreshRegistrations();
        
        // Redirect to receipt page after successful verification
        setTimeout(() => {
          router.push(`/receipt?registrant_id=${registrantId}`);
        }, 1500);
      } else {
        toast.error(result.error || 'Failed to verify payment');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error('Failed to verify payment');
    } finally {
      setVerifyingPayment(null);
    }
  };

  // Function to cancel pending payment
  const cancelPendingPayment = async (registrantId: number) => {
    if (!confirm('Are you sure you want to cancel this payment? This action cannot be undone.')) {
      return;
    }

    setCancellingPayment(registrantId);
    try {
      const response = await fetch('/api/cancel-pending-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ registrantId }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Payment cancelled successfully');
        refreshRegistrations();
      } else {
        toast.error(result.error || 'Failed to cancel payment');
      }
    } catch (error) {
      console.error('Error cancelling payment:', error);
      toast.error('Failed to cancel payment');
    } finally {
      setCancellingPayment(null);
    }
  };
  // Helper to get event name from cart (fallback to eventId)
  const { cart } = useStore();
  const getEventName = (eventId: number | string) => {
    const numericId = typeof eventId === 'string' ? Number(eventId) : eventId;
    const found = cart.find(e => e.event.id === numericId);
    return found ? found.event.name : String(eventId);
  };

  // Fetch registration history on mount
  // Add a refresh function for registration history
  const refreshRegistrations = async () => {
    if (!user) return;
    setRegLoading(true);
    try {
      // New schema: 'registrants' holds team registration/payment; 'registrations' holds participants
      // Based on your schema: registrations.leader_id -> registrants.id
      const { data, error } = await supabase
        .from('registrants')
        .select(`
          id,
          event_id,
          team_name,
          payment_status,
          registration_date,
          paid_amount,
          events(name, price),
          registrations!leader_id(name,email,is_leader,college,department,year)
        `)
        .eq('user_id', user.id)
        .order('registration_date', { ascending: false });
      
      if (error) throw error;
      
      const registrationsData = data || [];
      setRegistrations(registrationsData);
      
      console.log('Registration data fetched:', registrationsData);
      
      // Calculate stats
      const paidRegistrations = registrationsData.filter(reg => reg.payment_status === 'paid');
      const pendingRegistrations = registrationsData.filter(reg => reg.payment_status === 'pending');
      
      console.log('Paid registrations:', paidRegistrations);
      console.log('Pending registrations:', pendingRegistrations);
      
      const totalSpent = paidRegistrations.reduce((sum, reg) => {
        const eventPrice = (reg.events as any)?.price || 0;
        const amount = reg.paid_amount || eventPrice;
        console.log(`Registration ${reg.id}: paid_amount=${reg.paid_amount}, event_price=${eventPrice}, using=${amount}`);
        return sum + amount;
      }, 0);
      
      const newStats = {
        registeredEvents: paidRegistrations.length,
        totalSpent: totalSpent,
        pendingPayments: pendingRegistrations.length,
      };
      
      console.log('Calculated stats:', newStats);
      setStats(newStats);
      
    } catch (error: any) {
      console.error('Registration fetch error', error.message || error);
      toast.error('Failed to load registrations');
    } finally {
      setRegLoading(false);
    }
  };
  
  useEffect(() => {
    refreshRegistrations();
    
    // Debug: verify users table accessible under RLS (adds status/code if available)
    (async () => {
      if (!user) return;
      const { data: userRow, error: userErr } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();
      if (userErr) {
        console.error('User fetch error', {
          message: (userErr as any).message,
          details: (userErr as any).details,
          hint: (userErr as any).hint,
          code: (userErr as any).code
        });
      } else {
        console.log('User row ok', userRow?.id);
      }
    })();

    // Check if user came from payment success and refresh data with delay
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('from') === 'payment') {
      // Refresh after a short delay to allow database updates to complete
      setTimeout(() => {
        refreshRegistrations();
      }, 2000);
      // Clean up URL without reload
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const onFocus = () => refreshRegistrations();
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', onFocus);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', onFocus);
      }
    };
  }, [user]);

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
    
    // Debug: Log form data
    console.log('Saving profile with form data:', form);
    
    try {
      // Use UPSERT to handle both insert and update cases
      const userData = {
        id: user.id,
        name: form.name,
        email: form.email,
        phone: form.phone,
        college: form.college,
        department: form.department,
        year: form.year,
      };

      console.log('userData to save:', userData);

      const { error } = await supabase
        .from('users')
        .upsert(userData, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Profile update error:', error);
        throw error;
      }

      console.log('Database update successful');

      // Update the store with new user data
      setUser(userData);
      
      // Also update auth metadata for consistency
      const authUpdateResult = await supabase.auth.updateUser({
        data: {
          name: form.name,
          phone: form.phone,
          college: form.college,
          department: form.department,
          year: form.year
        }
      });

      console.log('Auth metadata update result:', authUpdateResult);

      toast.success('Profile updated successfully!');
      setEditing(false);
      
      // Force re-check of profile completion
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (err: any) {
      console.error('Profile save error:', err);
      toast.error(`Failed to update profile: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    // Ensure form is populated with current user data when entering edit mode
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        college: user.college || '',
        department: user.department || '',
        year: user.year || '',
      });
    }
    setEditing(true);
  };

  const handleCancel = () => {
    // Reset form to original user data when canceling
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        college: user.college || '',
        department: user.department || '',
        year: user.year || '',
      });
    }
    setEditing(false);
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
          <h2 className="text-2xl font-bold text-yellow-400 mb-2 flex items-center gap-2">
            <Calendar className="w-6 h-6" /> Registration History
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            💡 Click on confirmed registrations to view and download receipts
          </p>
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
                  reg.team_name?.toLowerCase().includes(search.toLowerCase()) ||
                  getEventName(reg.event_id).toLowerCase().includes(search.toLowerCase())
                )
                .map(reg => {
                  const status = reg.payment_status === 'paid' ? 'confirmed' : reg.payment_status;
                  const eventName = reg.events?.name || getEventName(reg.event_id);
                  const canViewReceipt = status === 'confirmed' && reg.paid_amount > 0;
                  
                  return (
                    <div 
                      key={reg.id} 
                      className={`border-b border-gray-700 pb-4 last:border-b-0 last:pb-0 relative ${
                        canViewReceipt 
                          ? 'cursor-pointer hover:bg-gray-800/50 rounded-lg p-4 transition-all duration-200 group hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10' 
                          : 'p-4'
                      }`}
                      onClick={() => {
                        if (canViewReceipt) {
                          router.push(`/receipt?registrant_id=${reg.id}`);
                        }
                      }}
                      title={canViewReceipt ? 'Click to view receipt' : 'Receipt not available'}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-sm sm:text-base break-words">{reg.team_name || '—'}</span>
                          {canViewReceipt && (
                            <span className="text-xs bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full group-hover:bg-blue-600/40 group-hover:text-blue-300 transition-all duration-200 flex items-center gap-1 border border-blue-600/30 group-hover:border-blue-500/50">
                              <Receipt className="w-3 h-3" />
                              View Receipt
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                            status === 'confirmed' 
                              ? 'bg-green-700 text-green-300' 
                              : status === 'pending' 
                                ? 'bg-yellow-700 text-yellow-300' 
                                : 'bg-red-700 text-red-300'
                          }`}>
                            {status}
                          </span>
                          
                          {/* Pending payment actions */}
                          {status === 'pending' && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  verifyPendingPayment(reg.id);
                                }}
                                disabled={verifyingPayment === reg.id}
                                className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 disabled:opacity-50"
                                title="Verify payment and view receipt"
                              >
                                {verifyingPayment === reg.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <RefreshCw className="w-3 h-3" />
                                )}
                                Verify & View Receipt
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  cancelPendingPayment(reg.id);
                                }}
                                disabled={cancellingPayment === reg.id}
                                className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 disabled:opacity-50"
                                title="Cancel this pending payment"
                              >
                                {cancellingPayment === reg.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <X className="w-3 h-3" />
                                )}
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Pending payment notice */}
                      {status === 'pending' && (
                        <div className="bg-yellow-900/30 border border-yellow-600/30 rounded-lg p-3 mb-3">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-yellow-200">
                              <p className="font-medium mb-1">Payment is pending</p>
                              <p className="text-xs text-yellow-300">
                                If you have already paid, click "Verify & View Receipt" to update the status and download your receipt. 
                                If you want to cancel this registration, click "Cancel".
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="text-yellow-400 font-semibold mb-1 text-sm sm:text-base break-words">Event: {eventName}</div>
                      <div className="text-gray-300 text-xs sm:text-sm mb-2">Registered on: {new Date(reg.registration_date).toLocaleString()}</div>
                      <div className="text-white text-sm">Participants:</div>
                      <ul className="ml-4 mt-1">
                        {reg.registrations?.map((p: any, idx: number) => (
                          <li key={idx} className="text-gray-200 text-sm break-words">
                            {p.is_leader ? <span className="text-yellow-400 font-bold">Leader:</span> : null} {p.name} ({p.email})
                          </li>
                        ))}
                      </ul>
                      {typeof reg.paid_amount === 'number' && reg.paid_amount > 0 && (
                        <div className="text-sm text-green-400 mt-2">Paid: ₹{reg.paid_amount}</div>
                      )}
                    </div>
                  );
                })}
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
                    onClick={handleEditProfile}
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </motion.button>
                )}
              </div>

              {editing ? (
                <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-300">
                      <User className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Full Name</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-white text-sm sm:text-base"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-300">
                      <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Email</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-white text-sm sm:text-base"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-300">
                      <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Phone</span>
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-white text-sm sm:text-base"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-300">
                      <Building className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>College</span>
                    </label>
                    <input
                      type="text"
                      value={form.college}
                      onChange={e => setForm(f => ({ ...f, college: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-white text-sm sm:text-base"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-300">
                      <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Department</span>
                    </label>
                    <input
                      type="text"
                      value={form.department}
                      onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-white text-sm sm:text-base"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-300">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Year</span>
                    </label>
                    <select
                      value={form.year}
                      onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-white text-sm sm:text-base"
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
                  <div className="sm:col-span-2 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mt-4">
                    <button
                      type="button"
                      className="w-full sm:flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 sm:py-3 rounded-lg transition-colors text-sm sm:text-base"
                      onClick={handleCancel}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-full sm:flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 sm:py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center text-sm sm:text-base"
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="animate-spin w-4 h-4 sm:w-5 sm:h-5 mr-2" /> : null}
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
                    onClick={() => router.push('/technical')}
                    className="w-full bg-white/20 hover:bg-white/30 text-white py-3 px-4 rounded-lg transition-colors"
                  >
                    Browse Technical Events
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
                    <span className="text-yellow-400 font-bold">{stats.registeredEvents}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Total Spent</span>
                    <span className="text-green-400 font-bold">₹{stats.totalSpent}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Pending Payments</span>
                    <span className="text-orange-400 font-bold">{stats.pendingPayments}</span>
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