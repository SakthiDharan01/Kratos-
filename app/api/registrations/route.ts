import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(req: Request) {
  if (!serviceRoleKey) {
    return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { formData } = body;
    if (!formData || !Array.isArray(formData.events) || formData.events.length === 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    const created: any[] = [];

    for (const event of formData.events) {
      // leader info assumed to be first participant
      const leader = (event.participants || [])[0] || {};

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

      if (regErr || !reg) throw regErr || new Error('Failed to create registration');

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
      if (partErr) throw partErr;

      created.push(reg);
    }

    return NextResponse.json({ success: true, registrations: created });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
