import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(request: NextRequest) {
  console.log('=== EMAIL API CALLED ===');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    const { registrantId, paymentId } = await request.json();
    console.log('Email API payload:', { registrantId, paymentId });

    if (!registrantId) {
      console.error('Missing registrantId in email API call');
      return NextResponse.json({ error: 'Registrant ID is required' }, { status: 400 });
    }

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
      return NextResponse.json({ 
        error: 'Registration not found or not paid', 
        details: registrantError?.message 
      }, { status: 404 });
    }

    const teamMembers = registrantData.registrations || [];
    const event = (registrantData.events as any);
    
    if (!event) {
      return NextResponse.json({ error: 'Event information not found' }, { status: 404 });
    }

    // Generate QR URL for team verification
    const qrUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/qr?id=${registrantData.id}`;

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

    return NextResponse.json({
      success: true,
      message: 'Email sending process completed',
      results: {
        totalMembers: teamMembers.length,
        emailsSent: emailResults.length,
        emailsFailed: failedEmails.length,
        successfulEmails: emailResults,
        failedEmails: failedEmails
      }
    });

  } catch (error) {
    console.error('Unexpected error in send-confirmation-email:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
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
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; }
        .container { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { font-size: 2.8em; font-weight: bold; margin-bottom: 10px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
        .header p { font-size: 1.2em; opacity: 0.9; }
        .content { padding: 40px 30px; }
        .success-banner { background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px; }
        .success-banner h2 { font-size: 1.5em; margin-bottom: 10px; }
        .details-card { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 25px; margin: 25px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e9ecef; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: 600; color: #6c757d; }
        .detail-value { font-weight: 500; color: #212529; }
        .team-section { margin: 30px 0; }
        .team-member { background: white; border: 1px solid #dee2e6; border-radius: 6px; padding: 20px; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .member-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .member-name { font-size: 1.1em; font-weight: 600; color: #212529; }
        .leader-badge { background: #FF6B35; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.8em; font-weight: bold; text-transform: uppercase; }
        .member-info { color: #6c757d; font-size: 0.9em; line-height: 1.5; }
        .qr-section { background: linear-gradient(135deg, #fff3cd, #ffeaa7); border: 2px solid #FF6B35; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; }
        .qr-title { color: #856404; font-size: 1.3em; font-weight: 600; margin-bottom: 15px; }
        .qr-image { max-width: 180px; border: 3px solid #FF6B35; border-radius: 10px; margin: 20px 0; }
        .venue-card { background: linear-gradient(135deg, #e3f2fd, #bbdefb); border: 1px solid #90caf9; border-radius: 8px; padding: 25px; margin: 25px 0; }
        .venue-title { color: #1976d2; font-size: 1.2em; font-weight: 600; margin-bottom: 10px; }
        .instructions { background: #fff3e0; border-left: 4px solid #ff9800; padding: 25px; margin: 25px 0; }
        .instructions h3 { color: #ef6c00; margin-bottom: 15px; }
        .instructions ul { list-style: none; padding: 0; }
        .instructions li { padding: 8px 0; padding-left: 25px; position: relative; }
        .instructions li:before { content: "✓"; position: absolute; left: 0; color: #4caf50; font-weight: bold; }
        .cta-section { text-align: center; margin: 40px 0; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #FF6B35, #F7931E); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; font-size: 1.1em; transition: all 0.3s ease; }
        .footer { background: #212529; color: white; padding: 30px; text-align: center; }
        .footer h3 { margin-bottom: 10px; }
        .footer p { opacity: 0.8; }
        @media (max-width: 600px) {
            .container { margin: 10px; }
            .header { padding: 30px 20px; }
            .content { padding: 30px 20px; }
            .header h1 { font-size: 2.2em; }
            .detail-row { flex-direction: column; }
            .member-header { flex-direction: column; align-items: flex-start; }
            .leader-badge { margin-top: 8px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>🎉 KRATOS 2K25</h1>
            <p>Technical Symposium</p>
        </div>

        <!-- Content -->
        <div class="content">
            <!-- Success Banner -->
            <div class="success-banner">
                <h2>✅ Registration Confirmed!</h2>
                <p>Your registration for <strong>${eventName}</strong> has been successfully processed</p>
            </div>

            <!-- Personal Greeting -->
            <p style="font-size: 1.2em; margin-bottom: 20px;">Dear <strong>${name}</strong>,</p>
            <p style="margin-bottom: 25px;">
                Congratulations! Your team <strong>"${teamName}"</strong> has been successfully registered for 
                <strong>${eventName}</strong> at KRATOS 2K25. We're excited to see your participation!
            </p>

            <!-- Registration Details -->
            <div class="details-card">
                <h3 style="color: #FF6B35; margin-bottom: 20px; font-size: 1.3em;">📋 Registration Details</h3>
                <div class="detail-row">
                    <span class="detail-label">Payment ID</span>
                    <span class="detail-value" style="font-family: monospace; background: #f8f9fa; padding: 4px 8px; border-radius: 4px;">${paymentId}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Amount Paid</span>
                    <span class="detail-value" style="color: #28a745; font-weight: bold; font-size: 1.1em;">₹${amount}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Event</span>
                    <span class="detail-value">${eventName}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Team Name</span>
                    <span class="detail-value">${teamName}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Registration Date</span>
                    <span class="detail-value">${new Date().toLocaleDateString('en-IN', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</span>
                </div>
            </div>

            <!-- Team Members -->
            <div class="team-section">
                <h3 style="color: #FF6B35; margin-bottom: 20px; font-size: 1.3em;">👥 Team Members (${teamMembers.length})</h3>
                ${teamMembers.map(member => `
                    <div class="team-member">
                        <div class="member-header">
                            <span class="member-name">${member.name}</span>
                            ${member.is_leader ? '<span class="leader-badge">Team Leader</span>' : ''}
                        </div>
                        <div class="member-info">
                            📧 ${member.email}<br>
                            🏫 ${member.college}<br>
                            📚 ${member.department} | 📅 ${member.year}
                        </div>
                    </div>
                `).join('')}
            </div>

            <!-- QR Code Section -->
            <div class="qr-section">
                <div class="qr-title">📱 Team Verification QR Code</div>
                <p style="margin-bottom: 15px; color: #856404;">Show this QR code at the venue for instant team verification and quick entry:</p>
                <img src="${qrUrl}" alt="Team Verification QR Code" class="qr-image">
                <p style="font-size: 0.9em; color: #856404; margin-top: 15px;">
                    💡 <strong>Pro Tip:</strong> Save this email or take a screenshot for quick access at the venue
                </p>
            </div>

            <!-- Venue Information -->
            <div class="venue-card">
                <div class="venue-title">📍 Event Venue</div>
                <p style="font-size: 1.2em; font-weight: 600; margin-bottom: 5px;">Easwari Engineering College</p>
                <p style="color: #1976d2;">Chennai, Tamil Nadu</p>
                <p style="margin-top: 10px; font-size: 0.9em;">Get ready for an amazing technical symposium experience!</p>
            </div>

            <!-- Important Instructions -->
            <div class="instructions">
                <h3>⚠️ Important Instructions</h3>
                <ul>
                    <li>Arrive at least 30 minutes before the event start time</li>
                    <li>Bring valid college ID cards for all team members</li>
                    <li>Keep this email accessible on your phone for QR code scanning</li>
                    <li>Follow all safety protocols at the venue</li>
                    <li>Join our official communication channels for updates</li>
                    <li>Contact support for any questions or assistance needed</li>
                </ul>
            </div>

            <!-- Call to Action -->
            <div class="cta-section">
                <p style="font-size: 1.2em; margin-bottom: 20px;">Ready to showcase your technical skills? 🚀</p>
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/receipt?payment_id=${paymentId}" class="cta-button">
                    View Digital Receipt
                </a>
            </div>

            <!-- Support Information -->
            <div style="text-align: center; padding: 25px; background: #f8f9fa; border-radius: 8px; margin-top: 30px;">
                <h4 style="color: #495057; margin-bottom: 15px;">Need Help or Have Questions?</h4>
                <p style="margin-bottom: 10px;">
                    📧 <strong>Email:</strong> kratos2k25@easwari.edu.in
                </p>
                <p style="margin-bottom: 10px;">
                    📞 <strong>Phone:</strong> +91 XXXXX XXXXX
                </p>
                <p style="color: #6c757d; font-size: 0.9em;">
                    Our support team is here to help you have the best experience at KRATOS 2K25!
                </p>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <h3>🏆 KRATOS 2K25</h3>
            <p>Technical Symposium - Easwari Engineering College</p>
            <p style="margin-top: 10px;">Chennai, Tamil Nadu</p>
            <p style="margin-top: 15px; font-size: 0.9em;">
                Thank you for being part of KRATOS 2K25. Let's innovate together! 🚀
            </p>
        </div>
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

IMPORTANT INSTRUCTIONS:
✓ Arrive at least 30 minutes before the event start time
✓ Bring valid college ID cards for all team members
✓ Keep this email accessible on your phone for QR code
✓ Follow all safety protocols at the venue
✓ Contact support for any questions

SUPPORT:
📧 Email: kratos2k25@easwari.edu.in
📞 Phone: +91 XXXXX XXXXX

Thank you for registering for KRATOS 2K25! We're excited to see you at the event.

Best regards,
KRATOS 2K25 Team
Easwari Engineering College, Chennai
  `;
}
