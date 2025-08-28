// Supabase Edge Function: register
// Handles atomic creation of a registration + registrants for one event
// Invoke from frontend with the logged-in user's auth token.

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

interface RegistrantInput {
  name: string
  email: string
  phone: string
  college: string
  department: string
  year: string
  is_leader?: boolean
}

interface Payload {
  event_id: string
  team_name: string
  leader_phone: string
  registrants: RegistrantInput[]
}

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userErr } = await supabase.auth.getUser(token)
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Invalid auth token' }), { status: 401 })
    }

    const body: Payload = await req.json()
    if (!body.event_id || !body.team_name || !body.registrants?.length) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 })
    }

    // Ensure first registrant is leader
    const registrants = body.registrants.map((r, idx) => ({ ...r, is_leader: idx === 0 }))

    // Basic validation
    const emails = new Set<string>()
    for (const r of registrants) {
      if (emails.has(r.email)) {
        return new Response(JSON.stringify({ error: 'Duplicate participant email' }), { status: 400 })
      }
      emails.add(r.email)
    }

    // Insert registration
    const leader = registrants[0]
    const { data: reg, error: regErr } = await supabase
      .from('registrations')
      .insert({
        event_id: body.event_id,
        team_name: body.team_name,
        leader_id: user.id,
        leader_name: leader.name,
        leader_email: leader.email,
        leader_phone: body.leader_phone || leader.phone,
        status: 'pending'
      })
      .select()
      .single()

    if (regErr || !reg) {
      return new Response(JSON.stringify({ error: regErr?.message || 'Failed to create registration' }), { status: 400 })
    }

    // Insert registrants
    const registrantRows = registrants.map(r => ({
      registration_id: reg.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      college: r.college,
      department: r.department,
      year: r.year,
      is_leader: r.is_leader || false
    }))

    const { error: regPartErr } = await supabase.from('registrants').insert(registrantRows)
    if (regPartErr) {
      return new Response(JSON.stringify({ error: regPartErr.message }), { status: 400 })
    }

    return new Response(JSON.stringify({ registration_id: reg.id }), { status: 201 })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Server error' }), { status: 500 })
  }
})
