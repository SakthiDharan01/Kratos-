import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * API Route: Process Email Trigger Queue
 * 
 * This endpoint processes pending email triggers from the email_trigger_log table
 * and sends confirmation emails for registrants whose payment status changed to 'paid'.
 * 
 * This can be called:
 * 1. Manually by admins
 * 2. Via a cron job (e.g., Vercel Cron, GitHub Actions)
 * 3. Via Supabase database webhooks
 * 
 * Authentication: Requires admin access or cron secret
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization (either admin user or cron secret)
    const authHeader = request.headers.get('authorization');
    const cronSecret = request.headers.get('x-cron-secret');
    
    // Check if it's a cron job
    const validCronSecret = process.env.CRON_SECRET || 'your-secret-here';
    const isCronJob = cronSecret === validCronSecret;

    if (!isCronJob && !authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - missing authentication' },
        { status: 401 }
      );
    }

    // Create Supabase admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // If not cron job, verify admin access
    if (!isCronJob) {
      const token = authHeader?.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        return NextResponse.json(
          { error: 'Unauthorized - invalid token' },
          { status: 401 }
        );
      }

      // Check if user is admin
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (adminError || !adminData) {
        return NextResponse.json(
          { error: 'Forbidden - admin access required' },
          { status: 403 }
        );
      }
    }

    // Get pending email triggers (not yet sent)
    const { data: pendingTriggers, error: fetchError } = await supabase
      .from('email_trigger_log')
      .select('id, registrant_id')
      .eq('email_sent', false)
      .is('error_message', null)
      .order('created_at', { ascending: true })
      .limit(50); // Process max 50 at a time

    if (fetchError) {
      console.error('Error fetching pending email triggers:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch pending triggers', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!pendingTriggers || pendingTriggers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending email triggers to process',
        processed: 0
      });
    }

    console.log(`Processing ${pendingTriggers.length} pending email triggers...`);

    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[]
    };

    // Process each trigger
    for (const trigger of pendingTriggers) {
      try {
        // Get registrant details
        const { data: registrant, error: regError } = await supabase
          .from('registrants')
          .select(`
            id,
            payment_status,
            razorpay_payment_id,
            user_id,
            users!inner(email, name)
          `)
          .eq('id', trigger.registrant_id)
          .single();

        if (regError || !registrant) {
          console.error(`Registrant ${trigger.registrant_id} not found:`, regError);
          
          // Mark as failed
          await supabase
            .from('email_trigger_log')
            .update({
              error_message: `Registrant not found: ${regError?.message || 'Unknown error'}`
            })
            .eq('id', trigger.id);

          results.failed++;
          results.errors.push({
            triggerId: trigger.id,
            registrantId: trigger.registrant_id,
            error: 'Registrant not found'
          });
          continue;
        }

        // Verify payment status is still 'paid'
        if (registrant.payment_status !== 'paid') {
          console.log(`Registrant ${trigger.registrant_id} payment status is ${registrant.payment_status}, skipping`);
          
          await supabase
            .from('email_trigger_log')
            .update({
              error_message: `Payment status is ${registrant.payment_status}, not paid`
            })
            .eq('id', trigger.id);

          results.failed++;
          continue;
        }

        // Call the email sending API
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        const emailResponse = await fetch(`${siteUrl}/api/send-confirmation-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            registrantId: registrant.id,
            paymentId: registrant.razorpay_payment_id,
            trigger: 'payment_status_update'
          })
        });

        if (emailResponse.ok) {
          // Mark as sent
          await supabase
            .from('email_trigger_log')
            .update({
              email_sent: true
            })
            .eq('id', trigger.id);

          console.log(`✓ Email sent for registrant ${trigger.registrant_id}`);
          results.success++;
        } else {
          const errorText = await emailResponse.text();
          console.error(`Email API failed for registrant ${trigger.registrant_id}:`, errorText);

          await supabase
            .from('email_trigger_log')
            .update({
              error_message: `Email API error: ${errorText}`
            })
            .eq('id', trigger.id);

          results.failed++;
          results.errors.push({
            triggerId: trigger.id,
            registrantId: trigger.registrant_id,
            error: errorText
          });
        }
      } catch (error: any) {
        console.error(`Error processing trigger ${trigger.id}:`, error);
        
        await supabase
          .from('email_trigger_log')
          .update({
            error_message: `Processing error: ${error.message}`
          })
          .eq('id', trigger.id);

        results.failed++;
        results.errors.push({
          triggerId: trigger.id,
          registrantId: trigger.registrant_id,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${pendingTriggers.length} email triggers`,
      results: {
        total: pendingTriggers.length,
        success: results.success,
        failed: results.failed,
        errors: results.errors
      }
    });

  } catch (error: any) {
    console.error('Email trigger processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check pending email triggers count
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { count, error } = await supabase
      .from('email_trigger_log')
      .select('*', { count: 'exact', head: true })
      .eq('email_sent', false)
      .is('error_message', null);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch pending count', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      pendingCount: count || 0,
      message: `${count || 0} pending email triggers`
    });

  } catch (error: any) {
    console.error('Error checking pending triggers:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
