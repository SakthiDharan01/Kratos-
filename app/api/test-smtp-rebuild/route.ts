import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('=== TESTING REBUILT SMTP SYSTEM ===');
  
  try {
    const { registrantId = 1, paymentId = 'test_rebuild_123' } = await request.json();
    
    console.log('Testing rebuilt email service with:', { registrantId, paymentId });
    
    // Test the rebuilt email service
    const { sendConfirmationEmail } = await import('../../send-confirmation-email/email-service');
    
    console.log('Email service imported successfully');
    
    const result = await sendConfirmationEmail(registrantId, paymentId);
    
    console.log('Email service result:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Rebuilt SMTP system working correctly',
      testResult: result
    });
    
  } catch (error) {
    console.error('Rebuilt SMTP test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'SMTP system has been rebuilt',
    endpoints: {
      'Email Service': '/api/send-confirmation-email',
      'Direct SMTP': '/api/send-email-smtp',
      'Test Rebuild': '/api/test-smtp-rebuild'
    },
    features: [
      'Complete email service with database logging',
      'Professional HTML email templates',
      'Team member iteration',
      'QR code integration',
      'Gmail SMTP integration',
      'Comprehensive error handling',
      'Direct function calls from payment verification'
    ]
  });
}
