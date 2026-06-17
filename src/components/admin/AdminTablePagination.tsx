import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface AdminTablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
}

export default function AdminTablePagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: AdminTablePaginationProps) {
  const { t } = useLanguage();

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-muted-foreground">
        {totalItems != null
          ? t(
              `Showing ${(currentPage - 1) * (itemsPerPage || 15) + 1}-${Math.min(currentPage * (itemsPerPage || 15), totalItems)} of ${totalItems}`,
              `عرض ${(currentPage - 1) * (itemsPerPage || 15) + 1}-${Math.min(currentPage * (itemsPerPage || 15), totalItems)} من ${totalItems}`
            )
          : t(`Page ${currentPage} of ${totalPages}`, `صفحة ${currentPage} من ${totalPages}`)}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          {t('Previous', 'السابق')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          {t('Next', 'التالي')}
        </Button>
      </div>
    </div>
  );
}
