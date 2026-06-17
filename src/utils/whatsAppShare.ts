
import { toast } from '@/hooks/use-toast';
import type { CartItem } from '@/contexts/CartContext';

interface ClientInfo {
  name: string;
  phone: string;
  address: string;
}

interface OrderTotals {
  subtotal: number;
  shipping: number;
  discount: number;
  vat?: number;
  total: number;
}

export const handleWhatsAppShare = (
  cartItems: CartItem[],
  clientInfo: ClientInfo,
  totals: OrderTotals
) => {
  try {
    const itemsList = cartItems.map(item => 
      `- ${item.nameEn} x${item.quantity}: ${(item.price * item.quantity).toFixed(2)} SAR`
    ).join('\n');
    
    const message = encodeURIComponent(
      `New Order:\n\n` +
      `Client: ${clientInfo.name}\n` +
      `Phone: ${clientInfo.phone}\n` +
      `Address: ${clientInfo.address}\n\n` +
      `Items:\n${itemsList}\n\n` +
      `Subtotal: ${totals.subtotal.toFixed(2)} SAR\n` +
      `Shipping: ${totals.shipping.toFixed(2)} SAR\n` +
      `${totals.discount > 0 ? `Discount: -${totals.discount.toFixed(2)} SAR\n` : ''}` +
      `Total: ${totals.total.toFixed(2)} SAR`
    );
    
    const whatsappLink = `https://wa.me/966123456789?text=${message}`;
    window.open(whatsappLink, '_blank');
  } catch (error) {
    console.error('WhatsApp sharing error:', error);
    toast({
      title: 'Failed to share via WhatsApp',
      description: 'Please try again',
      variant: 'destructive'
    });
  }
};
