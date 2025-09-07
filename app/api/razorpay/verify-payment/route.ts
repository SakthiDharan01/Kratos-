import { NextRequest, NextResponse } from 'next/server';
import { verifyPaymentSignature } from '@/lib/razorpay';
import { createClient } from '@supabase/supabase-js';

// Create a service role client for payment verification (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { 
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      registrant_ids,  // Changed to handle multiple registrants
      amount // Add amount to set paid_amount
    } = await request.json();

    console.log('Payment verification request:', {
      razorpay_order_id,
      razorpay_payment_id,
      registrant_ids,
      amount
    });

    // Verify payment signature
    const isValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    console.log('Signature verification result:', isValid);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Handle multiple registrant IDs
    const registrantIdsArray = Array.isArray(registrant_ids) ? registrant_ids : [registrant_ids];
    console.log('Processing registrant IDs:', registrantIdsArray);

    // Get event details for each registrant to set correct paid_amount
    const updatePromises = registrantIdsArray.map(async (registrantId: number) => {
      console.log('Processing registrant ID:', registrantId);
      
      // First get the event price for this registrant
      const { data: registrant, error: fetchError } = await supabaseAdmin
        .from('registrants')
        .select(`
          event_id,
          events!inner(price)
        `)
        .eq('id', registrantId)
        .single();

      if (fetchError) {
        console.error('Error fetching registrant:', registrantId, fetchError);
        if (fetchError.code === 'PGRST116') {
          // Registrant doesn't exist
          console.error('Registrant not found:', registrantId);
          throw new Error(`Registrant ${registrantId} not found`);
        }
        throw fetchError;
      }

      const eventPrice = (registrant?.events as any)?.price || 0;
      console.log('Event price for registrant', registrantId, ':', eventPrice);

      // Update the registrant with payment info and correct paid_amount
      const { error: updateError } = await supabaseAdmin
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

      if (updateError) {
        console.error('Error updating registrant:', registrantId, updateError);
        throw updateError;
      }

      console.log('Successfully updated registrant:', registrantId);
      return { success: true, registrantId, eventPrice };
    });

    const updateResults = await Promise.all(updatePromises);
    console.log('All update results:', updateResults);

  // Create payment records for each registrant and send confirmation emails
  const emailPromises: Promise<any>[] = [];
    
    for (const result of updateResults) {
      const { error: paymentError } = await supabaseAdmin
        .from('payments')
        .insert({
          registrant_id: result.registrantId,
          payment_status: 'paid',
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          paid_amount: result.eventPrice, // Add the paid amount
          payment_method: 'razorpay',
          payment_time: new Date().toISOString(),
        });

      if (paymentError) {
        console.error('Error creating payment record for registrant', result.registrantId, ':', paymentError);
        // Don't fail the request, just log the error
      } else {
        console.log('Successfully created payment record for registrant:', result.registrantId);
      }

      // Queue confirmation email (await later)
      emailPromises.push((async () => {
        try {
          console.log('Queueing email send for registrant:', result.registrantId);
          const { sendConfirmationEmail } = await import('../../send-confirmation-email/email-service');
          return await sendConfirmationEmail(result.registrantId, razorpay_payment_id);
        } catch (emailError) {
          console.error('CRITICAL: Email sending failed for registrant', result.registrantId, emailError);
          return { success: false, registrantId: result.registrantId, error: emailError instanceof Error ? emailError.message : 'Unknown error' };
        }
      })());
    }
    // Await all emails to ensure reliability (client can handle slightly longer wait)
    const emailSettled = await Promise.allSettled(emailPromises);
    const emailSummary = emailSettled.map(r => r.status === 'fulfilled' ? r.value : r.reason);
    const emailsSent = emailSummary.filter(r => r && r.success !== false && !r.skipped).length;
    const emailsSkipped = emailSummary.filter(r => r && r.skipped).length;
    const emailsFailed = emailSummary.filter(r => r && r.success === false).length;

    console.log('Payment verification + email sending completed:', { emailsSent, emailsSkipped, emailsFailed });

    return NextResponse.json({
      success: true,
      message: 'Payment verified. Confirmation emails processed.',
      updated_registrants: registrantIdsArray.length,
      results: updateResults,
      email: {
        emailsSent,
        emailsSkipped,
        emailsFailed
      }
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
