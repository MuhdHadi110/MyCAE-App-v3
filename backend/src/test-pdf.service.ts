import PDFDocument from 'pdfkit';

/**
 * Test PDF generation to ensure PDFKit is working correctly
 */
export function testPDFGeneration(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers: Buffer[] = [];

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
    } catch (error) {
      reject(error);
    }
  });
}