"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const email_service_1 = __importDefault(require("../services/email.service"));
const onboardingPdf_service_1 = require("../services/onboardingPdf.service");
async function testEmail() {
    try {
        console.log('Testing email configuration...');
        console.log('SMTP_HOST:', process.env.SMTP_HOST);
        console.log('SMTP_USER:', process.env.SMTP_USER);
        // Generate test PDF
        console.log('Generating PDF...');
        const pdfBuffer = await onboardingPdf_service_1.OnboardingPdfService.generateOnboardingGuide('Test User');
        console.log('PDF generated:', pdfBuffer.length, 'bytes');
        // Send test email
        console.log('Sending test email...');
        await email_service_1.default.sendWelcomeEmail('testuser@mycaetech.com', 'Test User', 'TestPassword123!', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), pdfBuffer);
        console.log('✅ Test email sent successfully!');
    }
    catch (error) {
        console.error('❌ Email test failed:', error.message);
        console.error('Error details:', error);
    }
}
testEmail();
//# sourceMappingURL=test-email.js.map