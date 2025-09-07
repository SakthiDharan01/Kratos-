import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a service role client to bypass RLS for admin queries
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// QR Code lookup handler
async function handleQRCodeLookup(qrId: string, type: string | null) {
  console.log('=== QR Code Lookup ===');
  console.log('QR ID:', qrId);
  console.log('Type:', type);
  
  try {
    if (type === 'individual' || !type) {
      // Look up by individual registration ID
      const { data: registrationData, error: regError } = await supabaseAdmin
        .from('registrations')
        .select(`
          id,
          name,
          email,
          phone,
          college,
          department,
          year,
          is_leader,
          team_name,
          event_id,
          leader_id,
          registration_date,
          events!inner(
            id,
            name,
            description,
            price,
            event_type,
            category,
            event_date,
            start_time,
            end_time
          ),
          registrants!inner(
            id,
            team_name,
            payment_status,
            paid_amount,
            payment_time,
            user_id,
            registrations!inner(
              id,
              name,
              email,
              phone,
              college,
              department,
              year,
              is_leader
            )
          )
        `)
        .eq('id', qrId)
        .single();

      if (regError && regError.code !== 'PGRST116') {
        throw regError;
      }

      if (registrationData) {
        // Found individual registration
        const event = (registrationData.events as any);
        const registrant = (registrationData.registrants as any);
        const teamMembers = registrant.registrations || [];

        return NextResponse.json({
          success: true,
          type: 'individual',
          participant: {
            id: registrationData.id,
            name: registrationData.name,
            email: registrationData.email,
            phone: registrationData.phone,
            college: registrationData.college,
            department: registrationData.department,
            year: registrationData.year,
            is_leader: registrationData.is_leader
          },
          event: {
            id: event.id,
            name: event.name,
            description: event.description,
            price: event.price,
            event_type: event.event_type,
            category: event.category,
            event_date: event.event_date,
            start_time: event.start_time,
            end_time: event.end_time
          },
          team: {
            name: registrationData.team_name,
            payment_status: registrant.payment_status,
            paid_amount: registrant.paid_amount,
            payment_time: registrant.payment_time,
            registration_date: registrationData.registration_date,
            members: teamMembers.map((member: any) => ({
              id: member.id,
              name: member.name,
              email: member.email,
              phone: member.phone,
              college: member.college,
              department: member.department,
              year: member.year,
              is_leader: member.is_leader
            }))
          }
        });
      }
    }

    // Look up by team/registrant ID
    console.log('Looking up team by registrant ID:', qrId);
    const { data: teamData, error: teamError } = await supabaseAdmin
      .from('registrants')
      .select(`
        id,
        event_id,
        team_name,
        payment_status,
        paid_amount,
        payment_time,
        registration_date,
        user_id,
        events!inner(
          id,
          name,
          description,
          price,
          event_type,
          category,
          event_date,
          start_time,
          end_time
        ),
        registrations!inner(
          id,
          name,
          email,
          phone,
          college,
          department,
          year,
          is_leader
        )
      `)
      .eq('id', qrId)
      .single();

    console.log('Team lookup result:', { teamData, teamError });

    if (teamError) {
      if (teamError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Registration not found' },
          { status: 404 }
        );
      }
      throw teamError;
    }

    // Found team registration
    const event = (teamData.events as any);
    const teamMembers = teamData.registrations || [];

    return NextResponse.json({
      success: true,
      type: 'team',
      event: {
        id: event.id,
        name: event.name,
        description: event.description,
        price: event.price,
        event_type: event.event_type,
        category: event.category,
        event_date: event.event_date,
        start_time: event.start_time,
        end_time: event.end_time
      },
      team: {
        id: teamData.id,
        name: teamData.team_name,
        payment_status: teamData.payment_status,
        paid_amount: teamData.paid_amount,
        payment_time: teamData.payment_time,
        registration_date: teamData.registration_date,
        members: teamMembers.map((member: any) => ({
          id: member.id,
          name: member.name,
          email: member.email,
          phone: member.phone,
          college: member.college,
          department: member.department,
          year: member.year,
          is_leader: member.is_leader
        }))
      }
    });

  } catch (error) {
    console.error('Error in QR code lookup:', error);
    return NextResponse.json(
      { error: 'Failed to lookup registration' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');
    const registrantId = searchParams.get('registrantId');
    const qrId = searchParams.get('qrId') || searchParams.get('id'); // Accept both qrId and id parameter
    const type = searchParams.get('type'); // 'team' or 'individual'

    if (!userId && !email && !registrantId && !qrId) {
      return NextResponse.json(
        { error: 'Please provide userId, email, registrantId, or qrId parameter' },
        { status: 400 }
      );
    }

    // Handle QR code ID lookup
    if (qrId) {
      console.log('QR lookup requested for ID:', qrId, 'type:', type);
      return await handleQRCodeLookup(qrId, type);
    }

    let query;
    let paramValue;

    if (userId) {
      // Query by user ID - get all registrations for this user
      query = supabaseAdmin
        .from('registrants')
        .select(`
          id,
          event_id,
          team_name,
          payment_status,
          paid_amount,
          payment_time,
          registration_date,
          events!inner(
            id,
            name,
            description,
            price,
            event_type,
            category,
            event_date,
            start_time,
            end_time
          ),
          registrations!inner(
            id,
            name,
            email,
            phone,
            college,
            department,
            year,
            is_leader
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true);
      paramValue = userId;
    } else if (email) {
      // Query by email - get all registrations where this email is a participant
      query = supabaseAdmin
        .from('registrations')
        .select(`
          id,
          name,
          email,
          phone,
          college,
          department,
          year,
          is_leader,
          team_name,
          event_id,
          leader_id,
          registration_date,
          events!inner(
            id,
            name,
            description,
            price,
            event_type,
            category,
            event_date,
            start_time,
            end_time
          ),
          registrants!inner(
            id,
            team_name,
            payment_status,
            paid_amount,
            payment_time,
            registration_date
          )
        `)
        .eq('email', email)
        .eq('is_active', true);
      paramValue = email;
    } else if (registrantId) {
      // Query by registrant ID - get specific registration and all team members
      query = supabaseAdmin
        .from('registrants')
        .select(`
          id,
          event_id,
          team_name,
          payment_status,
          paid_amount,
          payment_time,
          registration_date,
          user_id,
          events!inner(
            id,
            name,
            description,
            price,
            event_type,
            category,
            event_date,
            start_time,
            end_time
          ),
          registrations!inner(
            id,
            name,
            email,
            phone,
            college,
            department,
            year,
            is_leader
          )
        `)
        .eq('id', registrantId)
        .eq('is_active', true);
      paramValue = registrantId;
    }

    const { data, error } = await query as any;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Database query failed' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { 
          message: 'No registrations found',
          query_param: userId ? 'userId' : email ? 'email' : 'registrantId',
          query_value: paramValue,
          data: []
        },
        { status: 200 }
      );
    }

    // Format the response based on query type
    let formattedData;

    if (userId || registrantId) {
      // For userId/registrantId queries, group by registrant (team registration)
      formattedData = data.map((registrant: any) => ({
        registrant_id: registrant.id,
        team_name: registrant.team_name,
        payment_status: registrant.payment_status,
        paid_amount: registrant.paid_amount,
        payment_time: registrant.payment_time,
        registration_date: registrant.registration_date,
        user_id: registrant.user_id,
        event: {
          id: registrant.events.id,
          name: registrant.events.name,
          description: registrant.events.description,
          price: registrant.events.price,
          event_type: registrant.events.event_type,
          category: registrant.events.category,
          event_date: registrant.events.event_date,
          start_time: registrant.events.start_time,
          end_time: registrant.events.end_time
        },
        team_members: registrant.registrations.map((participant: any) => ({
          id: participant.id,
          name: participant.name,
          email: participant.email,
          phone: participant.phone,
          college: participant.college,
          department: participant.department,
          year: participant.year,
          is_leader: participant.is_leader
        }))
      }));
    } else {
      // For email queries, group by participant
      formattedData = data.map((participant: any) => ({
        participant_id: participant.id,
        name: participant.name,
        email: participant.email,
        phone: participant.phone,
        college: participant.college,
        department: participant.department,
        year: participant.year,
        is_leader: participant.is_leader,
        team_name: participant.team_name,
        registration_date: participant.registration_date,
        event: {
          id: participant.events.id,
          name: participant.events.name,
          description: participant.events.description,
          price: participant.events.price,
          event_type: participant.events.event_type,
          category: participant.events.category,
          event_date: participant.events.event_date,
          start_time: participant.events.start_time,
          end_time: participant.events.end_time
        },
        team_registration: {
          registrant_id: participant.registrants.id,
          team_name: participant.registrants.team_name,
          payment_status: participant.registrants.payment_status,
          paid_amount: participant.registrants.paid_amount,
          payment_time: participant.registrants.payment_time,
          registration_date: participant.registrants.registration_date
        }
      }));
    }

    return NextResponse.json({
      success: true,
      query_param: userId ? 'userId' : email ? 'email' : 'registrantId',
      query_value: paramValue,
      total_registrations: formattedData.length,
      data: formattedData
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
