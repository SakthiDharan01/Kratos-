import { supabase } from './supabase'
import { Event } from './store'

// Fetch events with new schema fields. Optionally filter by category.
export async function fetchEvents(category?: string): Promise<Event[]> {
  let query = supabase
    .from('events')
    .select(
      [
        'id',
        'name',
        'description',
        'rules',
        'price',
        'min_team_size',
        'max_team_size',
        'category',
        'event_type',
        'status',
        'participant_limit',
        'current_registrations',
        'event_date',
        'time_slot',
        'venue',
        'rounds',
        'incharge_name1',
        'incharge_phone1',
        'incharge_name2',
        'incharge_phone2'
      ].join(',')
    )
    .order('created_at', { ascending: true })

  if (category) query = query.ilike('category', category)
  const { data, error } = await query
  if (error) throw error
  return (data as unknown as Event[]) || []
}
