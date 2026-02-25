"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const email_service_1 = __importDefault(require("../services/email.service"));
const onboardingPdf_service_1 = require("../services/onboardingPdf.service");
async function testGmail() {
    try {
        console.log('Testing email to Gmail address...');
        await database_1.AppDataSource.initialize();
        const pdfBuffer = await onboardingPdf_service_1.OnboardingPdfService.generateOnboardingGuide('Test User');
        console.log('Sending to mirzamuhd12@gmail.com...');
        await email_service_1.default.sendWelcomeEmail('mirzamuhd12@gmail.com', 'Test User', 'TestPass123!', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), pdfBuffer);
        console.log('✅ Email sent successfully!');
    }
    catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Full error:', error);
    }
    finally {
        await database_1.AppDataSource.destroy();
    }
}
testGmail();
//# sourceMappingURL=test-gmail.js.map