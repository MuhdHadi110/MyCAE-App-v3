import { AppDataSource } from '../config/database';
import emailService from '../services/email.service';
import { OnboardingPdfService } from '../services/onboardingPdf.service';

async function testGmail() {
  try {
    console.log('Testing email to Gmail address...');
    await AppDataSource.initialize();
    
    const pdfBuffer = await OnboardingPdfService.generateOnboardingGuide('Test User');
    
    console.log('Sending to mirzamuhd12@gmail.com...');
    await emailService.sendWelcomeEmail(
      'mirzamuhd12@gmail.com',
      'Test User',
      'TestPass123!',
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      pdfBuffer
    );
    
    console.log('✅ Email sent successfully!');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

testGmail();
