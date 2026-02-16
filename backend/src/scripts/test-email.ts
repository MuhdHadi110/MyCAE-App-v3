import emailService from '../services/email.service';
import { OnboardingPdfService } from '../services/onboardingPdf.service';

async function testEmail() {
  try {
    console.log('Testing email configuration...');
    console.log('SMTP_HOST:', process.env.SMTP_HOST);
    console.log('SMTP_USER:', process.env.SMTP_USER);
    
    // Generate test PDF
    console.log('Generating PDF...');
    const pdfBuffer = await OnboardingPdfService.generateOnboardingGuide('Test User');
    console.log('PDF generated:', pdfBuffer.length, 'bytes');
    
    // Send test email
    console.log('Sending test email...');
    await emailService.sendWelcomeEmail(
      'testuser@mycaetech.com',
      'Test User',
      'TestPassword123!',
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      pdfBuffer
    );
    
    console.log('✅ Test email sent successfully!');
  } catch (error: any) {
    console.error('❌ Email test failed:', error.message);
    console.error('Error details:', error);
  }
}

testEmail();
