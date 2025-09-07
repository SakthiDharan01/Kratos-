import { NextRequest, NextResponse } from 'next/server';
import { verifyPaymentSignature } from '@/lib/razorpay';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing webhook signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);
    console.log('Razorpay webhook event:', event.event);

    // Handle payment.captured event
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;
      const paymentId = payment.id;
      const amount = payment.amount; // Amount in paise

      console.log('Payment captured:', { orderId, paymentId, amount });

      // Find registrants by order ID and update payment status
      const { data: registrants, error: fetchError } = await supabase
        .from('registrants')
        .select('id, payment_status')
        .eq('razorpay_order_id', orderId);

      if (fetchError) {
        console.error('Error fetching registrants by order ID:', fetchError);
        return NextResponse.json(
          { error: 'Database error' },
          { status: 500 }
        );
      }

      if (registrants && registrants.length > 0) {
        // Get event details for each registrant to set correct paid_amount
        const { data: registrantsWithEvents, error: eventFetchError } = await supabase
          .from('registrants')
          .select(`
            id,
            event_id,
            events!inner(price)
          `)
          .eq('razorpay_order_id', orderId);

        if (eventFetchError) {
          console.error('Error fetching registrants with event details:', eventFetchError);
          return NextResponse.json(
            { error: 'Database error' },
            { status: 500 }
          );
        }

        // Update all registrants for this order
        const { error: updateError } = await supabase
          .from('registrants')
          .update({
            payment_status: 'paid',
            razorpay_payment_id: paymentId,
            payment_time: new Date().toISOString(),
            webhook_verified: true, // Mark as webhook verified
          })
          .eq('razorpay_order_id', orderId);

        if (updateError) {
          console.error('Error updating payment status via webhook:', updateError);
          return NextResponse.json(
            { error: 'Failed to update payment status' },
            { status: 500 }
          );
        }

        // Create payment records in payments table and trigger emails
        const emailPromises = [];
        
        if (registrantsWithEvents) {
          for (const registrant of registrantsWithEvents) {
            const eventPrice = (registrant.events as any)?.price || 0;
            
            const { error: paymentError } = await supabase
              .from('payments')
              .insert({
                registrant_id: registrant.id,
                payment_status: 'paid',
                razorpay_order_id: orderId,
                razorpay_payment_id: paymentId,
                paid_amount: eventPrice,
                payment_method: 'razorpay',
                payment_time: new Date().toISOString(),
              });

            if (paymentError) {
              console.error('Error creating payment record via webhook for registrant', registrant.id, ':', paymentError);
              // Don't fail the request, just log the error
            } else {
              console.log('Successfully created payment record via webhook for registrant:', registrant.id);
            }

            // Trigger confirmation email sending (async, don't wait)
            emailPromises.push(
              fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/send-confirmation-email`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  registrantId: registrant.id,
                  paymentId: paymentId
                })
              }).catch(emailError => {
                console.error('Error triggering email via webhook for registrant', registrant.id, ':', emailError);
                // Don't fail the main request
              })
            );
          }
        }

        // Start email sending process (don't wait for completion)
        Promise.allSettled(emailPromises).then(emailResults => {
          console.log('Webhook email sending completed:', emailResults.length, 'emails processed');
        }).catch(error => {
          console.error('Error in webhook email sending process:', error);
        });

        console.log(`Updated ${registrants.length} registrants for order ${orderId}`);
      }
    }

    // Handle payment.failed event
    if (event.event === 'payment.failed') {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;
      const paymentId = payment.id;

      console.log('Payment failed:', { orderId, paymentId });

      // Update registrants to failed status
      const { error: updateError } = await supabase
        .from('registrants')
        .update({
          payment_status: 'failed',
          razorpay_payment_id: paymentId,
          webhook_verified: true,
        })
        .eq('razorpay_order_id', orderId);

      if (updateError) {
        console.error('Error updating failed payment status:', updateError);
      }
    }

    return NextResponse.json({ status: 'ok' });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
