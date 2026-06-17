
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import type { CartItem } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';

interface ClientInfo {
  name: string;
  phone: string;
  address: string;
}

interface OrderTotals {
  subtotal: number;
  shipping: number;
  discount: number;
  vat: number;
  total: number;
  vatRate?: number;
  vatNumber?: string;
}

interface OfferInfo {
  title: string;
  quantity: number;
  unitPrice: number;
}

interface InvoiceOptions {
  language?: 'en' | 'ar';
  orderStatus?: string;
}

interface CompanyContact {
  phone: string;
  email: string;
  whatsapp: string;
  vatNumber: string;
  vatRate: number;
}

// ── Minimal B&W Palette ──
const K = {
  black:    [0, 0, 0]       as [number, number, number],
  dark:     [30, 30, 30]    as [number, number, number],
  text:     [60, 60, 60]    as [number, number, number],
  muted:    [120, 120, 120] as [number, number, number],
  light:    [180, 180, 180] as [number, number, number],
  line:     [200, 200, 200] as [number, number, number],
  bg:       [245, 245, 245] as [number, number, number],
  white:    [255, 255, 255] as [number, number, number],
  green:    [40, 140, 80]   as [number, number, number],
  red:      [180, 40, 40]   as [number, number, number],
};

// ── Arabic Font ──
let arabicFontCache: string | null = null;

const loadArabicFont = async (): Promise<string | null> => {
  if (arabicFontCache) return arabicFontCache;
  try {
    const res = await fetch('https://fonts.gstatic.com/s/amiri/v27/J7aRnpd8CGxBHqUp.ttf');
    if (!res.ok) throw new Error('Font fetch failed');
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    arabicFontCache = btoa(bin);
    return arabicFontCache;
  } catch (e) {
    console.error('Arabic font load error:', e);
    return null;
  }
};

const setupArabic = async (doc: jsPDF): Promise<boolean> => {
  try {
    const b64 = await loadArabicFont();
    if (!b64) return false;
    doc.addFileToVFS('Amiri-Regular.ttf', b64);
    doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
    return true;
  } catch { return false; }
};

const loadLogo = async (): Promise<string | null> => {
  try {
    const res = await fetch('/uploads/b209d6cf-cd6c-41b6-ac17-8fcb2b241da3.png');
    const blob = await res.blob();
    return new Promise(r => {
      const reader = new FileReader();
      reader.onloadend = () => r(reader.result as string);
      reader.onerror = () => r(null);
      reader.readAsDataURL(blob);
    });
  } catch { return null; }
};

const loadImageAsDataUrl = async (url: string): Promise<string | null> => {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise(r => {
      const reader = new FileReader();
      reader.onloadend = () => r(reader.result as string);
      reader.onerror = () => r(null);
      reader.readAsDataURL(blob);
    });
  } catch { return null; }
};

const fetchCompanyContact = async (): Promise<CompanyContact> => {
  try {
    const { data } = await supabase
      .from('contact_info')
      .select('phone, email, whatsapp, vat_number, vat_rate')
      .limit(1)
      .single();
    if (data) {
      return {
        phone: data.phone || '',
        email: data.email || '',
        whatsapp: data.whatsapp || '',
        vatNumber: data.vat_number || '',
        vatRate: data.vat_rate || 15,
      };
    }
  } catch { /* fallback */ }
  return { phone: '', email: '', whatsapp: '', vatNumber: '', vatRate: 15 };
};

const isArabic = (t: string) => /[\u0600-\u06FF\u0750-\u077F]/.test(t);
const toArNum = (n: number | string) => {
  const d = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
  return String(n).replace(/[0-9]/g, c => d[parseInt(c)]);
};
const fmtCur = (amt: number, rtl: boolean) =>
  rtl ? `${toArNum(amt.toFixed(2))} ر.س` : `${amt.toFixed(2)} SAR`;

const setFont = (doc: jsPDF, rtl: boolean, hasAr: boolean, style: 'normal' | 'bold' = 'normal') => {
  if (rtl && hasAr) {
    doc.setFont('Amiri', 'normal');
  } else {
    doc.setFont('helvetica', style);
  }
};

// ── Header: Clean & Minimal ──
const drawHeader = (doc: jsPDF, invNum: string, logo: string | null, rtl: boolean, hasAr: boolean) => {
  const w = 210;
  const margin = 20;

  // Thin top line
  doc.setDrawColor(...K.dark);
  doc.setLineWidth(0.8);
  doc.line(margin, 15, w - margin, 15);

  // Logo
  if (logo) {
    try {
      const lx = rtl ? w - margin - 28 : margin;
      doc.addImage(logo, 'PNG', lx, 20, 28, 28);
    } catch { /* skip */ }
  }

  // Company name
  const textX = rtl ? (logo ? w - margin - 34 : w - margin) : (logo ? margin + 34 : margin);
  doc.setTextColor(...K.dark);
  doc.setFontSize(14);
  setFont(doc, rtl, hasAr, 'bold');
  doc.text(
    rtl ? 'شركة نما للحلول الصناعية' : 'NAMA Industrial Solutions',
    textX, 28, { align: rtl ? 'right' : 'left' }
  );

  // Tagline
  doc.setFontSize(8);
  doc.setTextColor(...K.muted);
  setFont(doc, rtl, hasAr);
  doc.text(
    rtl ? 'الجودة والابتكار في الحلول الصناعية' : 'Quality & Innovation in Industrial Solutions',
    textX, 35, { align: rtl ? 'right' : 'left' }
  );

  // INVOICE title - opposite side
  const titleX = rtl ? margin : w - margin;
  const titleAlign = rtl ? 'left' : 'right';
  doc.setFontSize(24);
  setFont(doc, rtl, hasAr, 'bold');
  doc.setTextColor(...K.dark);
  doc.text(rtl ? 'فاتورة' : 'INVOICE', titleX, 28, { align: titleAlign });

  // Invoice number
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...K.muted);
  doc.text(rtl ? `${toArNum(invNum.replace(/\D+/g, ''))}#` : `#${invNum}`, titleX, 36, { align: titleAlign });

  // Bottom line
  doc.setDrawColor(...K.line);
  doc.setLineWidth(0.3);
  doc.line(margin, 52, w - margin, 52);

  return 58;
};

// ── Info Section: Two columns, no cards ──
const drawInfoSection = (doc: jsPDF, client: ClientInfo, y: number, rtl: boolean, hasAr: boolean) => {
  const margin = 20;
  const w = 210;
  const colW = (w - margin * 2 - 20) / 2;
  const leftX = rtl ? w - margin : margin;
  const rightX = rtl ? margin + colW : margin + colW + 20;
  const align = rtl ? 'right' : 'left' as const;

  const date = new Date();
  const dateStr = rtl
    ? `${toArNum(date.getFullYear())}/${toArNum(String(date.getMonth()+1).padStart(2,'0'))}/${toArNum(String(date.getDate()).padStart(2,'0'))}`
    : date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Left column: Invoice details
  const col1X = rtl ? w - margin : margin;

  doc.setFontSize(7);
  doc.setTextColor(...K.muted);
  setFont(doc, rtl, hasAr, 'bold');
  doc.text(rtl ? 'تاريخ الفاتورة' : 'DATE', col1X, y, { align });

  doc.setFontSize(10);
  doc.setTextColor(...K.dark);
  setFont(doc, rtl, hasAr);
  doc.text(dateStr, col1X, y + 6, { align });

  doc.setFontSize(7);
  doc.setTextColor(...K.muted);
  setFont(doc, rtl, hasAr, 'bold');
  doc.text(rtl ? 'حالة الدفع' : 'STATUS', col1X, y + 15, { align });

  doc.setFontSize(9);
  doc.setTextColor(...K.dark);
  setFont(doc, rtl, hasAr);
  doc.text(rtl ? 'مستحق الدفع' : 'Due on receipt', col1X, y + 21, { align });

  // Right column: Client info
  const col2X = rtl ? margin : w - margin;
  const align2 = rtl ? 'left' : 'right' as const;

  doc.setFontSize(7);
  doc.setTextColor(...K.muted);
  setFont(doc, rtl, hasAr, 'bold');
  doc.text(rtl ? 'فاتورة إلى' : 'BILL TO', col2X, y, { align: align2 });

  doc.setFontSize(10);
  doc.setTextColor(...K.dark);
  setFont(doc, rtl, hasAr, 'bold');
  doc.text(client.name, col2X, y + 6, { align: align2 });

  doc.setFontSize(9);
  doc.setTextColor(...K.text);
  doc.setFont('helvetica', 'normal');
  doc.text(client.phone, col2X, y + 12, { align: align2 });

  doc.setFontSize(8);
  doc.setTextColor(...K.muted);
  if (rtl && hasAr && isArabic(client.address)) setFont(doc, rtl, hasAr);
  else doc.setFont('helvetica', 'normal');
  const addrLines = doc.splitTextToSize(client.address, colW);
  doc.text(addrLines, col2X, y + 18, { align: align2 });

  // Separator
  const sepY = y + 28;
  doc.setDrawColor(...K.line);
  doc.setLineWidth(0.2);
  doc.line(margin, sepY, w - margin, sepY);

  return sepY + 6;
};

// ── Items Table ──
const drawTable = (
  doc: jsPDF,
  rows: string[][],
  headers: string[],
  startY: number,
  rtl: boolean,
  hasAr: boolean,
  imageDataUrls?: (string | null)[]
) => {
  const hasImages = imageDataUrls && imageDataUrls.some(img => img !== null);
  const imgColWidth = hasImages ? 16 : 0;

  const finalHeaders = hasImages
    ? (rtl ? [...headers, ''] : ['', ...headers])
    : headers;

  const finalRows = rows.map((row) => {
    if (hasImages) {
      return rtl ? [...row, ''] : ['', ...row];
    }
    return row;
  });

  autoTable(doc, {
    head: [finalHeaders],
    body: finalRows,
    startY,
    theme: 'plain',
    styles: {
      font: rtl && hasAr ? 'Amiri' : 'helvetica',
      fontSize: 9,
      cellPadding: { top: 6, bottom: 6, left: 5, right: 5 },
      lineColor: K.line,
      lineWidth: 0,
      textColor: K.dark,
      minCellHeight: hasImages ? 14 : 8,
    },
    headStyles: {
      fillColor: K.bg,
      textColor: K.dark,
      fontStyle: 'bold',
      fontSize: 8,
      halign: rtl ? 'right' : 'left',
      cellPadding: { top: 6, bottom: 6, left: 5, right: 5 },
    },
    bodyStyles: {
      halign: rtl ? 'right' : 'left',
    },
    alternateRowStyles: {
      fillColor: K.white,
    },
    columnStyles: hasImages ? (rtl ? {
      0: { halign: 'right', cellWidth: 34 },
      1: { halign: 'center', cellWidth: 18 },
      2: { halign: 'right', cellWidth: 30 },
      3: { cellWidth: 'auto' },
      4: { cellWidth: imgColWidth, halign: 'center' },
    } : {
      0: { cellWidth: imgColWidth, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { halign: 'right', cellWidth: 30 },
      3: { halign: 'center', cellWidth: 18 },
      4: { halign: 'right', cellWidth: 34 },
    }) : (rtl ? {
      0: { halign: 'right', cellWidth: 34 },
      1: { halign: 'center', cellWidth: 18 },
      2: { halign: 'right', cellWidth: 30 },
      3: { cellWidth: 'auto' },
    } : {
      0: { cellWidth: 'auto' },
      1: { halign: 'right', cellWidth: 30 },
      2: { halign: 'center', cellWidth: 18 },
      3: { halign: 'right', cellWidth: 34 },
    }),
    margin: { left: 20, right: 20 },
    didDrawCell: (data: any) => {
      if (data.section === 'body' && imageDataUrls && hasImages) {
        const imgColIndex = rtl ? finalHeaders.length - 1 : 0;
        if (data.column.index === imgColIndex) {
          const imgData = imageDataUrls[data.row.index];
          if (imgData) {
            try {
              const imgSize = 10;
              const x = data.cell.x + (data.cell.width - imgSize) / 2;
              const y = data.cell.y + (data.cell.height - imgSize) / 2;
              doc.addImage(imgData, 'JPEG', x, y, imgSize, imgSize);
            } catch { /* skip */ }
          }
        }
      }
    },
    didDrawPage: (data: any) => {
      // Bottom border after table
      const finalY = data.cursor?.y || 0;
      doc.setDrawColor(...K.line);
      doc.setLineWidth(0.3);
      doc.line(20, finalY, 190, finalY);
    },
  });

  return (doc as any).lastAutoTable.finalY;
};

// ── Summary ──
const drawSummary = (doc: jsPDF, totals: OrderTotals, y: number, rtl: boolean, hasAr: boolean) => {
  const boxX = rtl ? 20 : 115;
  const boxW = 75;
  const padL = boxX + 4;
  const padR = boxX + boxW - 4;
  const lAlign = rtl ? 'right' : 'left' as const;
  const rAlign = rtl ? 'left' : 'right' as const;
  const lX = rtl ? padR : padL;
  const rX = rtl ? padL : padR;

  let cy = y + 8;
  const rowH = 11;

  const drawRow = (label: string, value: string, bold = false) => {
    doc.setFontSize(9);
    doc.setTextColor(...(bold ? K.dark : K.text));
    setFont(doc, rtl, hasAr, bold ? 'bold' : 'normal');
    doc.text(label, lX, cy, { align: lAlign });
    doc.text(value, rX, cy, { align: rAlign });
    cy += rowH;
  };

  drawRow(rtl ? 'المجموع الفرعي' : 'Subtotal', fmtCur(totals.subtotal, rtl));
  drawRow(rtl ? 'التوصيل' : 'Shipping', fmtCur(totals.shipping, rtl));

  if (totals.discount > 0) {
    const dv = rtl ? `${toArNum(totals.discount.toFixed(2))} ر.س-` : `-${totals.discount.toFixed(2)} SAR`;
    doc.setTextColor(...K.green);
    drawRow(rtl ? 'الخصم' : 'Discount', dv);
  }

  if (totals.vat > 0) {
    const rate = totals.vatRate || 15;
    drawRow(rtl ? `ضريبة (${toArNum(rate)}%)` : `VAT (${rate}%)`, fmtCur(totals.vat, rtl));
  }

  // Divider
  doc.setDrawColor(...K.dark);
  doc.setLineWidth(0.5);
  doc.line(padL, cy - 4, padR, cy - 4);
  cy += 4;

  // Total
  doc.setFontSize(12);
  setFont(doc, rtl, hasAr, 'bold');
  doc.setTextColor(...K.black);
  doc.text(rtl ? 'الإجمالي' : 'Total', lX, cy, { align: lAlign });
  doc.text(fmtCur(totals.total, rtl), rX, cy, { align: rAlign });

  // VAT number
  if (totals.vatNumber) {
    cy += 12;
    doc.setFontSize(7);
    doc.setTextColor(...K.muted);
    setFont(doc, rtl, hasAr);
    doc.text(
      rtl ? `الرقم الضريبي: ${totals.vatNumber}` : `VAT No: ${totals.vatNumber}`,
      boxX + boxW / 2, cy, { align: 'center' }
    );
  }
};

// ── QR Code ──
const generateQRCode = async (data: string): Promise<string | null> => {
  try {
    return await QRCode.toDataURL(data, {
      width: 120,
      margin: 1,
      color: { dark: '#1E1E1E', light: '#FFFFFF' },
      errorCorrectionLevel: 'M',
    });
  } catch { return null; }
};

const buildQRData = (
  invNum: string,
  clientInfo: ClientInfo,
  totals: OrderTotals,
  items: { name: string; qty: number; price: number }[]
): string => JSON.stringify({
  inv: invNum,
  date: new Date().toISOString().split('T')[0],
  client: clientInfo.name,
  phone: clientInfo.phone,
  items: items.map(i => `${i.name} x${i.qty}`).join('; '),
  total: totals.total.toFixed(2),
  vat: totals.vat.toFixed(2),
  currency: 'SAR',
});

const drawQRCode = async (doc: jsPDF, qrData: string, y: number, rtl: boolean, hasAr: boolean) => {
  const qrImg = await generateQRCode(qrData);
  if (!qrImg) return;

  const qrSize = 24;
  const qrX = rtl ? 210 - 22 - qrSize : 22;

  doc.addImage(qrImg, 'PNG', qrX, y, qrSize, qrSize);

  doc.setFontSize(6);
  doc.setTextColor(...K.muted);
  setFont(doc, rtl, hasAr);
  doc.text(rtl ? 'امسح للتحقق' : 'Scan to verify', qrX + qrSize / 2, y + qrSize + 4, { align: 'center' });
};

// ── Footer ──
const drawFooter = (doc: jsPDF, rtl: boolean, hasAr: boolean, contact: CompanyContact) => {
  const ph = doc.internal.pageSize.height;
  const margin = 20;

  // Top line
  doc.setDrawColor(...K.line);
  doc.setLineWidth(0.3);
  doc.line(margin, ph - 28, 210 - margin, ph - 28);

  // Thank you
  doc.setTextColor(...K.dark);
  doc.setFontSize(9);
  setFont(doc, rtl, hasAr, 'bold');
  doc.text(rtl ? 'شكراً لتعاملكم معنا' : 'Thank you for your business', 105, ph - 21, { align: 'center' });

  // Contact details
  doc.setTextColor(...K.muted);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const parts = [contact.email, contact.phone, contact.whatsapp ? `WhatsApp: ${contact.whatsapp}` : ''].filter(Boolean);
  doc.text(parts.join('  ·  '), 105, ph - 14, { align: 'center' });

  // Website
  doc.setFontSize(6.5);
  doc.text('www.nama.sa', 105, ph - 9, { align: 'center' });

  // VAT
  if (contact.vatNumber) {
    doc.setFontSize(6);
    doc.text(
      rtl ? `الرقم الضريبي: ${contact.vatNumber}` : `VAT: ${contact.vatNumber}`,
      105, ph - 5, { align: 'center' }
    );
  }
};

// ── Stamp Watermark ──
const drawStampWatermark = (doc: jsPDF, rtl: boolean, hasAr: boolean, type: 'paid' | 'cancelled') => {
  const pageW = 210;
  const pageH = doc.internal.pageSize.height;
  const centerX = pageW / 2;
  const centerY = pageH / 2 - 10;

  doc.saveGraphicsState();

  const angle = -25 * (Math.PI / 180);
  const gState = new (doc as any).GState({ opacity: 0.08 });
  doc.setGState(gState);

  const color: [number, number, number] = type === 'paid' ? K.green : K.red;
  const text = type === 'paid'
    ? (rtl && hasAr ? 'مدفوع' : 'PAID')
    : (rtl && hasAr ? 'ملغي' : 'CANCELLED');

  doc.setTextColor(...color);
  doc.setFontSize(type === 'cancelled' ? 68 : 85);
  doc.setFont('helvetica', 'bold');

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  (doc as any).internal.write(
    `q ${cos.toFixed(4)} ${sin.toFixed(4)} ${(-sin).toFixed(4)} ${cos.toFixed(4)} ${(centerX * 2.835).toFixed(2)} ${((pageH - centerY) * 2.835).toFixed(2)} cm`
  );

  const textWidth = doc.getTextWidth(text);
  doc.text(text, -textWidth / 2, 0);

  doc.setDrawColor(...color);
  doc.setLineWidth(3);
  const rectW = textWidth + 24;
  const rectH = 40;
  doc.roundedRect(-rectW / 2, -rectH / 2 - 8, rectW, rectH, 4, 4, 'D');

  (doc as any).internal.write('Q');
  doc.restoreGraphicsState();
};

// ── Generate Invoice ──
export const generateInvoice = async (
  cartItems: CartItem[],
  clientInfo: ClientInfo,
  totals: OrderTotals,
  options: InvoiceOptions = {}
) => {
  const doc = new jsPDF();
  const invNum = `INV-${Date.now().toString().slice(-8)}`;
  const rtl = options.language === 'ar' || isArabic(clientInfo.name);

  const [hasAr, logo, contact, ...imageResults] = await Promise.all([
    rtl ? setupArabic(doc) : Promise.resolve(false),
    loadLogo(),
    fetchCompanyContact(),
    ...cartItems.map(item => {
      const imgUrl = (item as any).imageUrl || (item as any).image || '';
      return imgUrl ? loadImageAsDataUrl(imgUrl) : Promise.resolve(null);
    }),
  ]);

  const imageDataUrls = imageResults as (string | null)[];
  const ar = hasAr as boolean;

  if (!totals.vatRate && contact.vatRate) totals.vatRate = contact.vatRate;
  if (!totals.vatNumber && contact.vatNumber) totals.vatNumber = contact.vatNumber;

  const headerEndY = drawHeader(doc, invNum, logo, rtl, ar);
  const infoEndY = drawInfoSection(doc, clientInfo, headerEndY, rtl, ar);

  const headers = rtl
    ? ['الإجمالي', 'الكمية', 'السعر', 'المنتج']
    : ['Item', 'Price', 'Qty', 'Total'];

  const rows = cartItems.map(item => {
    const name = rtl ? ((item as any).nameAr || item.nameEn) : item.nameEn;
    const row = [
      name,
      `${item.price.toFixed(2)} ${rtl ? 'ر.س' : 'SAR'}`,
      item.quantity.toString(),
      `${(item.price * item.quantity).toFixed(2)} ${rtl ? 'ر.س' : 'SAR'}`,
    ];
    return rtl ? row.reverse() : row;
  });

  const tableEndY = drawTable(doc, rows, headers, infoEndY, rtl, ar, imageDataUrls);
  drawSummary(doc, totals, tableEndY + 8, rtl, ar);

  const qrItems = cartItems.map(item => ({
    name: rtl ? ((item as any).nameAr || item.nameEn) : item.nameEn,
    qty: item.quantity,
    price: item.price,
  }));
  const qrData = buildQRData(invNum, clientInfo, totals, qrItems);
  await drawQRCode(doc, qrData, tableEndY + 10, rtl, ar);

  drawFooter(doc, rtl, ar, contact);

  if (options.orderStatus === 'delivered' || options.orderStatus === 'completed') {
    drawStampWatermark(doc, rtl, ar, 'paid');
  } else if (options.orderStatus === 'cancelled') {
    drawStampWatermark(doc, rtl, ar, 'cancelled');
  }

  return { doc, pdf: doc, dataUri: doc.output('datauristring') };
};

// ── Order Invoice (Admin) ──
interface OrderItem {
  id: string;
  nameEn: string;
  nameAr: string;
  price: number;
  quantity: number;
  image: string;
}

export const generateOrderInvoice = async (
  orderItems: OrderItem[],
  clientInfo: ClientInfo,
  totals: OrderTotals,
  options: InvoiceOptions = {}
) => {
  const cartItems = orderItems.map(i => ({
    id: i.id, nameEn: i.nameEn, nameAr: i.nameAr,
    price: i.price, quantity: i.quantity, imageUrl: i.image,
  }));
  return generateInvoice(cartItems as any, clientInfo, totals, options);
};

// ── Offer Invoice ──
export const generateOfferInvoice = async (
  offer: OfferInfo,
  clientInfo: ClientInfo,
  totals: OrderTotals,
  options: InvoiceOptions = {}
) => {
  const doc = new jsPDF();
  const invNum = `OFF-${Date.now().toString().slice(-8)}`;
  const rtl = options.language === 'ar' || isArabic(offer.title);

  const [hasAr, logo, contact] = await Promise.all([
    rtl ? setupArabic(doc) : Promise.resolve(false),
    loadLogo(),
    fetchCompanyContact(),
  ]);

  const ar = hasAr as boolean;
  if (!totals.vatRate && contact.vatRate) totals.vatRate = contact.vatRate;
  if (!totals.vatNumber && contact.vatNumber) totals.vatNumber = contact.vatNumber;

  const headerEndY = drawHeader(doc, invNum, logo, rtl, ar);
  const infoEndY = drawInfoSection(doc, clientInfo, headerEndY, rtl, ar);

  const headers = rtl
    ? ['الإجمالي', 'الكمية', 'سعر الوحدة', 'العرض']
    : ['Offer', 'Unit Price', 'Qty', 'Total'];

  const row = [
    offer.title,
    `${offer.unitPrice.toFixed(2)} ${rtl ? 'ر.س' : 'SAR'}`,
    offer.quantity.toString(),
    `${(offer.unitPrice * offer.quantity).toFixed(2)} ${rtl ? 'ر.س' : 'SAR'}`,
  ];

  const tableEndY = drawTable(doc, [rtl ? row.reverse() : row], headers, infoEndY, rtl, ar);
  drawSummary(doc, totals, tableEndY + 8, rtl, ar);

  const qrData = buildQRData(invNum, clientInfo, totals, [
    { name: offer.title, qty: offer.quantity, price: offer.unitPrice },
  ]);
  await drawQRCode(doc, qrData, tableEndY + 10, rtl, ar);

  drawFooter(doc, rtl, ar, contact);

  return { pdf: doc, dataUri: doc.output('datauristring') };
};
