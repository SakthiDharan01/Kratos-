import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Simple SMTP email service for direct testing
export async function POST(request: NextRequest) {
  console.log('=== DIRECT SMTP EMAIL SERVICE ===');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    const body = await request.json();
    const { to, subject, text, html } = body;
    
    console.log('Email request:', { to, subject, textLength: text?.length, htmlLength: html?.length });
    
    // Validate required fields
    if (!to || !subject || (!text && !html)) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: to, subject, and either text or html'
      }, { status: 400 });
    }
    
    // Check environment variables
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return NextResponse.json({
        success: false,
        error: 'SMTP credentials not configured'
      }, { status: 500 });
    }
    
    console.log('Creating SMTP transporter...');
    
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    
    console.log('Verifying SMTP connection...');
    
    // Verify connection
    await transporter.verify();
    console.log('SMTP connection verified successfully');
    
    // Prepare mail options
    const mailOptions = {
      from: `"KRATOS 2K25" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: to,
      subject: subject,
      text: text,
      html: html,
    };
    
    console.log('Sending email...');
    console.log('Mail options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });
    
    // Send email
    const result = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', {
      messageId: result.messageId,
      response: result.response
    });
    
    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      messageId: result.messageId,
      response: result.response
    });
    
  } catch (error) {
    console.error('SMTP email service failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

// GET endpoint for testing SMTP configuration
export async function GET() {
  console.log('=== SMTP CONFIGURATION TEST ===');
  
  try {
    // Check environment variables
    const envCheck = {
      SMTP_USER: !!process.env.SMTP_USER,
      SMTP_PASS: !!process.env.SMTP_PASS,
      SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
      SMTP_PORT: process.env.SMTP_PORT || '587',
      SMTP_FROM: process.env.SMTP_FROM || process.env.SMTP_USER
    };
    
    console.log('Environment check:', envCheck);
    
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return NextResponse.json({
        success: false,
        message: 'SMTP credentials not configured',
        environmentCheck: envCheck
      });
    }
    
    // Test SMTP connection
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    
    console.log('Testing SMTP connection...');
    await transporter.verify();
    console.log('SMTP connection test successful');
    
    return NextResponse.json({
      success: true,
      message: 'SMTP configuration is working correctly',
      environmentCheck: envCheck,
      connectionTest: 'PASSED'
    });
    
  } catch (error) {
    console.error('SMTP configuration test failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'SMTP configuration test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      environmentCheck: {
        SMTP_USER: !!process.env.SMTP_USER,
        SMTP_PASS: !!process.env.SMTP_PASS,
        SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
        SMTP_PORT: process.env.SMTP_PORT || '587'
      }
    }, { status: 500 });
  }
}
