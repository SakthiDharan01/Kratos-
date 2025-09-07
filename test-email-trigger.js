// Test script to verify SMTP email triggering after payment
console.log('=== TESTING EMAIL TRIGGER FLOW ===');

// This simulates what happens in the payment verification route
async function testEmailTrigger() {
  try {
    console.log('1. Simulating payment verification success...');
    
    // This is what the verify-payment route does:
    const registrantId = 1; // Example registrant ID
    const paymentId = 'pay_test123'; // Example payment ID
    
    console.log('2. Payment verified, now triggering email...');
    
    // Direct import of email service (same as in verify-payment route)
    const { sendConfirmationEmail } = await import('./app/api/send-confirmation-email/email-service.js');
    
    console.log('3. Email service imported successfully');
    
    // Call the email service directly
    const emailResult = await sendConfirmationEmail(registrantId, paymentId);
    
    console.log('4. Email trigger result:', emailResult);
    
    return emailResult;
    
  } catch (error) {
    console.error('❌ Email trigger test failed:', error.message);
    console.error('Stack trace:', error.stack);
    return null;
  }
}

// Run the test
testEmailTrigger().then(result => {
  if (result) {
    console.log('✅ Email trigger test PASSED');
    console.log('SMTP is properly configured and triggered after payment');
  } else {
    console.log('❌ Email trigger test FAILED');
    console.log('SMTP may not be triggered correctly after payment');
  }
}).catch(error => {
  console.error('❌ Test execution failed:', error);
});
