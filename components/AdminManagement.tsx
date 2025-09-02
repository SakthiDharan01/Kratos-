'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'

interface Admin {
  id: string
  email: string
  role: string
  is_active: boolean
  created_at: string
  last_login: string | null
}

export function AdminManagement() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState('admin')
  const [loading, setLoading] = useState(false)

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
