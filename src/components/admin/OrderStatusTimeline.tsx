import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Clock, CheckCircle2, Truck, Package, XCircle, Circle } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface StatusHistoryEntry {
  id: string;
  old_status: string | null;
  new_status: string;
  created_at: string;
}

interface OrderStatusTimelineProps {
  history: StatusHistoryEntry[];
  isLoading: boolean;
}

const statusIcons: Record<string, React.ElementType> = {
  pending: Clock,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle2,
  cancelled: XCircle,
};

const statusColors: Record<string, string> = {
  pending: 'text-yellow-500 border-yellow-500',
  processing: 'text-blue-500 border-blue-500',
  shipped: 'text-purple-500 border-purple-500',
  delivered: 'text-green-500 border-green-500',
  cancelled: 'text-red-500 border-red-500',
};

const statusLabels: Record<string, { en: string; ar: string }> = {
  pending: { en: 'Pending', ar: 'قيد الانتظار' },
  processing: { en: 'Processing', ar: 'قيد المعالجة' },
  shipped: { en: 'Shipped', ar: 'تم الشحن' },
  delivered: { en: 'Delivered', ar: 'تم التوصيل' },
  cancelled: { en: 'Cancelled', ar: 'ملغي' },
};

const OrderStatusTimeline = ({ history, isLoading }: OrderStatusTimelineProps) => {
  const { t, language } = useLanguage();

  const getLabel = (status: string) => {
    const label = statusLabels[status];
    return label ? (language === 'ar' ? label.ar : label.en) : status;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd MMM yyyy, hh:mm a', {
      locale: language === 'ar' ? ar : undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-muted" />
            <div className="flex-1 space-y-1">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        {t('No status changes recorded', 'لا توجد تغييرات في الحالة')}
      </p>
    );
  }

  return (
    <div className="relative space-y-0">
      {history.map((entry, index) => {
        const Icon = statusIcons[entry.new_status] || Circle;
        const colorClass = statusColors[entry.new_status] || 'text-muted-foreground border-muted-foreground';
        const isLast = index === history.length - 1;

        return (
          <div key={entry.id} className="relative flex gap-3 pb-4">
            {/* Vertical line */}
            {!isLast && (
              <div className="absolute top-8 bottom-0 start-[15px] w-px bg-border" />
            )}
            {/* Icon */}
            <div
              className={cn(
                'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 bg-background',
                colorClass
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-sm font-medium">
                {entry.old_status ? (
                  <>
                    {getLabel(entry.old_status)}{' '}
                    <span className="text-muted-foreground">→</span>{' '}
                    {getLabel(entry.new_status)}
                  </>
                ) : (
                  <>
                    {t('Order created as', 'تم إنشاء الطلب بحالة')}{' '}
                    <span className="font-semibold">{getLabel(entry.new_status)}</span>
                  </>
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDate(entry.created_at)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OrderStatusTimeline;
