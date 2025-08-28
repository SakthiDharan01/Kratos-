import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(req: Request) {
  if (!serviceRoleKey) {
    return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });

  try {
    const body = await req.json();
    const { formData } = body;
    if (!formData || !Array.isArray(formData.events) || formData.events.length === 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const created: any[] = [];
    const errors: any[] = [];

    for (const event of formData.events) {
      // Basic validation per event
      if (!event || !event.eventId || !event.teamName) {
        errors.push({ eventId: event?.eventId || null, error: 'Missing eventId or teamName' });
        continue;
      }
      if (!Array.isArray(event.participants) || event.participants.length === 0) {
        errors.push({ eventId: event.eventId, error: 'No participants provided' });
        continue;
      }

      // leader info assumed to be first participant
      const leader = event.participants[0] || {};
      if (!leader.name || !leader.email || !leader.phone) {
        errors.push({ eventId: event.eventId, error: 'Leader missing required fields (name/email/phone)' });
        continue;
      }

      // Create registration row
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
        // Compensating delete: remove registration if registrants insertion failed
        try {
          await supabase.from('registrations').delete().eq('id', reg.id);
        } catch (delErr) {
          // ignore deletion error, report both
        }
        errors.push({ eventId: event.eventId, error: partErr.message || 'Failed to insert registrants' });
        continue;
      }

      created.push(reg);
    }

    return NextResponse.json({ success: true, registrations: created, errors }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
