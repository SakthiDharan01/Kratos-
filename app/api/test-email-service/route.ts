import { NextRequest, NextResponse } from 'next/server';
import { sendConfirmationEmail } from '../send-confirmation-email/email-service';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(req: NextRequest) {
  try {
    console.log('=== TEST EMAIL SERVICE ENDPOINT CALLED ===');
    
    // First, let's check what registrants exist
    console.log('Checking available registrants...');
    const { data: registrants, error: registrantsError } = await supabaseAdmin
      .from('registrants')
      .select('id, team_name, payment_status, paid_amount, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (registrantsError) {
      console.error('Error fetching registrants:', registrantsError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch registrants',
        details: registrantsError
      }, { status: 500 });
    }
    
    console.log('Available registrants:', registrants);
    
    // Find a paid registrant to test with
    const paidRegistrant = registrants?.find(r => r.payment_status === 'paid');
    
    if (!paidRegistrant) {
      return NextResponse.json({
        success: false,
        message: 'No paid registrants found for testing',
        availableRegistrants: registrants
      });
    }
    
    console.log('Using paid registrant for test:', paidRegistrant);
    
    const testPaymentId = 'test_payment_' + Date.now();
    
    console.log('Testing with:', { 
      registrantId: paidRegistrant.id, 
      testPaymentId 
    });
    
    const result = await sendConfirmationEmail(paidRegistrant.id, testPaymentId);
    
    console.log('Email service result:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Email test completed',
      testData: {
        registrantId: paidRegistrant.id,
        teamName: paidRegistrant.team_name,
        paymentId: testPaymentId
      },
      result
    });
    
  } catch (error) {
    console.error('Email test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

// Also export POST for consistency
export async function POST(req: NextRequest) {
  return GET(req);
}
