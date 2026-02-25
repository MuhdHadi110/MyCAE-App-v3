"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testPDFGeneration = testPDFGeneration;
const pdfkit_1 = __importDefault(require("pdfkit"));
/**
 * Test PDF generation to ensure PDFKit is working correctly
 */
function testPDFGeneration() {
    return new Promise((resolve, reject) => {
        try {
            const doc = new pdfkit_1.default({ size: 'A4', margin: 50 });
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);
            // Simple test content
            doc.fontSize(20).font('Helvetica-Bold').text('TEST PDF', 50, 50, {
                align: 'center',
                width: 495, // A4 width - margins
            });
            doc.fontSize(12).text('This is a test PDF to verify PDFKit functionality.', 50, 100);
            // Finalize PDF
            doc.end();
        }
        catch (error) {
            reject(error);
        }
    });
}
//# sourceMappingURL=test-pdf.service.js.map