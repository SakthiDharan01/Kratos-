import { supabase } from './supabase'

/**
 * Add a user as admin by their user ID
 * @param userId - The user ID from auth.users table
 * @param email - The user's email
 * @param role - 'admin' or 'super_admin'
 */
export async function addAdmin(userId: string, email: string, role: 'admin' | 'super_admin' = 'admin') {
  try {
    const { data, error } = await supabase
      .from('admins')
      .insert([{
        user_id: userId,
        email: email,
        role: role,
        is_active: true,
        created_by: (await supabase.auth.getUser()).data.user?.id
      }])
      .select()
      .single()

    if (error) {
      console.error('Error adding admin:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error adding admin:', error)
    return { success: false, error: 'Failed to add admin' }
  }
}

/**
 * Remove admin access for a user
 * @param userId - The user ID to remove admin access from
 */
export async function removeAdmin(userId: string) {
  try {
    const { error } = await supabase
      .from('admins')
      .update({ is_active: false })
      .eq('user_id', userId)

    if (error) {
      console.error('Error removing admin:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error removing admin:', error)
    return { success: false, error: 'Failed to remove admin' }
  }
}

/**
 * Check if a user is admin
 * @param userId - The user ID to check
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    return !error && !!data
  } catch (error) {
    return false
  }
}

/**
 * Get all active admins (for super admins only)
 */
export async function getAllAdmins() {
  try {
    const { data, error } = await supabase
      .from('admins')
      .select(`
        id,
        user_id,
        email,
        role,
        is_active,
        created_at
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching admins:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error fetching admins:', error)
    return { success: false, error: 'Failed to fetch admins' }
  }
}
