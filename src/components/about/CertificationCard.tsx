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
        <DialogContent className="max-w-[96vw] w-[96vw] sm:max-w-[92vw] h-[92vh] p-0 overflow-hidden flex flex-col bg-background">
          <DialogTitle className="sr-only">{name}</DialogTitle>
          <DialogDescription className="sr-only">{type}</DialogDescription>

          <div className="flex-1 min-h-0 flex items-center justify-center bg-muted/40 p-4">
            {certification.image && (
              <img
                src={certification.image}
                alt={name}
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>

          <div className="border-t p-4 shrink-0">
            <h3 className="text-xl font-semibold">{name}</h3>
            {type && <p className="text-muted-foreground">{type}</p>}
            {issuedBy && <p className="text-nama-purple font-medium">{issuedBy}</p>}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CertificationCard;
