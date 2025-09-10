import { supabase } from './supabase'
import { Event } from './store'

// Fetch events with optimized fields for faster loading
export async function fetchEvents(category?: string): Promise<Event[]> {
  try {
    let query = supabase
      .from('events')
      .select(`
        id,
        name,
        description,
        rules,
        price,
        min_team_size,
        max_team_size,
        category,
        event_type,
        status,
        participant_limit,
        current_registrations,
        event_date,
        time_slot,
        venue,
        rounds,
        incharge_name1,
        incharge_phone1,
        incharge_name2,
        incharge_phone2
      `)
      .order('event_date', { ascending: true })

    if (category) {
      query = query.eq('category', category)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching events:', error)
      throw new Error(`Failed to fetch events: ${error.message}`)
    }
    
    console.log('Fetched events:', data?.length || 0, 'events for category:', category || 'all')
    
    if (!data || data.length === 0) {
      console.warn('No events found for category:', category || 'all')
      return []
    }
    
    return data as Event[]
    
  } catch (error) {
    console.error('Unexpected error in fetchEvents:', error)
    throw error
  }
}
