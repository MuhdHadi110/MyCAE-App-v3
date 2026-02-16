import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

/**
 * Service to generate onboarding guide PDF for new users
 */
export class OnboardingPdfService {
  /**
   * Generate onboarding guide PDF
   */
  static async generateOnboardingGuide(userName: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc.fontSize(24).text('MyCAE Technologies App', 50, 50);
        doc.fontSize(18).text('Onboarding Guide', 50, 80);
        doc.moveDown(2);

        // Welcome Section
        doc.fontSize(16).text('Welcome!', 50, doc.y);
        doc.fontSize(12);
        doc.text(`Hi ${userName},`, 50, doc.y + 10);
        doc.moveDown();
        doc.text('Welcome to MyCAE Technologies App! This guide will help you get started with the system.', {
          width: 500,
          align: 'left',
        });
        doc.moveDown(2);

        // Page 1: Getting Started
        doc.addPage();
        doc.fontSize(18).text('1. Getting Started', 50, 50);
        doc.moveDown();

        doc.fontSize(14).text('1.1 Login Process', 50, doc.y);
        doc.fontSize(12);
        doc.moveDown();
        doc.text('Step 1: Visit https://mycaetech.com', { width: 500 });
        doc.moveDown(0.5);
        doc.text('Step 2: Enter your email address', { width: 500 });
        doc.moveDown(0.5);
        doc.text('Step 3: Enter your temporary password', { width: 500 });
        doc.moveDown(0.5);
        doc.text('Step 4: Click "Login"', { width: 500 });
        doc.moveDown(2);

        // Placeholder for login screenshot
        doc.fontSize(10).fillColor('gray').text('[Screenshot: Login Page]', 50, doc.y);
        doc.fillColor('black');
        doc.moveDown(2);

        doc.fontSize(14).text('1.2 First-Time Login', 50, doc.y);
        doc.fontSize(12);
        doc.moveDown();
        doc.text('On your first login, you will be required to change your temporary password.', { width: 500 });
        doc.moveDown(0.5);
        doc.text('1. Enter your temporary password', { width: 500 });
        doc.moveDown(0.5);
        doc.text('2. Enter a new secure password (minimum 8 characters)', { width: 500 });
        doc.moveDown(0.5);
        doc.text('3. Confirm your new password', { width: 500 });
        doc.moveDown(0.5);
        doc.text('4. Click "Change Password"', { width: 500 });
        doc.moveDown(2);

        // Placeholder for password change screenshot
        doc.fontSize(10).fillColor('gray').text('[Screenshot: Change Password Screen]', 50, doc.y);
        doc.fillColor('black');

        // Page 2: Dashboard
        doc.addPage();
        doc.fontSize(18).text('2. Dashboard Overview', 50, 50);
        doc.moveDown();

        doc.fontSize(12);
        doc.text('The dashboard is your central hub. From here you can:', { width: 500 });
        doc.moveDown(0.5);
        doc.text('• View your assigned projects', { width: 500, indent: 20 });
        doc.moveDown(0.5);
        doc.text('• Access timesheets', { width: 500, indent: 20 });
        doc.moveDown(0.5);
        doc.text('• Check notifications', { width: 500, indent: 20 });
        doc.moveDown(0.5);
        doc.text('• Navigate to other modules', { width: 500, indent: 20 });
        doc.moveDown(2);

        // Placeholder for dashboard screenshot
        doc.fontSize(10).fillColor('gray').text('[Screenshot: Dashboard]', 50, doc.y);
        doc.fillColor('black');

        // Page 3: Projects
        doc.addPage();
        doc.fontSize(18).text('3. Working with Projects', 50, 50);
        doc.moveDown();

        doc.fontSize(14).text('3.1 Viewing Projects', 50, doc.y);
        doc.fontSize(12);
        doc.moveDown();
        doc.text('Access the Projects section to:', { width: 500 });
        doc.moveDown(0.5);
        doc.text('• View project details and status', { width: 500, indent: 20 });
        doc.moveDown(0.5);
        doc.text('• See assigned team members', { width: 500, indent: 20 });
        doc.moveDown(0.5);
        doc.text('• Track project progress', { width: 500, indent: 20 });
        doc.moveDown(2);

        // Placeholder for projects screenshot
        doc.fontSize(10).fillColor('gray').text('[Screenshot: Projects List]', 50, doc.y);
        doc.fillColor('black');
        doc.moveDown(2);

        doc.fontSize(14).text('3.2 Project Details', 50, doc.y);
        doc.fontSize(12);
        doc.moveDown();
        doc.text('Click on any project to view detailed information including planned hours, actual hours, and project status.', { width: 500 });

        // Page 4: Timesheets
        doc.addPage();
        doc.fontSize(18).text('4. Logging Timesheets', 50, 50);
        doc.moveDown();

        doc.fontSize(14).text('4.1 Creating a Timesheet Entry', 50, doc.y);
        doc.fontSize(12);
        doc.moveDown();
        doc.text('To log your work hours:', { width: 500 });
        doc.moveDown(0.5);
        doc.text('1. Navigate to Timesheets', { width: 500 });
        doc.moveDown(0.5);
        doc.text('2. Click "Add Timesheet"', { width: 500 });
        doc.moveDown(0.5);
        doc.text('3. Select the project', { width: 500 });
        doc.moveDown(0.5);
        doc.text('4. Enter the date and hours worked', { width: 500 });
        doc.moveDown(0.5);
        doc.text('5. Select work category', { width: 500 });
        doc.moveDown(0.5);
        doc.text('6. Add description (optional)', { width: 500 });
        doc.moveDown(0.5);
        doc.text('7. Click "Save"', { width: 500 });
        doc.moveDown(2);

        // Placeholder for timesheet screenshot
        doc.fontSize(10).fillColor('gray').text('[Screenshot: Timesheet Entry]', 50, doc.y);
        doc.fillColor('black');
        doc.moveDown(2);

        doc.fontSize(14).text('4.2 Editing Timesheets', 50, doc.y);
        doc.fontSize(12);
        doc.moveDown();
        doc.text('You can only edit your own timesheet entries. Click on an entry to modify it.', { width: 500 });

        // Page 5: Quick Tips
        doc.addPage();
        doc.fontSize(18).text('5. Quick Tips', 50, 50);
        doc.moveDown();

        doc.fontSize(14).text('5.1 Keyboard Shortcuts', 50, doc.y);
        doc.fontSize(12);
        doc.moveDown();
        doc.text('• Ctrl+N: Create new entry (where applicable)', { width: 500 });
        doc.moveDown(0.5);
        doc.text('• Ctrl+S: Save current form', { width: 500 });
        doc.moveDown(0.5);
        doc.text('• Escape: Close modals/dialogs', { width: 500 });
        doc.moveDown(2);

        doc.fontSize(14).text('5.2 Mobile Access', 50, doc.y);
        doc.fontSize(12);
        doc.moveDown();
        doc.text('The MyCAE Technologies App is fully responsive and works on mobile devices. Access it from your phone or tablet browser.', { width: 500 });
        doc.moveDown(2);

        doc.fontSize(14).text('5.3 Best Practices', 50, doc.y);
        doc.fontSize(12);
        doc.moveDown();
        doc.text('• Log timesheets daily for accuracy', { width: 500 });
        doc.moveDown(0.5);
        doc.text('• Keep project descriptions clear and concise', { width: 500 });
        doc.moveDown(0.5);
        doc.text('• Check your dashboard regularly for updates', { width: 500 });
        doc.moveDown(0.5);
        doc.text('• Update your profile information as needed', { width: 500 });

        // Page 6: Contact & Support
        doc.addPage();
        doc.fontSize(18).text('6. Contact & Support', 50, 50);
        doc.moveDown();

        doc.fontSize(14).text('Need Help?', 50, doc.y);
        doc.fontSize(12);
        doc.moveDown();
        doc.text('If you have any questions or need assistance, please contact:', { width: 500 });
        doc.moveDown();
        doc.text('Email: noreply@mycaetech.com', { width: 500 });
        doc.moveDown(2);

        doc.fontSize(14).text('Important Reminders', 50, doc.y);
        doc.fontSize(12);
        doc.moveDown();
        doc.text('• Your temporary password expires in 7 days', { width: 500 });
        doc.moveDown(0.5);
        doc.text('• Change your password immediately after first login', { width: 500 });
        doc.moveDown(0.5);
        doc.text('• Keep your login credentials secure', { width: 500 });
        doc.moveDown(0.5);
        doc.text('• Log out when finished using the system', { width: 500 });
        doc.moveDown(2);

        // Footer
        doc.fontSize(10).fillColor('gray');
        doc.text('MyCAE Technologies App - Onboarding Guide', 50, 750);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 400, 750);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
