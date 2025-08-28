import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!serviceRoleKey) {
    return res.status(500).json({ error: 'Service role key not configured' });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });

  try {
    const body = req.body;
    const { formData } = body;
    if (!formData || !Array.isArray(formData.events) || formData.events.length === 0) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const created: any[] = [];
    const errors: any[] = [];

    for (const event of formData.events) {
      if (!event || !event.eventId || !event.teamName) {
        errors.push({ eventId: event?.eventId || null, error: 'Missing eventId or teamName' });
        continue;
      }
      if (!Array.isArray(event.participants) || event.participants.length === 0) {
        errors.push({ eventId: event.eventId, error: 'No participants provided' });
        continue;
      }

      const leader = event.participants[0] || {};
      if (!leader.name || !leader.email || !leader.phone) {
        errors.push({ eventId: event.eventId, error: 'Leader missing required fields (name/email/phone)' });
        continue;
      }

      const { data: reg, error: regErr } = await supabase
        .from('registrations')
        .insert({
          event_id: event.eventId,
          team_name: event.teamName,
          leader_id: formData.userId,
          leader_name: leader.name,
          leader_email: leader.email,
          leader_phone: leader.phone,
          status: 'pending',
        })
        .select()
        .single();

      if (regErr || !reg) {
        errors.push({ eventId: event.eventId, error: regErr?.message || 'Failed to create registration' });
        continue;
      }

      const registrants = (event.participants || []).map((p: any, i: number) => ({
        registration_id: reg.id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        college: p.college,
        department: p.department,
        year: p.year,
        is_leader: i === 0,
      }));

      const { error: partErr } = await supabase.from('registrants').insert(registrants);
      if (partErr) {
        try {
          await supabase.from('registrations').delete().eq('id', reg.id);
        } catch (delErr) {
          // ignore
        }
        errors.push({ eventId: event.eventId, error: partErr.message || 'Failed to insert registrants' });
        continue;
      }

      created.push(reg);
    }

    return res.status(200).json({ success: true, registrations: created, errors });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
}
