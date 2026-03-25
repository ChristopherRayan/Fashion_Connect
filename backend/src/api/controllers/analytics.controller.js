import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { analyticsService } from '../../services/analyticsService.js';
import { DailyAnalytics, MonthlyAnalytics, Invoice } from '../../models/analytics.model.js';
import PDFDocument from 'pdfkit';

// Get dashboard analytics
const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  
  const analytics = await analyticsService.getDashboardAnalytics(parseInt(days));
  
  res.status(200).json(
    new ApiResponse(200, analytics, "Dashboard analytics retrieved successfully")
  );
});

// Get daily analytics
const getDailyAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const query = {};
  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  const analytics = await DailyAnalytics.find(query).sort({ date: -1 });
  
  res.status(200).json(
    new ApiResponse(200, analytics, "Daily analytics retrieved successfully")
  );
});

// Get monthly analytics
const getMonthlyAnalytics = asyncHandler(async (req, res) => {
  const { year, month } = req.query;
  
  const query = {};
  if (year) query.year = parseInt(year);
  if (month) query.month = parseInt(month);
  
  const analytics = await MonthlyAnalytics.find(query)
    .populate('topProducts.product', 'name images')
    .populate('topDesigners.designer', 'name email')
    .sort({ year: -1, month: -1 });
  
  res.status(200).json(
    new ApiResponse(200, analytics, "Monthly analytics retrieved successfully")
  );
});

// Create invoice for order
const createInvoice = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  console.log('Creating invoice for order:', orderId);

  try {
    const invoice = await analyticsService.createInvoice(orderId);
    console.log('Invoice created successfully:', invoice.invoiceNumber);

    res.status(201).json(
      new ApiResponse(201, invoice, "Invoice created successfully")
    );
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw new ApiError(500, `Failed to create invoice: ${error.message}`);
  }
});

// Get user's invoices (for both customers and designers)
const getUserInvoices = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userRole = req.user.role;
  const { page = 1, limit = 10 } = req.query;

  const skip = (page - 1) * limit;

  // Build query based on user role
  let query;
  if (userRole === 'DESIGNER') {
    // Designers see invoices for orders they fulfilled
    query = { designer: userId };
  } else {
    // Customers see invoices for orders they placed
    query = { user: userId };
  }

  const invoices = await Invoice.find(query)
    .populate('order', 'status createdAt')
    .populate('user', 'name email')
    .populate('designer', 'name businessName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Invoice.countDocuments(query);

  res.status(200).json(
    new ApiResponse(200, {
      invoices,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalInvoices: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    }, `${userRole === 'DESIGNER' ? 'Designer' : 'User'} invoices retrieved successfully`)
  );
});

// Download invoice as PDF
const downloadInvoice = asyncHandler(async (req, res) => {
  const { invoiceId } = req.params;
  const userId = req.user._id;

  console.log('Download invoice request:', { invoiceId, userId });

  // Allow both customers and designers to download invoices
  const invoice = await Invoice.findOne({
    _id: invoiceId,
    $or: [
      { user: userId },      // Customer can download
      { designer: userId }   // Designer can also download
    ]
  })
    .populate('order')
    .populate('user', 'name email')
    .populate('designer', 'name email businessName')
    .populate('items.product', 'name');

  console.log('Found invoice:', invoice ? 'Yes' : 'No');

  if (!invoice) {
    throw new ApiError(404, "Invoice not found");
  }

  try {
    // Create PDF
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add content to PDF
    generateInvoicePDF(doc, invoice);

    // Finalize PDF
    doc.end();

    console.log('PDF generated successfully for invoice:', invoice.invoiceNumber);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new ApiError(500, "Failed to generate PDF");
  }
});

// Helper function to generate PDF content
function generateInvoicePDF(doc, invoice) {
  // Add watermark
  doc.save();
  doc.rotate(-45, { origin: [300, 400] });
  doc.fontSize(60)
     .fillColor('#f0f0f0')
     .text('FashionConnect', 100, 350, { align: 'center' });
  doc.restore();

  // Header
  doc.fillColor('#000000');
  doc.fontSize(20).text('INVOICE', 50, 50);
  doc.fontSize(10).text('FashionConnect', 50, 80);
  
  // Invoice details
  doc.fontSize(12)
     .text(`Invoice Number: ${invoice.invoiceNumber}`, 50, 120)
     .text(`Issue Date: ${invoice.issueDate.toLocaleDateString()}`, 50, 140)
     .text(`Status: ${invoice.status}`, 50, 160);
  
  // Billing information
  doc.text('Bill To:', 50, 200);
  doc.fontSize(10)
     .text(invoice.billingAddress.name, 50, 220)
     .text(invoice.billingAddress.street, 50, 235)
     .text(`${invoice.billingAddress.city}, ${invoice.billingAddress.country}`, 50, 250)
     .text(invoice.billingAddress.phone, 50, 265)
     .text(invoice.billingAddress.email, 50, 280);
  
  // Designer information
  doc.fontSize(10)
     .text('From:', 300, 200)
     .text(invoice.designer.businessName || invoice.designer.name, 300, 220)
     .text(invoice.designer.email, 300, 235);
  
  // Items table
  let yPosition = 320;
  doc.fontSize(12).text('Items:', 50, yPosition);
  yPosition += 20;
  
  // Table headers
  doc.fontSize(10)
     .text('Item', 50, yPosition)
     .text('Qty', 300, yPosition)
     .text('Price', 350, yPosition)
     .text('Total', 450, yPosition);
  
  yPosition += 20;
  doc.moveTo(50, yPosition).lineTo(500, yPosition).stroke();
  yPosition += 10;
  
  // Table rows
  invoice.items.forEach(item => {
    doc.text(item.name, 50, yPosition)
       .text(item.quantity.toString(), 300, yPosition)
       .text(`${item.price.toLocaleString()} MWK`, 350, yPosition)
       .text(`${item.total.toLocaleString()} MWK`, 450, yPosition);
    yPosition += 20;
  });
  
  // Totals
  yPosition += 20;
  doc.moveTo(300, yPosition).lineTo(500, yPosition).stroke();
  yPosition += 10;
  
  doc.text('Subtotal:', 350, yPosition)
     .text(`${invoice.subtotal.toLocaleString()} MWK`, 450, yPosition);
  yPosition += 15;
  
  if (invoice.shippingCost > 0) {
    doc.text('Shipping:', 350, yPosition)
       .text(`${invoice.shippingCost.toLocaleString()} MWK`, 450, yPosition);
    yPosition += 15;
  }
  
  if (invoice.tax > 0) {
    doc.text('Tax:', 350, yPosition)
       .text(`${invoice.tax.toLocaleString()} MWK`, 450, yPosition);
    yPosition += 15;
  }
  
  doc.fontSize(12)
     .text('Total:', 350, yPosition)
     .text(`${invoice.totalAmount.toLocaleString()} MWK`, 450, yPosition);
  
  // Footer
  if (invoice.notes) {
    yPosition += 40;
    doc.fontSize(10).text('Notes:', 50, yPosition);
    doc.text(invoice.notes, 50, yPosition + 15);
  }
  
  yPosition += 60;
  doc.fontSize(8)
     .text('Thank you for your business!', 50, yPosition)
     .text('This is a computer-generated invoice.', 50, yPosition + 15);
}

// Alternative download invoice function for order routes (to avoid ad blocker issues)
const downloadInvoiceByOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user._id;

  console.log('Download invoice by order request:', { orderId, userId });

  // First, find or create the invoice for this order
  let invoice = await Invoice.findOne({ order: orderId });

  if (!invoice) {
    // Create invoice if it doesn't exist
    try {
      invoice = await analyticsService.createInvoice(orderId);
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw new ApiError(500, `Failed to create invoice: ${error.message}`);
    }
  }

  // Check if user has permission to download this invoice
  const hasPermission = invoice.user.toString() === userId.toString() ||
                       invoice.designer.toString() === userId.toString();

  if (!hasPermission) {
    throw new ApiError(403, "You don't have permission to download this invoice");
  }

  // Populate the invoice with necessary data
  await invoice.populate('order');
  await invoice.populate('user', 'name email');
  await invoice.populate('designer', 'name email businessName');
  await invoice.populate('items.product', 'name');

  console.log('Found invoice for download:', invoice.invoiceNumber);

  // Set response headers for PDF download
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);

  // Create PDF document
  const doc = new PDFDocument({ margin: 50 });

  // Pipe the PDF to the response
  doc.pipe(res);

  // Generate PDF content (same as original downloadInvoice function)
  generateInvoicePDF(doc, invoice);

  // Finalize the PDF
  doc.end();
});

export {
  getDashboardAnalytics,
  getDailyAnalytics,
  getMonthlyAnalytics,
  createInvoice,
  getUserInvoices,
  downloadInvoice,
  downloadInvoiceByOrder
};
