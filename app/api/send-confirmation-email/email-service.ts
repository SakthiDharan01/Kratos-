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

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// Send email using SMTP
async function sendRegistrationEmail(emailData: EmailData, qrUrl: string) {
  const transporter = createTransporter();
  
  const htmlContent = generateEmailHTML(emailData, qrUrl);
  const textContent = generateEmailText(emailData);

  const mailOptions = {
    from: `"KRATOS 2K25" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: emailData.email,
    subject: `🎉 Registration Confirmed - KRATOS 2K25 | ${emailData.eventName}`,
    html: htmlContent,
    text: textContent,
  };

  return await transporter.sendMail(mailOptions);
}

export async function sendConfirmationEmail(registrantId: number, paymentId: string) {
  console.log('=== EMAIL SERVICE CALLED ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Payload:', { registrantId, paymentId });

  try {
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
          start_time,
          end_time
        ),
        registrations (
          id,
          name,
          email,
          phone,
          college,
          department,
          year,
          is_leader
        )
      `)
      .eq('id', registrantId)
      .eq('payment_status', 'paid')
      .single();

    if (registrantError || !registrantData) {
      console.error('Error fetching registrant data:', registrantError);
      throw new Error(`Registration not found or not paid: ${registrantError?.message}`);
    }

    const teamMembers = registrantData.registrations || [];
    const event = (registrantData.events as any);
    
    if (!event) {
      throw new Error('Event information not found');
    }

    // Generate QR URL for team verification
    const qrUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://kratos-nu.vercel.app'}/qr?id=${registrantData.id}`;

    // Send email to all team members
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
    try {
      await supabaseAdmin
        .from('email_logs')
        .insert({
          registrant_id: registrantId,
          payment_id: paymentId,
          emails_sent: emailResults.length,
          emails_failed: failedEmails.length,
          recipients: teamMembers.map(m => m.email),
          sent_at: new Date().toISOString()
        });
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
  const { name, teamName, eventName, paymentId, amount, teamMembers } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KRATOS 2K25 Registration Confirmed</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="font-size: 2.5em; margin-bottom: 10px;">🎉 KRATOS 2K25</h1>
        <p style="font-size: 1.2em;">Technical Symposium</p>
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
            <h3 style="color: #FF6B35; margin-bottom: 20px;">📋 Registration Details</h3>
            <p><strong>Payment ID:</strong> ${paymentId}</p>
            <p><strong>Amount Paid:</strong> <span style="color: #28a745; font-weight: bold;">₹${amount}</span></p>
            <p><strong>Event:</strong> ${eventName}</p>
            <p><strong>Team Name:</strong> ${teamName}</p>
            <p><strong>Registration Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
        </div>

        <div style="text-align: center; padding: 25px; background: #f8f9fa; border-radius: 8px;">
            <h4 style="margin-bottom: 15px;">Need Help?</h4>
            <p><strong>Email:</strong> kratos2k25@easwari.edu.in</p>
            <p><strong>Phone:</strong> +91 XXXXX XXXXX</p>
        </div>
    </div>

    <div style="background: #212529; color: white; padding: 30px; text-align: center; border-radius: 0 0 10px 10px;">
        <h3>🏆 KRATOS 2K25</h3>
        <p>Technical Symposium - Easwari Engineering College</p>
        <p>Chennai, Tamil Nadu</p>
    </div>
</body>
</html>
  `;
}

function generateEmailText(data: EmailData): string {
  const { name, teamName, eventName, paymentId, amount, teamMembers } = data;

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

EVENT VENUE:
📍 Easwari Engineering College
Chennai, Tamil Nadu

SUPPORT:
📧 Email: kratos2k25@easwari.edu.in
📞 Phone: +91 XXXXX XXXXX

Thank you for registering for KRATOS 2K25!

Best regards,
KRATOS 2K25 Team
Easwari Engineering College, Chennai
  `;
}
