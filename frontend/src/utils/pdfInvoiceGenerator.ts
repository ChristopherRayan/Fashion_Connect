import { Order } from '../services/orderService';
import jsPDF from 'jspdf';

// PDF Invoice Generator using jsPDF
export class PDFInvoiceGenerator {
  async generateInvoicePDF(order: Order): Promise<Blob> {
    try {
      // Create new PDF document
      const doc = new jsPDF();
      
      // Add watermarks
      this.addWatermarks(doc);
      
      // Add invoice content
      this.addInvoiceContent(doc, order);
      
      // Convert to blob
      const pdfBlob = doc.output('blob');
      return pdfBlob;
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to simple text-based PDF
      return this.createSimplePDF(order);
    }
  }

  private addWatermarks(doc: jsPDF) {
    try {
      // Save current graphics state
      doc.saveGraphicsState();

      // Set very subtle watermark properties
      doc.setTextColor(241, 196, 15); // Yellow color
      doc.setFontSize(36); // Reduced from 48
      doc.setFont('helvetica', 'normal'); // Changed from bold to normal

      // Set moderate opacity for visible but subtle watermarks
      doc.setGState(doc.GState({ opacity: 0.43 })); // Increased by 0.4 from 0.03

      // Get page dimensions
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Add fewer, more subtle diagonal watermarks
      const watermarks = ['FASHIONCONNECT', 'INVOICE'];

      // Reduced number of watermarks for less visual clutter
      for (let i = 0; i < 2; i++) { // Reduced from 3 to 2
        for (let j = 0; j < 2; j++) {
          const x = (pageWidth / 3) * (i + 1);
          const y = (pageHeight / 3) * (j + 1);

          doc.text(watermarks[j], x, y, {
            angle: -30,
            align: 'center'
          });
        }
      }

      // Restore graphics state
      doc.restoreGraphicsState();
    } catch (error) {
      console.warn('Failed to add watermarks:', error);
    }
  }

  private addInvoiceContent(doc: jsPDF, order: Order) {
    try {
      const customer = order.buyer || order.user || (order as any).customer;
      let yPosition = 30;

      // Reset text color for content
      doc.setTextColor(0, 0, 0);
      
      // Header
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('INVOICE', 105, yPosition, { align: 'center' });
      yPosition += 20;

      // Company Info
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('FashionConnect', 20, yPosition);
      yPosition += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Fashion Platform & Marketplace', 20, yPosition);
      yPosition += 6;
      doc.text('Email: support@fashionconnect.com', 20, yPosition);
      yPosition += 15;

      // Invoice Details
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Invoice #: ${order._id.slice(-8)}`, 20, yPosition);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 120, yPosition);
      yPosition += 15;

      // Customer Info
      doc.text('Bill To:', 20, yPosition);
      yPosition += 8;
      doc.setFont('helvetica', 'normal');
      doc.text(`${customer?.name || 'Customer'}`, 20, yPosition);
      yPosition += 6;
      doc.text(`${customer?.email || 'N/A'}`, 20, yPosition);
      yPosition += 15;

      // Items Header
      doc.setFont('helvetica', 'bold');
      doc.text('Item', 20, yPosition);
      doc.text('Qty', 120, yPosition);
      doc.text('Price', 150, yPosition);
      doc.text('Total', 180, yPosition);
      yPosition += 8;

      // Draw line
      doc.line(20, yPosition, 190, yPosition);
      yPosition += 10;

      // Items
      doc.setFont('helvetica', 'normal');
      let subtotal = 0;
      
      if (order.items && order.items.length > 0) {
        order.items.forEach((item: any) => {
          const itemTotal = (item.price || 0) * (item.quantity || 1);
          subtotal += itemTotal;
          
          doc.text(item.name || 'Item', 20, yPosition);
          doc.text((item.quantity || 1).toString(), 120, yPosition);
          doc.text(`MWK ${(item.price || 0).toLocaleString()}`, 150, yPosition);
          doc.text(`MWK ${itemTotal.toLocaleString()}`, 180, yPosition);
          yPosition += 8;
        });
      }

      yPosition += 10;
      doc.line(20, yPosition, 190, yPosition);
      yPosition += 10;

      // Totals
      doc.setFont('helvetica', 'bold');
      doc.text(`Subtotal: MWK ${subtotal.toLocaleString()}`, 150, yPosition);
      yPosition += 8;
      doc.text(`Total: MWK ${(order.totalAmount || subtotal).toLocaleString()}`, 150, yPosition);
      yPosition += 20;

      // Footer
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Thank you for shopping with FashionConnect!', 105, yPosition, { align: 'center' });
      yPosition += 6;
      doc.text('This is a computer-generated invoice.', 105, yPosition, { align: 'center' });
      
    } catch (error) {
      console.error('Error adding invoice content:', error);
      // Add basic error message to PDF
      doc.setTextColor(255, 0, 0);
      doc.text('Error generating invoice content', 20, 50);
    }
  }

  private createSimplePDF(order: Order): Blob {
    try {
      // Create a basic PDF as fallback
      const doc = new jsPDF();
      const customer = order.buyer || order.user || (order as any).customer;
      
      doc.setFontSize(20);
      doc.text('INVOICE', 105, 30, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`Invoice #: ${order._id.slice(-8)}`, 20, 50);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 60);
      doc.text(`Customer: ${customer?.name || 'N/A'}`, 20, 70);
      doc.text(`Total: MWK ${(order.totalAmount || 0).toLocaleString()}`, 20, 80);
      
      doc.text('Generated by FashionConnect', 105, 200, { align: 'center' });
      
      return doc.output('blob');
    } catch (error) {
      console.error('Error creating simple PDF:', error);
      // Return HTML as final fallback
      return this.createHTMLPDF(order);
    }
  }

  private createHTMLPDF(order: Order): Blob {
    const customer = order.buyer || order.user || (order as any).customer;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Invoice - Order #${order._id.slice(-8)}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 40px;
            background: linear-gradient(45deg, rgba(241,196,15,0.1) 0%, rgba(241,196,15,0.05) 100%);
          }
          .header { text-align: center; margin-bottom: 30px; }
          .invoice-details { margin-bottom: 20px; }
          .customer-info { margin-bottom: 20px; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .items-table th { background-color: #f2f2f2; }
          .total { text-align: right; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            font-size: 36px;
            color: rgba(241,196,15,0.43);
            font-weight: normal;
            z-index: -1;
          }
        </style>
      </head>
      <body>
        <div class="watermark">FASHIONCONNECT INVOICE</div>
        
        <div class="header">
          <h1>INVOICE</h1>
          <h2>FashionConnect</h2>
          <p>Fashion Platform & Marketplace</p>
        </div>
        
        <div class="invoice-details">
          <p><strong>Invoice #:</strong> ${order._id.slice(-8)}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="customer-info">
          <h3>Bill To:</h3>
          <p>${customer?.name || 'Customer'}</p>
          <p>${customer?.email || 'N/A'}</p>
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items?.map((item: any) => `
              <tr>
                <td>${item.name || 'Item'}</td>
                <td>${item.quantity || 1}</td>
                <td>MWK ${(item.price || 0).toLocaleString()}</td>
                <td>MWK ${((item.price || 0) * (item.quantity || 1)).toLocaleString()}</td>
              </tr>
            `).join('') || '<tr><td colspan="4">No items</td></tr>'}
          </tbody>
        </table>
        
        <div class="total">
          <p><strong>Total: MWK ${(order.totalAmount || 0).toLocaleString()}</strong></p>
        </div>
        
        <div class="footer">
          <p>Thank you for shopping with FashionConnect!</p>
          <p>This is a computer-generated invoice.</p>
        </div>
      </body>
      </html>
    `;

    return new Blob([htmlContent], { type: 'text/html' });
  }
}

export const pdfInvoiceGenerator = new PDFInvoiceGenerator();
