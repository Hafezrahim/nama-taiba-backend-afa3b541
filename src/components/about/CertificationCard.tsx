import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { type Certification } from '@/backend/certifications';
import { Eye, Award } from 'lucide-react';

interface CertificationCardProps {
  certification: Certification;
}

const CertificationCard = ({ certification }: CertificationCardProps) => {
  const { language, t } = useLanguage();
  const [showImagePopup, setShowImagePopup] = useState(false);
  const [fullLoaded, setFullLoaded] = useState(false);

  const prefetch = () => {
    if (!certification.image || fullLoaded) return;
    const img = new Image();
    img.src = certification.image;
  };

  const name = language === 'en' ? certification.name_en : certification.name_ar;
  const type = language === 'en' ? certification.type_en : certification.type_ar;
  const issuedBy = language === 'en' ? certification.issued_by_en : certification.issued_by_ar;

  return (
    <>
      <Card
        className="group overflow-hidden rounded-xl border border-border/70 bg-card hover:border-nama-purple/40 dark:hover:border-nama-gold/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full"
        onMouseEnter={prefetch}
        onTouchStart={prefetch}
        onClick={() => certification.image && setShowImagePopup(true)}
      >
        <CardContent className="p-0 flex flex-col h-full">
          {certification.image ? (
            <div className="relative h-48 w-full bg-muted/30 flex items-center justify-center p-4 overflow-hidden">
              <img
                src={certification.image}
                alt={name}
                loading="lazy"
                decoding="async"
                className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-nama-purple/20 dark:bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[1px]">
                <span className="bg-background/95 text-foreground text-xs font-medium px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <Eye className="h-3.5 w-3.5 text-nama-purple dark:text-nama-gold" />
                  {t('View Certificate', 'عرض الشهادة')}
                </span>
              </div>
            </div>
          ) : (
            <div className="h-48 w-full bg-muted flex flex-col items-center justify-center p-4 text-center">
              <Award className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm font-semibold text-muted-foreground">{name}</span>
            </div>
          )}
          <div className="p-3.5 border-t border-border/60 bg-card/60 flex-1 flex flex-col justify-center">
            <h4 className="font-semibold text-xs sm:text-sm text-foreground group-hover:text-nama-purple dark:group-hover:text-nama-gold transition-colors line-clamp-1">
              {name}
            </h4>
            {issuedBy && (
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                {issuedBy}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showImagePopup} onOpenChange={setShowImagePopup}>
        <DialogContent className="w-[100vw] max-w-[100vw] h-[100dvh] sm:w-[94vw] sm:max-w-[94vw] sm:h-[92vh] rounded-none sm:rounded-lg p-0 overflow-hidden flex flex-col bg-background">
          <DialogTitle className="sr-only">{name}</DialogTitle>
          <DialogDescription className="sr-only">{type}</DialogDescription>

          <div className="relative flex-1 min-h-0 flex items-center justify-center bg-muted/40 p-2 sm:p-6">
            {showImagePopup && certification.image && (
              <>
                {!fullLoaded && <Skeleton className="absolute inset-4 sm:inset-10 rounded-md" />}
                <img
                  src={certification.image}
                  alt={name}
                  decoding="async"
                  fetchPriority="high"
                  onLoad={() => setFullLoaded(true)}
                  className={`max-w-full max-h-full w-auto h-auto object-contain transition-opacity duration-200 ${fullLoaded ? 'opacity-100' : 'opacity-0'}`}
                />
              </>
            )}
          </div>


          <div className="border-t p-3 sm:p-4 shrink-0 max-h-[35dvh] overflow-y-auto">
            <h3 className="text-base sm:text-xl font-semibold break-words">{name}</h3>
            {type && <p className="text-sm sm:text-base text-muted-foreground break-words">{type}</p>}
            {issuedBy && <p className="text-sm sm:text-base text-nama-purple font-medium break-words">{issuedBy}</p>}
          </div>

        </DialogContent>
      </Dialog>
    </>
  );
};

export default CertificationCard;
