import { supabase } from './supabase'
import { Event } from './store'

// Fetch events with optimized fields for faster loading
export async function fetchEvents(category?: string): Promise<Event[]> {
  let query = supabase
    .from('events')
    .select(`
      id,
      name,
      description,
      price,
      min_team_size,
      max_team_size,
      category,
      event_type,
      event_date,
      time_slot,
      venue,
      incharge_name1,
      incharge_phone1,
      incharge_name2,
      incharge_phone2
    `)
    .eq('status', 'active')
    .order('event_date', { ascending: true })

  if (category) {
    query = query.eq('category', category)
  }
  
  const { data, error } = await query
  if (error) {
    console.error('Error fetching events:', error)
    throw error
  }
  return (data as unknown as Event[]) || []
}
