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

    // Get the pending registrant with order details
    const { data: registrant, error: fetchError } = await supabaseAdmin
      .from('registrants')
      .select(`
        id,
        user_id,
        event_id,
        team_name,
        payment_status,
        razorpay_order_id,
        razorpay_payment_id,
        events(name, price)
      `)
      .eq('id', registrantId)
      .eq('payment_status', 'pending')
      .single();

    if (fetchError || !registrant) {
      return NextResponse.json(
        { error: 'Pending payment not found' },
        { status: 404 }
      );
    }

    // Check if payment was actually completed in Razorpay
    // This would require checking Razorpay API, but for now let's allow manual verification
    
    // Update the payment status to paid
    const { error: updateError } = await supabaseAdmin
      .from('registrants')
      .update({
        payment_status: 'paid',
        payment_time: new Date().toISOString(),
      })
      .eq('id', registrantId);

    if (updateError) {
      console.error('Error updating payment status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update payment status' },
        { status: 500 }
      );
    }

    // Create payment record
    const eventPrice = (registrant.events as any)?.price || 0;
    const { error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        registrant_id: registrant.id,
        payment_status: 'paid',
        razorpay_order_id: registrant.razorpay_order_id,
        razorpay_payment_id: registrant.razorpay_payment_id,
        paid_amount: eventPrice,
        payment_method: 'razorpay',
        payment_time: new Date().toISOString(),
      });

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      // Continue even if payment record creation fails
    }

    // Trigger confirmation email
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/send-confirmation-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrantId: registrant.id,
          paymentId: registrant.razorpay_payment_id
        })
      });
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Payment status updated successfully' 
    });

  } catch (error) {
    console.error('Error in manual payment verification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}