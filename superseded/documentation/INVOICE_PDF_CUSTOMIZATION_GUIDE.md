# Invoice PDF Customization Guide

## Overview

The invoice PDF is generated in [backend/src/services/invoice-pdf.service.ts](backend/src/services/invoice-pdf.service.ts). You can customize the layout, styling, company details, colors, and more by modifying the settings and the PDF generation code.

---

## Part 1: Quick Settings Customization

The easiest way to customize your invoice is through the `settings` object in the `generateInvoicePDF()` method (lines 83-100 in invoice-pdf.service.ts).

### Company Details

Update these fields with your company information:

```typescript
const settings = {
  company_name: 'MYCAE TECHNOLOGIES SDN BHD',           // Your company name
  registration_number: '863273W',                        // Business registration number
  address: 'UDINI Square, Block 2-03-13A,\n...',        // Multi-line address (use \n for new lines)
  phone: '+604 376 2355',                                // Main phone
  mobile: '+60 17 2008173',                              // Mobile/WhatsApp
  email: 'kctang@mycae.com.my',                          // Email address
  sst_id: 'P11-1808-31028245',                           // SST/Tax ID
};
```

### Display Options

Control what appears on the invoice:

```typescript
const settings = {
  show_sst_id: true,              // Show/hide SST ID
  show_bank_details: true,        // Show/hide bank details section
  header_position: 'top-center',  // Options: 'top-left', 'top-center', 'top-right'
  logo_size: 'medium',            // Options: 'small' (60px), 'medium' (100px), 'large' (150px)
  logo_url: null,                 // Path to logo image (relative to project root)
};
```

### Branding & Style

```typescript
const settings = {
  primary_color: '#2563eb',       // Primary brand color (currently unused, available for expansion)
  page_margin: 50,                // Margin in points (1 inch ≈ 72 points)
};
```

### Content & Footer

```typescript
const settings = {
  invoice_footer: 'Payment Terms: Please make payment within 30 days from invoice date.',
  bank_details: '[Add your bank details here]',  // Replace with actual bank account info
};
```

---

## Part 2: Understanding the PDF Coordinate System

The PDF uses absolute positioning with coordinates:

- **A4 Page Dimensions**: 595 points wide × 842 points tall
- **1 inch ≈ 72 points**
- **X-axis**: Horizontal (0 = left, 595 = right)
- **Y-axis**: Vertical (0 = top, 842 = bottom)
- **Margin**: 50 points = ~0.7 inches

### Visual Layout Map

```
Y=50  ┌─────────────────────────────────────────────┐
      │  Logo (if enabled)                          │
      │                                             │
Y=~130│             INVOICE                         │
      │        MYCAE TECHNOLOGIES SDN BHD           │
      │        Registration Number                  │
      │        Address Lines                        │
      │        Contact Details                      │
      │                                             │
Y=~190│  INVOICE NUMBER:      ############         │
      │  INVOICE DATE:        DD MMM YYYY           │
      │                                             │
      │  SOLD TO:                                   │
      │  [Project Name]                             │
      │  ─────────────────────────────────────────  │
      │                                             │
Y=~250│  NO │ DESCRIPTION │ QTY │ UNIT PRICE │ AMT │
      │  ─────────────────────────────────────────  │
      │   1 │ [description] │ 1 │ RM xxxx.xx │ xxx │
      │                                             │
Y=~340│  ─────────────────────────────────────────  │
      │                  SUBTOTAL: RM xxxx.xx       │
      │                  SST (8%):  RM xxxx.xx      │
      │                     TOTAL:  RM xxxx.xx      │
      │                                             │
Y=~420│  Payment Terms: ...                         │
      │  Bank Details: ...                          │
      └─────────────────────────────────────────────┘
```

---

## Part 3: Common Customizations

### 3.1 Change Company Details

Edit lines 83-100 in [backend/src/services/invoice-pdf.service.ts](backend/src/services/invoice-pdf.service.ts):

```typescript
const settings = {
  company_name: 'YOUR COMPANY NAME',
  registration_number: 'YOUR_REG_NUMBER',
  address: 'Your Street Address,\nCity, Postal Code, Country',
  phone: '+1 (555) 123-4567',
  mobile: '+1 (555) 987-6543',
  email: 'invoice@yourcompany.com',
  sst_id: 'YOUR_SST_ID',
};
```

Then clear the PDF cache to regenerate:
```bash
rm -rf backend/uploads/pdfs/cache/*
# or on Windows:
del backend\uploads\pdfs\cache\*
```

### 3.2 Add a Logo

1. Place your logo image in `backend/uploads/` (PNG or JPG, ideally max 500KB)
2. Update settings:
```typescript
const settings = {
  logo_url: 'uploads/logos/my-logo.png',  // relative path from backend folder
  logo_size: 'medium',  // 'small' (60px), 'medium' (100px), or 'large' (150px)
  header_position: 'top-center',  // or 'top-left', 'top-right'
};
```

### 3.3 Adjust Page Margins

```typescript
const settings = {
  page_margin: 40,  // Smaller margins (in points)
  // or
  page_margin: 60,  // Larger margins
};
```

**Note**: The margin affects the overall spacing from the page edges. Adjust if your content feels cramped or too spread out.

### 3.4 Customize Footer Text

```typescript
const settings = {
  invoice_footer: 'Thank you for your business!\nPayment due within 30 days of invoice date.',
  bank_details: 'Bank: Maybank\nAccount: 1234567890\nSwift Code: MBBEMYKL',
};
```

Or disable the footer:

```typescript
if (settings.invoice_footer) {
  // Keep this block, or comment it out to hide footer
}
```

---

## Part 4: Advanced Layout Customization

For more complex changes, you'll need to modify the PDF generation code directly.

### 4.1 Repositioning Elements

Find the element in the code and adjust its X and Y coordinates:

**Example: Move invoice details to the left**

Current (line 196):
```typescript
doc.text(`INVOICE NUMBER:`, 350, invoiceNumberY, { width: 100 });
doc.font('Helvetica-Bold').text(invoice.invoice_number, 470, invoiceNumberY, { width: 75, align: 'right' });
```

Modified (move left by 50 points):
```typescript
doc.text(`INVOICE NUMBER:`, 300, invoiceNumberY, { width: 100 });
doc.font('Helvetica-Bold').text(invoice.invoice_number, 420, invoiceNumberY, { width: 75, align: 'right' });
```

### 4.2 Changing Font Sizes

All font sizes are in points. Common sizes: 8 (tiny), 9 (small), 10 (normal), 11 (medium), 12+ (large)

Current (line 151):
```typescript
doc.fontSize(20).font('Helvetica-Bold').text('INVOICE', margin, startY, {
```

Make it smaller:
```typescript
doc.fontSize(16).font('Helvetica-Bold').text('INVOICE', margin, startY, {
```

### 4.3 Changing Fonts

Available PDFKit fonts: `'Helvetica'`, `'Helvetica-Bold'`, `'Helvetica-Oblique'`, `'Helvetica-BoldOblique'`, `'Times-Roman'`, `'Times-Bold'`, `'Courier'`, `'Courier-Bold'`

Example:
```typescript
doc.font('Times-Bold').text('INVOICE', ...)  // Use Times New Roman Bold instead
```

### 4.4 Adding Spacing Between Sections

Use `doc.moveDown()` to add vertical spacing:

```typescript
doc.moveDown(1);    // Add 1 line of spacing
doc.moveDown(2);    // Add 2 lines of spacing
doc.moveDown(0.5);  // Add 0.5 lines of spacing
```

### 4.5 Adding Lines or Borders

Current code (line 219):
```typescript
doc
  .moveTo(margin, invoiceDetailsY + 110)           // Start point (x, y)
  .lineTo(595 - margin, invoiceDetailsY + 110)    // End point (x, y)
  .stroke();
```

To add a box around a section:
```typescript
const boxX = margin;
const boxY = 200;
const boxWidth = 595 - (margin * 2);
const boxHeight = 100;

doc
  .rect(boxX, boxY, boxWidth, boxHeight)
  .stroke();
```

### 4.6 Changing Text Alignment

Options: `'left'`, `'center'`, `'right'`, `'justify'`

Example:
```typescript
doc.text('Right-aligned text', 100, 200, { align: 'right', width: 150 });
```

---

## Part 5: Restructuring the Invoice Layout

### 5.1 Change Invoice Header Style

Current structure (lines 150-187):
- Centered "INVOICE" title
- Company name in smaller text
- Address and contact details
- SST ID if enabled

To make it left-aligned with company logo:

Replace lines 150-187 with:
```typescript
// Logo on left, company name on right
if (settings.logo_url) {
  const logoWidth = 80;
  const logoPath = path.join(__dirname, '../../', settings.logo_url);
  if (fs.existsSync(logoPath)) {
    this.addImageToPDF(doc, logoPath, margin, startY, logoWidth);
    startY += 80 + 10;
  }
}

// Company header
doc.fontSize(18).font('Helvetica-Bold').text('INVOICE', margin, startY);
startY += 25;

doc.fontSize(10).font('Helvetica-Bold').text(settings.company_name, margin);
doc.fontSize(9).font('Helvetica').text(settings.address.split('\n')[0], margin);
doc.text(settings.email, margin);

startY = doc.y + 10;
```

### 5.2 Add Multiple Line Items

The current code (lines 241-262) only supports one line item. To add multiple items, you need to loop:

Find the line item section and wrap it in a loop:

```typescript
// Line Items
const lineItems = [
  { description: 'Service 1', qty: 1, unitPrice: 1000 },
  { description: 'Service 2', qty: 2, unitPrice: 500 },
  // Add more items from database as needed
];

let itemY = tableTop + 28;

lineItems.forEach((item, index) => {
  doc.font('Helvetica').fontSize(9);
  doc.text((index + 1).toString(), margin, itemY);
  doc.text(item.description, margin + 30, itemY, { width: 250 });
  doc.text(item.qty.toString(), 340, itemY, { width: 40, align: 'center' });
  doc.text(item.unitPrice.toLocaleString('en-MY', { minimumFractionDigits: 2 }), 390, itemY, {
    width: 60,
    align: 'right',
  });

  const lineAmount = item.qty * item.unitPrice;
  doc.text(lineAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 }), 470, itemY, {
    width: 75,
    align: 'right',
  });

  itemY += 20;  // Move to next row
});
```

### 5.3 Add a New Section (e.g., Notes/Terms)

Add before the final `doc.end()` call:

```typescript
// Notes section
const notesY = totalsY + 150;
doc.fontSize(9).font('Helvetica-Bold').text('Terms & Conditions:', margin, notesY);
doc.fontSize(8).font('Helvetica').text(
  'Payment must be received by the due date. Late payments may incur additional charges.',
  margin,
  notesY + 20,
  { width: 495 - margin, align: 'left' }
);
```

---

## Part 6: Testing Your Changes

1. **Make your code changes** in [backend/src/services/invoice-pdf.service.ts](backend/src/services/invoice-pdf.service.ts)

2. **Clear the PDF cache** to force regeneration:
   ```bash
   # Linux/Mac:
   rm -rf backend/uploads/pdfs/cache/*

   # Windows (Command Prompt):
   del backend\uploads\pdfs\cache\*

   # Windows (PowerShell):
   Remove-Item backend\uploads\pdfs\cache\* -Force
   ```

3. **Restart the backend server**:
   ```bash
   cd backend
   npm run dev
   ```

4. **Generate a test PDF**:
   - Go to the Invoices page in the application
   - Click to view/download any invoice
   - The PDF will be regenerated with your new formatting

5. **Verify the output**:
   - Check that text is properly positioned (no overlapping)
   - Verify spacing looks correct
   - Ensure all elements are readable

---

## Part 7: Common Issues & Solutions

### Issue: Text Overlapping
**Cause**: Y-coordinates are too close together or missing spacing logic
**Solution**:
- Increase the spacing between Y positions (add 20-30 points)
- Use `doc.moveDown()` to automatically advance the Y position
- Check that width parameters are correct

Example:
```typescript
// Bad (overlapping):
doc.text('Line 1', margin, 100);
doc.text('Line 2', margin, 110);  // Too close!

// Good (proper spacing):
doc.text('Line 1', margin, 100);
doc.text('Line 2', margin, 120);  // Better spacing
```

### Issue: Text Cut Off at Page Edge
**Cause**: X position + width exceeds page width (595 points)
**Solution**: Reduce width or adjust X position

```typescript
// Total: 470 + 75 = 545 points (OK for 50px margins)
doc.text('Amount', 470, 200, { width: 75 });

// If text is cut off, reduce width or X position
doc.text('Amount', 460, 200, { width: 75 });
```

### Issue: Logo Not Showing
**Cause**: Path is incorrect or file doesn't exist
**Solution**:
- Verify file exists at the path
- Use relative path from backend folder: `uploads/logos/mylogo.png`
- Ensure image is PNG or JPG (max 5MB recommended)

### Issue: Font Not Changing
**Cause**: PDFKit may not have that font installed
**Solution**: Use only these standard fonts:
- `'Helvetica'`, `'Helvetica-Bold'`, `'Helvetica-Oblique'`, `'Helvetica-BoldOblique'`
- `'Times-Roman'`, `'Times-Bold'`, `'Times-Italic'`, `'Times-BoldItalic'`
- `'Courier'`, `'Courier-Bold'`, `'Courier-Oblique'`, `'Courier-BoldOblique'`
- `'Symbol'`, `'ZapfDingbats'`

---

## Part 8: Quick Reference - Common X-Coordinates

When positioning elements, use these standard positions:

```
Page width: 595 points (with 50px margin on each side)
Usable width: 495 points (50 to 545)

Common positions:
- margin = 50                     // Left edge
- margin + 30 = 80                // Description column start
- 340                             // QTY column
- 390                             // Unit Price column
- 470                             // Amount column
- 545 = (595 - margin)            // Right edge
```

---

## Part 9: Database-Driven Customization (Future Enhancement)

The current implementation uses hardcoded settings. You could move these to the database by:

1. Creating a `CompanySettings` entity (already exists in your codebase)
2. Loading settings from database in `generateInvoicePDF()`:
   ```typescript
   // Instead of hardcoded settings object:
   const settings = await getRepository(CompanySettings).findOne();
   ```

3. Creating an admin interface to customize without code changes

This would allow users to change PDF formatting without modifying code.

---

## Part 10: File References

- **Main PDF Service**: [backend/src/services/invoice-pdf.service.ts](backend/src/services/invoice-pdf.service.ts)
- **Invoice Entity**: [backend/src/entities/Invoice.ts](backend/src/entities/Invoice.ts)
- **Company Settings Entity**: [backend/src/entities/CompanySettings.ts](backend/src/entities/CompanySettings.ts) (for future database-driven config)
- **Cache Directory**: `backend/uploads/pdfs/cache/` (clear this when making changes)
- **PDF Output Directory**: `backend/uploads/pdfs/invoices/` (where generated PDFs are saved)

---

## Summary

You can customize the invoice PDF by:

1. **Quick settings** (no code changes needed):
   - Edit the `settings` object with company details, colors, margins, display options

2. **Layout changes** (requires code modifications):
   - Adjust X,Y coordinates for repositioning
   - Change font sizes and families
   - Add/remove sections
   - Modify spacing and alignment

3. **Testing**:
   - Clear the cache after making changes
   - Restart the backend
   - Generate a new invoice to see updates

4. **Advanced**:
   - Move settings to database for dynamic configuration
   - Add multiple line items
   - Custom sections and formatting
   - Different invoice types (quote, receipt, etc.)

Always clear the cache and restart the server when making changes for them to take effect!
