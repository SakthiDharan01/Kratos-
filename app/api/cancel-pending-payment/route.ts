import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Create admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { registrantId } = await request.json();
    
    if (!registrantId) {
      return NextResponse.json(
        { error: 'Registrant ID is required' },
        { status: 400 }
      );
    }

    // Get the pending registrant
    const { data: registrant, error: fetchError } = await supabaseAdmin
      .from('registrants')
      .select('id, payment_status, razorpay_order_id')
      .eq('id', registrantId)
      .eq('payment_status', 'pending')
      .single();

    if (fetchError || !registrant) {
      return NextResponse.json(
        { error: 'Pending payment not found' },
        { status: 404 }
      );
    }

    // Update the payment status to failed/cancelled
    const { error: updateError } = await supabaseAdmin
      .from('registrants')
      .update({
        payment_status: 'failed',
        payment_time: new Date().toISOString(),
      })
      .eq('id', registrantId);

    if (updateError) {
      console.error('Error cancelling payment:', updateError);
      return NextResponse.json(
        { error: 'Failed to cancel payment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Payment cancelled successfully' 
    });

  } catch (error) {
    console.error('Error in payment cancellation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}