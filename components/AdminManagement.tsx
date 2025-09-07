'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, UserPlus, CreditCard, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

interface Admin {
  id: string
  email: string
  role: string
  is_active: boolean
  created_at: string
  last_login: string | null
}

interface PaymentRecord {
  id: number
  registrant_id: number
  razorpay_order_id: string
  razorpay_payment_id: string
  paid_amount: number
  payment_status: string
  payment_method: string
  payment_time: string
  created_at: string
  registrants: {
    team_name: string
    events: {
      name: string
    }
  }
}

export function AdminManagement() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState('admin')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'admins' | 'payments'>('admins')

  // Fetch all admins
  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAdmins(data || [])
    } catch (error) {
      console.error('Error fetching admins:', error)
      toast.error('Failed to fetch admins')
    }
  }

  // Fetch payment records
  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          registrants!inner(
            team_name,
            events!inner(name)
          )
        `)
        .order('payment_time', { ascending: false })

      if (error) throw error
      setPayments(data || [])
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast.error('Failed to fetch payments')
    }
  }

  // Load data on component mount
  useEffect(() => {
    fetchAdmins()
    fetchPayments()
  }, [])

  // Add new admin
  const addAdmin = async () => {
    if (!newEmail.trim()) {
      toast.error('Please enter an email')
      return
    }

    setLoading(true)
    try {
      // First, find the user by email in auth.users
      const { data: userData, error: userError } = await supabase.auth.admin.listUsers()
      
      if (userError) throw userError

      const targetUser = userData.users.find(u => u.email === newEmail)
      if (!targetUser) {
        toast.error('User not found. They must sign up first.')
        return
      }

      // Insert into admins table
      const { error: insertError } = await supabase
        .from('admins')
        .insert({
          user_id: targetUser.id,
          email: newEmail,
          role: newRole,
          is_active: true
        })

      if (insertError) throw insertError

      toast.success('Admin added successfully')
      setNewEmail('')
      fetchAdmins()
    } catch (error) {
      console.error('Error adding admin:', error)
      toast.error('Failed to add admin')
    } finally {
      setLoading(false)
    }
  }

  // Toggle admin status
  const toggleAdmin = async (adminId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('admins')
        .update({ is_active: !currentStatus })
        .eq('id', adminId)

      if (error) throw error

      toast.success(`Admin ${!currentStatus ? 'activated' : 'deactivated'}`)
      fetchAdmins()
    } catch (error) {
      console.error('Error updating admin:', error)
      toast.error('Failed to update admin')
    }
  }

  // Delete admin
  const deleteAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to delete this admin?')) return

    try {
      const { error } = await supabase
        .from('admins')
        .delete()
        .eq('id', adminId)

      if (error) throw error

      toast.success('Admin deleted successfully')
      fetchAdmins()
    } catch (error) {
      console.error('Error deleting admin:', error)
      toast.error('Failed to delete admin')
    }
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-yellow-400">Admin Management</CardTitle>
        <CardDescription>Manage admin access to the dashboard</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Admin */}
        <div className="flex gap-4">
          <Input
            placeholder="Enter email address"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="bg-gray-900 border-gray-600"
          />
          <Select value={newRole} onValueChange={setNewRole}>
            <SelectTrigger className="w-40 bg-gray-900 border-gray-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={addAdmin} 
            disabled={loading}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Admin
          </Button>
        </div>

        {/* Admins List */}
        <div className="space-y-2">
          <Button onClick={fetchAdmins} variant="outline" size="sm">
            Refresh List
          </Button>
          
          {admins.map((admin) => (
            <div key={admin.id} className="flex items-center justify-between p-3 bg-gray-900 rounded">
              <div>
                <p className="text-white font-medium">{admin.email}</p>
                <p className="text-gray-400 text-sm">
                  Role: {admin.role} | 
                  Status: {admin.is_active ? 'Active' : 'Inactive'} |
                  Last login: {admin.last_login ? new Date(admin.last_login).toLocaleDateString() : 'Never'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => toggleAdmin(admin.id, admin.is_active)}
                  variant="outline"
                  size="sm"
                >
                  {admin.is_active ? 'Deactivate' : 'Activate'}
                </Button>
                <Button
                  onClick={() => deleteAdmin(admin.id)}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Payment Management Component
export function PaymentManagement() {
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(false)

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          registrants!inner(
            team_name,
            events!inner(name)
          )
        `)
        .order('payment_time', { ascending: false })

      if (error) throw error
      setPayments(data || [])
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast.error('Failed to fetch payments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Records</CardTitle>
        <CardDescription>
          View all payment transactions and their status
        </CardDescription>
        <Button onClick={fetchPayments} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className="w-4 h-4 mr-2" />
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No payment records found</p>
            <p className="text-sm text-gray-400 mt-2">
              Payments will appear here after successful transactions
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium">
                        {(payment.registrants.events as any)?.name || 'Unknown Event'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Team: {payment.registrants.team_name || 'No Team Name'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">₹{payment.paid_amount}</p>
                      <p className="text-xs text-gray-500">{payment.payment_method}</p>
                    </div>
                    <div>
                      <p className="text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${
                          payment.payment_status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : payment.payment_status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {payment.payment_status.toUpperCase()}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(payment.payment_time).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    <p>Payment ID: {payment.razorpay_payment_id}</p>
                    <p>Order ID: {payment.razorpay_order_id}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
