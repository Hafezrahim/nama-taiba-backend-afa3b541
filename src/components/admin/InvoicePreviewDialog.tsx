import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Loader2, FileText, Printer } from 'lucide-react';
import { generateOrderInvoice } from '@/utils/invoiceGenerator';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';

interface OrderForInvoice {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  status?: string;
}

interface OrderItemForInvoice {
  id: string;
  product_name_en: string;
  product_name_ar: string;
  price: number;
  quantity: number;
}

interface InvoicePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderForInvoice | null;
  orderItems: OrderItemForInvoice[];
}

const InvoicePreviewDialog = ({ open, onOpenChange, order, orderItems }: InvoicePreviewDialogProps) => {
  const { t, language } = useLanguage();
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate preview when dialog opens with valid data
  useEffect(() => {
    if (!open || !order || orderItems.length === 0) return;
    
    let cancelled = false;
    const generate = async () => {
      setIsGenerating(true);
      try {
        const { doc } = await generateOrderInvoice(
          orderItems.map(item => ({
            id: item.id,
            nameEn: item.product_name_en,
            nameAr: item.product_name_ar,
            price: item.price,
            quantity: item.quantity,
            image: '',
          })),
          {
            name: order.customer_name,
            phone: order.customer_phone,
            address: order.customer_address,
          },
          {
            subtotal: order.subtotal,
            shipping: order.shipping,
            discount: order.discount,
            vat: 0,
            total: order.total,
          },
          { language: language as 'en' | 'ar', orderStatus: order.status }
        );
        if (cancelled) return;
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        setPdfBlobUrl(url);
        setPdfDoc(doc);
      } catch (error) {
        console.error('Error generating invoice preview:', error);
        if (!cancelled) {
          toast({
            title: t('Error', 'خطأ'),
            description: t('Failed to generate invoice preview', 'فشل إنشاء معاينة الفاتورة'),
            variant: 'destructive',
          });
        }
      } finally {
        if (!cancelled) setIsGenerating(false);
      }
    };
    generate();
    return () => { cancelled = true; };
  }, [open, order, orderItems, language]);

  const handleDownload = () => {
    if (!pdfDoc || !order) return;
    pdfDoc.save(`invoice-${order.id.slice(0, 8)}.pdf`);
    toast({
      title: t('Invoice Downloaded', 'تم تحميل الفاتورة'),
      description: t('Invoice has been saved to your device', 'تم حفظ الفاتورة على جهازك'),
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
      setPdfDoc(null);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {t('Invoice Preview', 'معاينة الفاتورة')} - #{order?.id.slice(0, 8)}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 rounded-lg overflow-hidden border bg-muted/30">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground font-medium">
                {t('Generating invoice...', 'جاري إنشاء الفاتورة...')}
              </p>
            </div>
          ) : pdfBlobUrl ? (
            <object
              data={pdfBlobUrl}
              type="application/pdf"
              className="w-full h-full border-0"
            >
              <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
                <FileText className="h-16 w-16 text-muted-foreground opacity-40" />
                <p className="text-muted-foreground font-medium">
                  {t('PDF preview is blocked by your browser.', 'تم حظر معاينة PDF بواسطة المتصفح.')}
                </p>
                <Button variant="outline" onClick={handleDownload} className="gap-2">
                  <Download className="h-4 w-4" />
                  {t('Download Invoice Instead', 'تحميل الفاتورة بدلاً من ذلك')}
                </Button>
              </div>
            </object>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              {t('No preview available', 'لا توجد معاينة متاحة')}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {t('Close', 'إغلاق')}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (!pdfDoc) return;
              const blob = pdfDoc.output('blob');
              const url = URL.createObjectURL(blob);
              const printWindow = window.open(url);
              if (printWindow) {
                printWindow.onload = () => {
                  printWindow.print();
                };
              }
            }}
            disabled={!pdfDoc || isGenerating}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            {t('Print', 'طباعة')}
          </Button>
          <Button
            onClick={handleDownload}
            disabled={!pdfDoc || isGenerating}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {t('Download Invoice', 'تحميل الفاتورة')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoicePreviewDialog;
