"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
/**
 * Test specific invoice PDF generation with size reporting
 */
router.get('/test-invoice-size/:invoiceId', async (req, res) => {
    try {
        const { AppDataSource } = await Promise.resolve().then(() => __importStar(require('../config/database')));
        const { Invoice } = await Promise.resolve().then(() => __importStar(require('../entities/Invoice')));
        const invoiceRepo = AppDataSource.getRepository(Invoice);
        const invoice = await invoiceRepo.findOne({ where: { id: req.params.invoiceId } });
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        console.log('Testing PDF size for:', {
            id: invoice.id,
            invoiceNumber: invoice.invoice_number,
            amount: invoice.amount
        });
        const { InvoicePDFService } = await Promise.resolve().then(() => __importStar(require('../services/invoice-pdf.service')));
        const pdfBuffer = await InvoicePDFService.generateInvoicePDF(invoice);
        if (!pdfBuffer) {
            return res.status(500).json({ error: 'Failed to generate PDF' });
        }
        const sizeKB = pdfBuffer.length / 1024;
        const sizeMB = (pdfBuffer.length / (1024 * 1024)).toFixed(2);
        console.log('PDF Size Analysis:', {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoice_number,
            amount: invoice.amount,
            sizeBytes: pdfBuffer.length,
            sizeKB: sizeKB.toFixed(2),
            sizeMB: sizeMB,
            recommendedViewer: parseFloat(sizeMB) > 1.0 ? 'Browser Viewer Recommended' : 'React-PDF Should Work'
        });
        res.json({
            success: true,
            analysis: {
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoice_number,
                amount: invoice.amount,
                sizeBytes: pdfBuffer.length,
                sizeKB: sizeKB.toFixed(2),
                sizeMB: sizeMB,
                recommendedViewer: parseFloat(sizeMB) > 1.0 ? 'Browser Viewer Recommended' : 'React-PDF Should Work'
            }
        });
    }
    catch (error) {
        console.error('Invoice size test failed:', error);
        res.status(500).json({ error: `Failed to test invoice: ${error.message}` });
    }
});
exports.default = router;
//# sourceMappingURL=invoice-size-test.routes.js.map