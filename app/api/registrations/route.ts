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

    // Check for existing registrant with same event_id and team_name
    const { data: existingRegistrant, error: checkError } = await supabase
      .from('registrants')
      .select('id, payment_status')
      .eq('event_id', parseInt(event_id))
      .eq('team_name', team_name)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking existing registrant:', checkError);
      return NextResponse.json(
        { error: 'Failed to check existing registration', details: checkError.message },
        { status: 500 }
      );
    }

    // If there's an existing registrant with failed/pending payment, clean it up
    if (existingRegistrant && 
        (existingRegistrant.payment_status === 'failed' || 
         existingRegistrant.payment_status === 'pending')) {
      
      console.log(`Cleaning up existing ${existingRegistrant.payment_status} registrant:`, existingRegistrant.id);
      
      // Delete related registrations first (due to foreign key)
      const { error: deleteRegistrationsError } = await supabase
        .from('registrations')
        .delete()
        .eq('leader_id', existingRegistrant.id);

      if (deleteRegistrationsError) {
        console.error('Failed to delete related registrations:', deleteRegistrationsError);
        return NextResponse.json(
          { error: 'Failed to cleanup existing registration data', details: deleteRegistrationsError.message },
          { status: 500 }
        );
      }

      // Delete the registrant record
      const { error: deleteRegistrantError } = await supabase
        .from('registrants')
        .delete()
        .eq('id', existingRegistrant.id);

      if (deleteRegistrantError) {
        console.error('Failed to delete existing registrant:', deleteRegistrantError);
        return NextResponse.json(
          { error: 'Failed to cleanup existing registrant', details: deleteRegistrantError.message },
          { status: 500 }
        );
      }

      console.log('Successfully cleaned up existing registrant');
    } else if (existingRegistrant && existingRegistrant.payment_status === 'paid') {
      // If there's already a paid registration, don't allow duplicate
      return NextResponse.json(
        { error: `Team "${team_name}" is already registered for this event with completed payment` },
        { status: 409 }
      );
    }

    // Start a transaction-like operation
    // 1. Create the registrant (team/payment record)
    const { data: registrant, error: registrantError } = await supabase
      .from('registrants')
      .insert({
        user_id,
        event_id: parseInt(event_id),
        team_name,
        team_size: participants.length,
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
      state: participant.state,
      location: participant.location,
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
        registrations(name, email, phone, college, department, year, state, location, is_leader)
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
