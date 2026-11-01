const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const BRAND_COLOR = '#3d5cff';
const INK = '#1e293b';
const MUTED = '#64748b';
const LINE = '#e2e8f0';
const GREEN = '#0a9689';   // fully paid
const YELLOW = '#ca8a04';  // partially paid
const RED = '#dc2626';     // unpaid
const EPSILON = 0.01;

// Only the most recent payments are listed individually, bounding how tall
// the payment history section can grow (this is also part of what keeps the
// whole invoice on a single page - see the page-break note further down).
const MAX_PAYMENTS_LISTED = 8;

// pdfkit only embeds PNG and JPEG. Rather than trust the uploaded file's
// extension or browser-reported mimetype (which can lie, or be a format
// pdfkit doesn't support, like webp), sniff the actual file bytes - any
// other format is skipped instead of letting pdfkit throw partway through
// building the document.
function isEmbeddableImage(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(8);
    fs.readSync(fd, buf, 0, 8, 0);
    fs.closeSync(fd);
    const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
    const isJpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    return isPng || isJpeg;
  } catch (e) {
    return false;
  }
}

// Coerces a possibly-missing numeric field to a safe number. Fixes invoices
// created before `amountPaid`/`balanceDue` existed on the schema (an older
// business's historical invoices) throwing a TypeError on `.toLocaleString()`
// when the raw stored document simply doesn't have that field at all.
function num(value, fallback = 0) {
  return typeof value === 'number' && !Number.isNaN(value) ? value : fallback;
}

/**
 * Streams a professional invoice PDF directly to an HTTP response.
 * `res` must not have anything else written to it yet.
 *
 * invoice: populated Invoice doc (customer, subscription) - amount,
 *          amountPaid, balanceDue, status ('pending' | 'partial' | 'paid')
 * business: Business doc (name, address, logoUrl, type), with `owner`
 *           populated to { fullName } so the signature line shows an
 *           actual person, not just the business name.
 * payments: array of Payment docs applied to this invoice, oldest first,
 *           each with `recordedBy` populated to { fullName, role } so the
 *           PDF shows which staff member (owner/manager/receptionist)
 *           took each payment.
 *
 * IMPORTANT: every required field is validated at the very top, before this
 * function touches `res` in any way (no headers set, nothing piped). This
 * is deliberate - validating (and possibly throwing) *after* `doc.pipe(res)`
 * had already started would mean a caller's catch block sending a clean
 * JSON error response collides with pdfkit still trying to write to that
 * now-closed response on a later tick, crashing the entire Node process.
 * Throwing early means the caller's try/catch can always safely send a
 * normal error response - nothing has touched the stream yet when that happens.
 */
function renderInvoicePdf({ invoice, business, payments = [] }, res) {
  if (!invoice) throw new Error('Invoice is required to generate a PDF.');
  if (!business) throw new Error('Business record not found for this invoice.');
  if (!invoice.customer) throw new Error('Customer record not found for this invoice.');

  // Every money/amount value used below goes through these locals instead of
  // reading invoice.amount/amountPaid/balanceDue directly, so an older
  // invoice missing a field entirely (pre-dating when that field was added
  // to the schema) can never throw here - it just falls back sensibly.
  const amount = num(invoice.amount);
  const amountPaid = num(invoice.amountPaid);
  const balanceDue = num(invoice.balanceDue, Math.max(0, amount - amountPaid));

  // Hard safety net: if the response stream errors *after* we do start
  // writing to it (client disconnected mid-download, a late pdfkit flush
  // after we already ended the response, etc.), log it instead of letting
  // Node treat an unhandled 'error' event on the response as a fatal,
  // process-crashing exception.
  res.on('error', (err) => {
    console.error('Invoice PDF response stream error:', err.message);
  });

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.on('error', (err) => {
    console.error('PDF generation stream error:', err.message);
    if (!res.writableEnded) res.end();
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${invoice.invoiceNumber}.pdf"`);
  doc.pipe(res);

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const rightEdge = pageWidth + 10; // text boxes starting at x=0 reach the true right margin
  let cursorY = 50;

  // ---- Header: logo + business identity ----
  let logoDrawn = false;
  if (business.logoUrl && business.logoUrl.startsWith('/uploads/')) {
    const logoPath = path.join(__dirname, '..', business.logoUrl.replace(/^\//, ''));
    if (fs.existsSync(logoPath) && isEmbeddableImage(logoPath)) {
      try {
        doc.image(logoPath, 50, cursorY, { width: 64, height: 64, fit: [64, 64] });
        logoDrawn = true;
      } catch (e) {
        // Fall back to text-only header below - never let a bad logo break the invoice.
      }
    }
  }

  const textX = logoDrawn ? 128 : 50;
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(18).text(business.name, textX, cursorY, { width: pageWidth - (textX - 50) });
  doc.fillColor(MUTED).font('Helvetica').fontSize(9).text(
    `${business.type}${business.customType ? ` — ${business.customType}` : ''}`,
    textX,
    doc.y + 2
  );
  if (business.address) {
    doc.fillColor(MUTED).fontSize(9).text(business.address, textX, doc.y + 2, { width: pageWidth - (textX - 50) });
  }
  doc.fillColor(MUTED).fontSize(9).text(`Business ID: ${business.businessId || '—'}`, textX, doc.y + 2);

  cursorY = Math.max(doc.y, cursorY + 64) + 16;

  // ---- Title + invoice meta, right aligned ----
  doc.fillColor(BRAND_COLOR).font('Helvetica-Bold').fontSize(20).text('INVOICE', 50, cursorY, { align: 'right', width: pageWidth });
  doc.fillColor(MUTED).font('Helvetica').fontSize(9).text(`Invoice #: ${invoice.invoiceNumber}`, 50, doc.y + 3, { align: 'right', width: pageWidth });
  doc.text(`Issued: ${new Date(invoice.issuedAt).toLocaleDateString()}`, 50, doc.y + 1, { align: 'right', width: pageWidth });

  cursorY = doc.y + 16;
  doc.moveTo(50, cursorY).lineTo(50 + pageWidth, cursorY).strokeColor(LINE).lineWidth(1).stroke();
  cursorY += 14;

  // ---- Bill To / Plan summary, two columns ----
  const colWidth = pageWidth / 2 - 10;
  doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(9).text('BILLED TO', 50, cursorY);
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(12).text(invoice.customer.name || 'Customer', 50, doc.y + 3, { width: colWidth });
  doc.fillColor(MUTED).font('Helvetica').fontSize(9).text(`Customer ID: ${invoice.customer.customerId || '—'}`, 50, doc.y + 1);
  if (invoice.customer.email) doc.text(invoice.customer.email, 50, doc.y + 1);
  if (invoice.customer.phone) doc.text(invoice.customer.phone, 50, doc.y + 1);

  const rightColX = 50 + colWidth + 20;
  const summaryTop = cursorY;
  doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(9).text('SUBSCRIPTION PLAN', rightColX, summaryTop);
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(12).text(invoice.planName || 'Plan', rightColX, summaryTop + 13, { width: colWidth });
  doc.fillColor(MUTED).font('Helvetica').fontSize(9).text(`Billing cycle: ${(invoice.billingCycle || '').replace('_', ' ') || '—'}`, rightColX, doc.y + 1);
  if (invoice.subscription?.startDate && invoice.subscription?.endDate) {
    doc.text(
      `Period: ${new Date(invoice.subscription.startDate).toLocaleDateString()} – ${new Date(invoice.subscription.endDate).toLocaleDateString()}`,
      rightColX,
      doc.y + 1
    );
  }
  const lastPayment = payments[payments.length - 1];
  if (lastPayment) {
    doc.text(`Last payment: ${new Date(lastPayment.paidAt).toLocaleDateString()}`, rightColX, doc.y + 1);
    doc.text(`Method: ${(lastPayment.method || '').replace('_', ' ').toUpperCase()}`, rightColX, doc.y + 1);
  }

  cursorY = Math.max(doc.y, 185) + 16;

  // ---- Line-item table ----
  const tableTop = cursorY;
  doc.rect(50, tableTop, pageWidth, 24).fill('#f1f5f9');
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(9);
  doc.text('DESCRIPTION', 60, tableTop + 7);
  doc.text('BILLING CYCLE', 300, tableTop + 7);
  doc.text('PLAN AMOUNT', 0, tableTop + 7, { align: 'right', width: rightEdge });

  const rowTop = tableTop + 24;
  doc.font('Helvetica').fontSize(10).fillColor(INK);
  doc.text(`${invoice.planName || 'Plan'} Subscription`, 60, rowTop + 8, { width: 220 });
  doc.text((invoice.billingCycle || '').replace('_', ' '), 300, rowTop + 8);
  doc.text(`Rs. ${amount.toLocaleString('en-IN')}`, 0, rowTop + 8, { align: 'right', width: rightEdge });

  doc.moveTo(50, rowTop + 28).lineTo(50 + pageWidth, rowTop + 28).strokeColor(LINE).stroke();

  // ---- Payment transaction history - shows every partial payment AND who
  // recorded it (Owner / Manager / Receptionist). Capped to the most recent
  // MAX_PAYMENTS_LISTED entries: this is what keeps the invoice reliably on
  // a single page even for a long-running installment-style balance, rather
  // than growing without bound and forcing extra pages. ----
  let historyBottom = rowTop + 28;
  if (payments.length > 0) {
    const shown = payments.slice(-MAX_PAYMENTS_LISTED);
    const omitted = payments.length - shown.length;
    const histTop = historyBottom + 10;
    doc.font('Helvetica-Bold').fontSize(9).fillColor(MUTED).text('PAYMENT HISTORY', 60, histTop);
    let rowY = histTop + 14;
    shown.forEach((p, i) => {
      const recordedByName = p.recordedBy?.fullName || 'Unknown';
      const recordedByRole = p.recordedBy?.role ? ` (${p.recordedBy.role})` : '';
      doc.font('Helvetica').fontSize(9).fillColor(INK);
      doc.text(
        `${i + 1}. ${new Date(p.paidAt).toLocaleDateString()} — ${(p.method || '').replace('_', ' ').toUpperCase()} — recorded by ${recordedByName}${recordedByRole}`,
        60,
        rowY,
        { width: 360 }
      );
      doc.text(`Rs. ${num(p.amount).toLocaleString('en-IN')}`, 0, rowY, { align: 'right', width: rightEdge });
      rowY += 13;
    });
    if (omitted > 0) {
      doc.font('Helvetica-Oblique').fontSize(8).fillColor(MUTED).text(`+ ${omitted} earlier payment${omitted === 1 ? '' : 's'} not shown`, 60, rowY);
      rowY += 13;
    }
    historyBottom = rowY;
  }

  // ---- Amount summary: Plan amount, Paid, Balance Due ----
  const summaryY = historyBottom + 10;
  doc.font('Helvetica').fontSize(10).fillColor(MUTED);
  doc.text('Total Subscription Amount', 300, summaryY);
  doc.fillColor(INK).text(`Rs. ${amount.toLocaleString('en-IN')}`, 0, summaryY, { align: 'right', width: rightEdge });

  doc.fillColor(MUTED).text('Amount Paid', 300, summaryY + 15);
  doc.fillColor(GREEN).text(`Rs. ${amountPaid.toLocaleString('en-IN')}`, 0, summaryY + 15, { align: 'right', width: rightEdge });

  doc.moveTo(300, summaryY + 32).lineTo(50 + pageWidth, summaryY + 32).strokeColor(LINE).stroke();

  const balanceColor = balanceDue > EPSILON ? RED : GREEN;
  doc.font('Helvetica-Bold').fontSize(12).fillColor(INK).text('Balance Due (Pending)', 300, summaryY + 40);
  doc.fillColor(balanceColor).text(`Rs. ${balanceDue.toLocaleString('en-IN')}`, 0, summaryY + 40, { align: 'right', width: rightEdge });

  // ---- Transaction status ----
  const statusTop = summaryY + 66;
  const STATUS_META = {
    paid: { label: 'FULLY PAID', color: GREEN },
    partial: { label: 'PARTIALLY PAID', color: YELLOW },
    pending: { label: 'UNPAID', color: RED },
  };
  const meta = STATUS_META[invoice.status] || STATUS_META.pending;
  doc.font('Helvetica-Bold').fontSize(10).fillColor(MUTED).text('Transaction Status:', 300, statusTop);
  doc.fillColor(meta.color).text(meta.label, 420, statusTop);

  // ---- Stamp + signature block ----
  // Everything above this point has a *dynamic* height - it grows with the
  // number of payments (capped above, but still variable). The stamp and
  // signature are positioned relative to that real content height, with a
  // compact, carefully-measured gap - generous enough that the stamp never
  // overlaps the amount figures above it, but tight enough that a normal
  // invoice (1-8 payments) reliably fits on a single page instead of
  // spilling onto an unwanted second page.
  let blockTop = statusTop + 18;

  // Page-break safety net for the rare pathological case (e.g. an unusually
  // long business name/address wrapping several extra lines): only kicks in
  // if there's genuinely not enough room left, not on every normal invoice.
  const REMAINING_BLOCK_HEIGHT = 125;
  if (blockTop + REMAINING_BLOCK_HEIGHT > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
    blockTop = 60;
  }

  // ---- Stamp: green = fully paid, yellow = partially paid, red = unpaid. ----
  const stampCenterX = 140;
  const stampCenterY = blockTop + 32;
  doc.save();
  doc.rotate(-16, { origin: [stampCenterX, stampCenterY] });
  doc.roundedRect(stampCenterX - 85, stampCenterY - 27, 170, 54, 8).lineWidth(3).strokeColor(meta.color).stroke();
  doc.fillColor(meta.color).font('Helvetica-Bold').fontSize(invoice.status === 'partial' ? 16 : 21).text(
    meta.label,
    stampCenterX - 85,
    stampCenterY - (invoice.status === 'partial' ? 9 : 11),
    { width: 170, align: 'center' }
  );
  doc.restore();

  // ---- Signature: the business Owner's name, per requirement that the
  // final authorized signatory shown is the Owner regardless of which role
  // (Owner/Manager/Receptionist) actually recorded the payment above. ----
  const ownerName = business.owner?.fullName || business.name;
  const sigTop = blockTop + 78;
  doc.moveTo(350, sigTop).lineTo(50 + pageWidth, sigTop).strokeColor(LINE).stroke();
  doc.font('Helvetica').fontSize(9).fillColor(MUTED).text('Authorized Signature', 350, sigTop + 6);
  doc.font('Helvetica-Bold').fontSize(10).fillColor(INK).text(ownerName, 350, sigTop - 24);
  doc.font('Helvetica').fontSize(8).fillColor(MUTED).text(`Owner, ${business.name}`, 350, sigTop - 12);

  doc.font('Helvetica').fontSize(8).fillColor(MUTED).text(
    'This is a system-generated invoice from SubTrack and does not require a physical signature to be valid.',
    50,
    sigTop + 24,
    { width: pageWidth, align: 'center' }
  );

  doc.end();
}

module.exports = { renderInvoicePdf };
