import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Create Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface EmailData {
  email: string;
  name: string;
  teamName: string;
  eventName: string;
  paymentId: string;
  amount: number;
  eventIncharge: {
    name1: string;
    phone1: string;
    name2: string;
    phone2: string;
  };
  teamMembers: Array<{
    name: string;
    email: string;
    college: string;
    department: string;
    year: string;
    is_leader: boolean;
  }>;
}

// Create SMTP transporter
function createTransporter() {
  console.log('Creating SMTP transporter...');
  console.log('SMTP settings:', {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER ? 'SET' : 'MISSING',
    pass: process.env.SMTP_PASS ? 'SET' : 'MISSING'
  });

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS in environment variables.');
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Proactive verification (won't throw build-time if remote blocks but gives early signal)
  transporter.verify().then(() => {
    console.log('SMTP transporter verified OK');
  }).catch(err => {
    console.error('SMTP transporter verification failed (will retry on send):', err?.message);
  });

  return transporter;
}

// Send email using SMTP
async function sendRegistrationEmail(emailData: EmailData, qrUrl: string) {
  console.log('=== SENDING INDIVIDUAL EMAIL ===');
  console.log('Email recipient:', emailData.email);
  console.log('QR URL:', qrUrl);
  
  console.log('Creating SMTP transporter...');
  const transporter = createTransporter();
  console.log('Transporter created successfully');
  
  console.log('Generating email content...');
  const htmlContent = generateEmailHTML(emailData, qrUrl);
  const textContent = generateEmailText(emailData);
  
  console.log('Email content generated:', {
    htmlLength: htmlContent.length,
    textLength: textContent.length
  });

  const mailOptions = {
    from: `"KRATOS 2K25" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: emailData.email,
    subject: `🎉 Registration Confirmed - KRATOS 2K25 | ${emailData.eventName}`,
    html: htmlContent,
    text: textContent,
  };

  console.log('Mail options prepared:', {
    from: mailOptions.from,
    to: mailOptions.to,
    subject: mailOptions.subject
  });

  console.log('Attempting to send email via SMTP...');
  const result = await transporter.sendMail(mailOptions);
  console.log('Email sent successfully:', {
    messageId: result.messageId,
    response: result.response
  });

  return result;
}

export async function sendConfirmationEmail(registrantId: number, paymentId: string) {
  console.log('=== EMAIL SERVICE CALLED ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Payload:', { registrantId, paymentId });

  try {
    console.log('Step 1: Fetching registrant data from Supabase...');
    
    // Fetch complete registration data with team members and event details
    const { data: registrantData, error: registrantError } = await supabaseAdmin
      .from('registrants')
      .select(`
        id,
        team_name,
        payment_status,
        paid_amount,
        razorpay_payment_id,
        payment_time,
        user_id,
        events (
          id,
          name,
          description,
          price,
          event_date,
          time_slot,
          venue,
          incharge_name1,
          incharge_phone1,
          incharge_name2,
          incharge_phone2
        ),
        registrations (
          id,
          name,
          email,
          phone,
          college,
          department,
          year,
          state,
          location,
          is_leader
        )
      `)
      .eq('id', registrantId)
      .eq('payment_status', 'paid')
      .single();

    console.log('Step 2: Supabase query result:', {
      hasData: !!registrantData,
      hasError: !!registrantError,
      error: registrantError?.message
    });

    if (registrantError || !registrantData) {
      console.error('Error fetching registrant data:', registrantError);
      throw new Error(`Registration not found or not paid: ${registrantError?.message}`);
    }

    console.log('Step 3: Processing registrant data...');
    const teamMembers = registrantData.registrations || [];
    const event = (registrantData.events as any);
    
    console.log('Step 4: Data validation:', {
      teamMembersCount: teamMembers.length,
      hasEvent: !!event,
      eventName: event?.name
    });
    
    if (!event) {
      throw new Error('Event information not found');
    }

    console.log('Step 5: Idempotency check (email_logs)...');

    // Idempotency: avoid duplicate emails for same payment
    try {
      const { data: existingLog, error: existingLogError } = await supabaseAdmin
        .from('email_logs')
        .select('id')
        .eq('registrant_id', registrantId)
        .eq('payment_id', paymentId)
        .limit(1)
        .maybeSingle();

      if (existingLogError) {
        console.warn('Existing log lookup warning (non-fatal):', existingLogError.message);
      }

      if (existingLog) {
        console.log('Email already sent previously for this registrant/payment. Skipping send.');
        return { success: true, message: 'Email previously sent (idempotent skip)', skipped: true };
      }
    } catch (idErr) {
      console.warn('Idempotency check failed (continuing):', idErr instanceof Error ? idErr.message : idErr);
    }

    console.log('Step 6: Preparing to send emails...');

    // Generate QR URL for team verification
    const qrUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://kratos-nu.vercel.app'}/qr?id=${registrantData.id}`;

  // Send email to all team members (sequential to reduce SMTP throttling risk)
    const emailResults = [];
    const failedEmails = [];

    for (const member of teamMembers) {
      try {
        const emailData: EmailData = {
          email: member.email,
          name: member.name,
          teamName: registrantData.team_name,
          eventName: event.name,
          paymentId: registrantData.razorpay_payment_id || registrantData.id,
          amount: registrantData.paid_amount || event.price,
          eventIncharge: {
            name1: event.incharge_name1,
            phone1: event.incharge_phone1,
            name2: event.incharge_name2,
            phone2: event.incharge_phone2
          },
          teamMembers: teamMembers
        };

        const emailResult = await sendRegistrationEmail(emailData, qrUrl);
        
        emailResults.push({
          email: member.email,
          name: member.name,
          success: true,
          messageId: emailResult.messageId
        });

        console.log(`Email sent successfully to ${member.email} (${member.name})`);

      } catch (error) {
        console.error(`Failed to send email to ${member.email}:`, error);
        failedEmails.push({
          email: member.email,
          name: member.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Log email sending attempts
  console.log('Step 12: Logging to database...');
    console.log('Database log data:', {
      registrant_id: registrantId,
      payment_id: paymentId,
      emails_sent: emailResults.length,
      emails_failed: failedEmails.length,
      recipients: teamMembers.map(m => m.email)
    });
    
    try {
      const { data: logData, error: logError } = await supabaseAdmin
        .from('email_logs')
        .insert({
          registrant_id: registrantId,
          payment_id: paymentId,
          emails_sent: emailResults.length,
          emails_failed: failedEmails.length,
          recipients: teamMembers.map(m => m.email),
          sent_at: new Date().toISOString()
        })
        .select();
        
      if (logError) {
        console.error('Database logging error:', logError);
      } else {
        console.log('Database logging successful:', logData);
      }
    } catch (logError) {
      console.error('Failed to log email sending:', logError);
    }

    return {
      success: true,
      message: 'Email sending process completed',
      results: {
        totalMembers: teamMembers.length,
        emailsSent: emailResults.length,
        emailsFailed: failedEmails.length,
        successfulEmails: emailResults,
        failedEmails: failedEmails
      }
    };

  } catch (error) {
    console.error('Unexpected error in email service:', error);
    throw error;
  }
}

function generateEmailHTML(data: EmailData, qrUrl: string): string {
  const { name, teamName, eventName, paymentId, amount, teamMembers, eventIncharge } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KRATOS 2K25 Registration Confirmed</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <!-- Kratos Logo -->
        <img src="https://kratos-nu.vercel.app/assets/name.png" alt="KRATOS" style="max-width: 200px; height: auto; margin-bottom: 20px;">
        <h1 style="font-size: 2.5em; margin-bottom: 10px; color: #FFD700;">KRATOS 2K25</h1>
        <p style="font-size: 1.2em; color: #FFD700;">Technical Symposium</p>
        <p style="font-size: 1em; color: #ccc;">Easwari Engineering College</p>
    </div>

    <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
            <h2 style="margin-bottom: 10px;">✅ Registration Confirmed!</h2>
            <p>Your registration for <strong>${eventName}</strong> has been successfully processed</p>
        </div>

        <p style="font-size: 1.2em; margin-bottom: 20px;">Dear <strong>${name}</strong>,</p>
        <p style="margin-bottom: 25px;">
            Congratulations! Your team <strong>"${teamName}"</strong> has been successfully registered for 
            <strong>${eventName}</strong> at KRATOS 2K25.
        </p>

        <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 25px; margin: 25px 0;">
            <h3 style="color: #FFD700; margin-bottom: 20px;">📋 Registration Details</h3>
            <p><strong>Payment ID:</strong> ${paymentId}</p>
            <p><strong>Amount Paid:</strong> <span style="color: #28a745; font-weight: bold;">₹${amount}</span></p>
            <p><strong>Event:</strong> ${eventName}</p>
            <p><strong>Team Name:</strong> ${teamName}</p>
            <p><strong>Registration Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
        </div>

        <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 25px; margin: 25px 0;">
            <h3 style="color: #FFD700; margin-bottom: 20px;">👥 Team Members (${teamMembers.length})</h3>
            ${teamMembers.map(member => `
              <div style="margin-bottom: 15px; padding: 10px; background: white; border-radius: 5px; border-left: 4px solid ${member.is_leader ? '#FFD700' : '#28a745'};">
                <strong>${member.name}</strong> ${member.is_leader ? '<span style="color: #FFD700;">(TEAM LEADER)</span>' : ''}
                <br><small>📧 ${member.email} | 🏫 ${member.college}</small>
                <br><small>📚 ${member.department} | 📅 ${member.year}</small>
              </div>
            `).join('')}
        </div>

        <!-- QR Code Section -->
        <div style="background: #000; color: white; padding: 25px; border-radius: 8px; text-align: center; margin: 25px 0;">
            <h3 style="color: #FFD700; margin-bottom: 15px;">📱 Event Entry QR Code</h3>
            <p style="margin-bottom: 20px;">Show this QR code at the event venue for entry verification</p>
            <div style="background: white; padding: 20px; border-radius: 8px; display: inline-block;">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}" 
                     alt="Event Entry QR Code" 
                     style="width: 200px; height: 200px; display: block;">
            </div>
            <p style="margin-top: 15px; font-size: 0.9em; color: #ccc;">Keep this QR code ready on your mobile device</p>
        </div>

        <div style="text-align: center; padding: 25px; background: #f8f9fa; border-radius: 8px;">
            <h4 style="margin-bottom: 15px; color: #FFD700;">Event Contact Information</h4>
            <p><strong>Event Incharge:</strong> ${eventIncharge.name1}</p>
            <p><strong>Phone:</strong> +91 ${eventIncharge.phone1}</p>
            ${eventIncharge.name2 ? `<p><strong>Co-Incharge:</strong> ${eventIncharge.name2}</p>` : ''}
            ${eventIncharge.phone2 ? `<p><strong>Phone:</strong> +91 ${eventIncharge.phone2}</p>` : ''}
            <p><strong>General Email:</strong> updates.kratos@gmail.com</p>
            <p><strong>Venue:</strong> Easwari Engineering College, Chennai</p>
        </div>
    </div>

    <div style="background: #212529; color: white; padding: 30px; text-align: center; border-radius: 0 0 10px 10px;">
        <img src="https://kratos-nu.vercel.app/assets/Badge.png" alt="KRATOS Badge" style="max-width: 80px; height: auto; margin-bottom: 15px;">
        <h3 style="color: #FFD700;">🏆 KRATOS 2K25</h3>
        <p>Technical Symposium - Easwari Engineering College</p>
        <p>Chennai, Tamil Nadu</p>
        <p style="font-size: 0.9em; color: #888;">© 2025 KRATOS. All rights reserved.</p>
    </div>
</body>
</html>
  `;
}

function generateEmailText(data: EmailData): string {
  const { name, teamName, eventName, paymentId, amount, teamMembers, eventIncharge } = data;

  return `
KRATOS 2K25 - Registration Confirmed!

Dear ${name},

Congratulations! Your team "${teamName}" has been successfully registered for ${eventName} at KRATOS 2K25.

REGISTRATION DETAILS:
- Payment ID: ${paymentId}
- Amount Paid: ₹${amount}
- Event: ${eventName}
- Team Name: ${teamName}
- Registration Date: ${new Date().toLocaleDateString()}

TEAM MEMBERS (${teamMembers.length}):
${teamMembers.map(member => `
- ${member.name} ${member.is_leader ? '(TEAM LEADER)' : ''}
  📧 ${member.email}
  🏫 ${member.college}
  📚 ${member.department} | 📅 ${member.year}
`).join('')}

QR CODE FOR EVENT ENTRY:
Show this QR code at the event venue for entry verification.
Your unique entry URL: https://kratos-nu.vercel.app/qr?id=${data.teamMembers[0]?.name || 'team'}

EVENT VENUE:
📍 Easwari Engineering College
Chennai, Tamil Nadu

EVENT CONTACT:
📧 General Email: updates.kratos@gmail.com
📞 Event Incharge: ${eventIncharge.name1} - +91 ${eventIncharge.phone1}
${eventIncharge.name2 ? `📞 Co-Incharge: ${eventIncharge.name2} - +91 ${eventIncharge.phone2}` : ''}

Thank you for registering for KRATOS 2K25!

Best regards,
KRATOS 2K25 Team
Easwari Engineering College, Chennai

© 2025 KRATOS. All rights reserved.
  `;
}
