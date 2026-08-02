import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { type Certification } from '@/backend/certifications';

interface CertificationCardProps {
  certification: Certification;
}

const CertificationCard = ({ certification }: CertificationCardProps) => {
  const { language } = useLanguage();
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
        className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => certification.image && setShowImagePopup(true)}
      >
        <CardContent className="p-0">
          {certification.image ? (
            <div className="h-48 w-full bg-background flex items-center justify-center p-4">
              <img
                src={certification.image}
                alt={name}
                loading="lazy"
                className="max-w-full max-h-full object-contain hover:opacity-90 transition-opacity"
              />
            </div>
          ) : (
            <div className="h-48 w-full bg-muted flex items-center justify-center p-4 text-center">
              <span className="text-lg font-semibold text-muted-foreground">{name}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showImagePopup} onOpenChange={setShowImagePopup}>
        <DialogContent className="w-[100vw] max-w-[100vw] h-[100dvh] sm:w-[94vw] sm:max-w-[94vw] sm:h-[92vh] rounded-none sm:rounded-lg p-0 overflow-hidden flex flex-col bg-background">
          <DialogTitle className="sr-only">{name}</DialogTitle>
          <DialogDescription className="sr-only">{type}</DialogDescription>

          <div className="flex-1 min-h-0 flex items-center justify-center bg-muted/40 p-2 sm:p-6">
            {certification.image && (
              <img
                src={certification.image}
                alt={name}
                className="max-w-full max-h-full w-auto h-auto object-contain"
              />
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
