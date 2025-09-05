import { NextRequest, NextResponse } from 'next/server';
import { verifyPaymentSignature } from '@/lib/razorpay';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { 
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      registrant_ids,  // Changed to handle multiple registrants
      amount // Add amount to set paid_amount
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

    // Handle multiple registrant IDs
    const registrantIdsArray = Array.isArray(registrant_ids) ? registrant_ids : [registrant_ids];

    // Get event details for each registrant to set correct paid_amount
    const updatePromises = registrantIdsArray.map(async (registrantId: number) => {
      // First get the event price for this registrant
      const { data: registrant } = await supabase
        .from('registrants')
        .select(`
          event_id,
          events!inner(price)
        `)
        .eq('id', registrantId)
        .single();

      const eventPrice = (registrant?.events as any)?.price || 0;

      // Update the registrant with payment info and correct paid_amount
      return supabase
        .from('registrants')
        .update({
          payment_status: 'paid',
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          payment_time: new Date().toISOString(),
          paid_amount: eventPrice, // Set the actual event price
        })
        .eq('id', registrantId);
    });

    const updateResults = await Promise.all(updatePromises);
    
    // Check for any errors
    const updateErrors = updateResults.filter(result => result.error);
    if (updateErrors.length > 0) {
      console.error('Error updating payment status:', updateErrors);
      return NextResponse.json(
        { error: 'Failed to update payment status' },
        { status: 500 }
      );
    }

    // Create payment records for each registrant
    for (const registrantId of registrantIdsArray) {
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          registrant_id: registrantId,
          payment_status: 'paid',
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          payment_method: 'razorpay',
          payment_time: new Date().toISOString(),
        });

      if (paymentError) {
        console.error('Error creating payment record for registrant', registrantId, ':', paymentError);
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and updated successfully',
      updated_registrants: registrantIdsArray.length
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
