import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Supabase Database Webhook Endpoint
 * 
 * This endpoint is called by Supabase when a new record is inserted into email_trigger_log.
 * It processes the trigger and sends a confirmation email to the user.
 * 
 * Supabase Webhook Configuration:
 * - Table: email_trigger_log
 * - Event: INSERT
 * - URL: https://kratos-nu.vercel.app/api/send-confirmation-email-webhook
 * - Headers: 
 *     Content-Type: application/json
 *     x-webhook-secret: [your-secret]
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const webhookSecret = request.headers.get('x-webhook-secret');
    const expectedSecret = process.env.SUPABASE_WEBHOOK_SECRET || 'your-webhook-secret';
    
    if (webhookSecret !== expectedSecret) {
      console.error('Invalid webhook secret');
      return NextResponse.json(
        { error: 'Unauthorized - invalid webhook secret' },
        { status: 401 }
      );
    }

    // Parse Supabase webhook payload
    const payload = await request.json();
    console.log('Webhook received:', payload);

    // Supabase webhook payload structure:
    // {
    //   type: "INSERT",
    //   table: "email_trigger_log",
    //   record: { id: 1, registrant_id: 123, ... },
    //   schema: "public",
    //   old_record: null
    // }

    const { type, table, record } = payload;

    // Validate payload
    if (type !== 'INSERT' || table !== 'email_trigger_log' || !record) {
      console.error('Invalid webhook payload:', payload);
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      );
    }

    const { id: logId, registrant_id: registrantId } = record;

    if (!registrantId) {
      console.error('Missing registrant_id in webhook payload');
      return NextResponse.json(
        { error: 'Missing registrant_id' },
        { status: 400 }
      );
    }

    console.log(`Processing email trigger log ID ${logId} for registrant ${registrantId}`);

    // Create Supabase admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get registrant details with payment info
    const { data: registrant, error: regError } = await supabase
      .from('registrants')
      .select(`
        id,
        payment_status,
        razorpay_payment_id,
        user_id,
        users!inner(email, name)
      `)
      .eq('id', registrantId)
      .single();

    if (regError || !registrant) {
      console.error(`Registrant ${registrantId} not found:`, regError);
      
      // Update log with error
      await supabase
        .from('email_trigger_log')
        .update({
          error_message: `Registrant not found: ${regError?.message || 'Unknown error'}`
        })
        .eq('id', logId);

      return NextResponse.json(
        { error: 'Registrant not found', details: regError?.message },
        { status: 404 }
      );
    }

    // Verify payment status is 'paid'
    if (registrant.payment_status !== 'paid') {
      console.log(`Registrant ${registrantId} payment status is ${registrant.payment_status}, not paid`);
      
      await supabase
        .from('email_trigger_log')
        .update({
          error_message: `Payment status is ${registrant.payment_status}, expected 'paid'`
        })
        .eq('id', logId);

      return NextResponse.json({
        success: false,
        message: `Payment status is ${registrant.payment_status}, email not sent`
      });
    }

    // Send the confirmation email
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    console.log(`Sending email for registrant ${registrantId}...`);
    
    const emailResponse = await fetch(`${siteUrl}/api/send-confirmation-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        registrantId: registrant.id,
        paymentId: registrant.razorpay_payment_id,
        trigger: 'webhook_payment_status_update'
      })
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error(`Email API failed for registrant ${registrantId}:`, errorText);

      // Update log with error
      await supabase
        .from('email_trigger_log')
        .update({
          error_message: `Email API error: ${errorText}`
        })
        .eq('id', logId);

      return NextResponse.json(
        { error: 'Failed to send email', details: errorText },
        { status: 500 }
      );
    }

    const emailResult = await emailResponse.json();
    console.log(`✓ Email sent successfully for registrant ${registrantId}`);

    // Update log to mark email as sent
    await supabase
      .from('email_trigger_log')
      .update({
        email_sent: true
      })
      .eq('id', logId);

    return NextResponse.json({
      success: true,
      message: 'Confirmation email sent successfully',
      registrantId: registrant.id,
      logId: logId,
      emailResult
    });

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for webhook health check
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Supabase webhook endpoint is active',
    endpoint: '/api/send-confirmation-email-webhook'
  });
}
