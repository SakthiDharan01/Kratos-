import { NextRequest, NextResponse } from 'next/server';
import { verifyPaymentSignature } from '@/lib/razorpay';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { 
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      registrant_id 
    } = await request.json();

    // Verify payment signature
    const isValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Update registrant payment status
    const { error: updateError } = await supabase
      .from('registrants')
      .update({
        payment_status: 'paid',
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        payment_time: new Date().toISOString(),
      })
      .eq('id', registrant_id);

    if (updateError) {
      console.error('Error updating payment status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update payment status' },
        { status: 500 }
      );
    }

    // Optionally create a payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        registrant_id,
        payment_status: 'paid',
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        payment_method: 'razorpay',
        payment_time: new Date().toISOString(),
      });

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and updated successfully'
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
