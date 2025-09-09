import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Registration API received:', body);

    const { event_id, team_name, participants, user_id, payment_status = 'pending' } = body;

    // Validate required fields
    if (!event_id || !team_name || !participants || !user_id) {
      return NextResponse.json(
        { error: 'Missing required fields: event_id, team_name, participants, user_id' },
        { status: 400 }
      );
    }

    if (!Array.isArray(participants) || participants.length === 0) {
      return NextResponse.json(
        { error: 'Participants must be a non-empty array' },
        { status: 400 }
      );
    }

    // Get authorization header from request
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header missing' },
        { status: 401 }
      );
    }

    // Create Supabase client with service role key for server operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Start a transaction-like operation
    // 1. Create the registrant (team/payment record)
    const { data: registrant, error: registrantError } = await supabase
      .from('registrants')
      .insert({
        user_id,
        event_id: parseInt(event_id),
        team_name,
        payment_status,
        registration_date: new Date().toISOString(),
        payment_time: payment_status === 'paid' ? new Date().toISOString() : null
      })
      .select('id')
      .single();

    if (registrantError) {
      console.error('Registrant creation error:', registrantError);
      return NextResponse.json(
        { error: 'Failed to create team registration', details: registrantError.message },
        { status: 500 }
      );
    }

    console.log('Created registrant:', registrant);

    // 2. Create individual participant records
    const participantRecords = participants.map((participant: any) => ({
      leader_id: registrant.id,
      name: participant.name,
      email: participant.email,
      phone: participant.phone,
      college: participant.college,
      department: participant.department,
      year: participant.year,
      is_leader: participant.is_leader || false,
      event_id: parseInt(event_id),
      team_name: team_name
    }));

    const { data: registrations, error: registrationError } = await supabase
      .from('registrations')
      .insert(participantRecords)
      .select('*');

    if (registrationError) {
      console.error('Registration creation error:', registrationError);
      
      // Rollback: delete the registrant if participant creation fails
      await supabase.from('registrants').delete().eq('id', registrant.id);
      
      return NextResponse.json(
        { error: 'Failed to create participant registrations', details: registrationError.message },
        { status: 500 }
      );
    }

    console.log('Created registrations:', registrations);

    return NextResponse.json({
      success: true,
      registrant_id: registrant.id,
      registrations: registrations,
      message: `Successfully registered team "${team_name}" with ${participants.length} participants`
    }, { status: 201 });

  } catch (error: any) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');
  const eventId = searchParams.get('event_id');

  try {
    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let query = supabase
      .from('registrants')
      .select(`
        id,
        team_name,
        payment_status,
        paid_amount,
        registration_date,
        payment_time,
        razorpay_payment_id,
        razorpay_order_id,
        events(id, name, price),
        registrations(name, email, phone, college, department, year, is_leader)
      `);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (eventId) {
      query = query.eq('event_id', parseInt(eventId));
    }

    const { data, error } = await query.order('registration_date', { ascending: false });

    if (error) {
      console.error('Registration fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch registrations', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      registrations: data
    });

  } catch (error: any) {
    console.error('Registration GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
