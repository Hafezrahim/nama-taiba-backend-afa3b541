
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, Trash2 } from 'lucide-react';
import type { CartItem } from '@/contexts/CartContext';

interface CartItemsListProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
}

const CartItemsList = ({ items, onUpdateQuantity, onRemoveItem }: CartItemsListProps) => {
  const { t, isRTL } = useLanguage();

  return (
    <Card>
      <CardContent className="p-3 sm:p-6">
        {items.map((item, index) => (
          <div key={item.id}>
            <div className="flex items-center gap-3 py-3 sm:py-4">
              <img 
                src={item.imageUrl} 
                alt={isRTL ? item.nameAr : item.nameEn}
                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded flex-shrink-0"
              />
              
              <div className="flex-grow min-w-0">
                <h3 className="font-medium text-sm sm:text-base truncate">
                  {isRTL ? item.nameAr : item.nameEn}
                </h3>
                <p className="text-nama-purple font-medium text-sm sm:text-base mt-0.5">
                  {item.price.toFixed(2)} {t('SAR', 'ر.س')}
                </p>
                {item.size && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    {t('Size', 'الحجم')}: {item.size}
                  </p>
                )}
                
                <div className="flex items-center justify-between mt-2 sm:hidden">
                  <div className="flex items-center">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-7 w-7"
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-7 w-7"
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-destructive hover:text-destructive/80"
                    onClick={() => onRemoveItem(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              
              <div className="hidden sm:flex items-center">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-10 text-center">{item.quantity}</span>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 ml-4 text-destructive hover:text-destructive/80"
                  onClick={() => onRemoveItem(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {index < items.length - 1 && <Separator />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default CartItemsList;
