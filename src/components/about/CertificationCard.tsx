
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Award, X } from 'lucide-react';
import { type Certification } from '@/backend/certifications';
import { Badge } from '@/components/ui/badge';

interface CertificationCardProps {
  certification: Certification;
}

const CertificationCard = ({ certification }: CertificationCardProps) => {
  const { language } = useLanguage();
  const [showImagePopup, setShowImagePopup] = useState(false);

  const openImagePopup = () => {
    setShowImagePopup(true);
  };

  const closeImagePopup = () => {
    setShowImagePopup(false);
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={openImagePopup}>
        <CardContent className="p-0">
          {certification.image ? (
            <div className="h-48 w-full bg-white flex items-center justify-center p-4">
              <img 
                src={certification.image} 
                alt={language === 'en' ? certification.name_en : certification.name_ar}
                className="max-w-full max-h-full object-contain hover:opacity-90 transition-opacity"
              />
            </div>
          ) : (
            <div className="h-48 w-full bg-gray-100 flex items-center justify-center p-4 text-center">
              <span className="text-lg font-semibold text-gray-500">
                {language === 'en' ? certification.name_en : certification.name_ar}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Popup */}
      {showImagePopup && certification.image && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
          onClick={closeImagePopup}
        >
          <div className="relative max-w-4xl w-full p-4">
            <button 
              className="absolute top-0 right-0 bg-white rounded-full p-1 shadow-lg transform translate-x-1/2 -translate-y-1/2"
              onClick={(e) => {
                e.stopPropagation();
                closeImagePopup();
              }}
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={certification.image} 
              alt={language === 'en' ? certification.name_en : certification.name_ar}
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
            <div className="bg-white p-4 mt-2 rounded-lg">
              <h3 className="text-xl font-semibold">
                {language === 'en' ? certification.name_en : certification.name_ar}
              </h3>
              <p className="text-gray-600">
                {language === 'en' ? certification.type_en : certification.type_ar}
              </p>
              <p className="text-nama-purple font-medium">
                {language === 'en' ? certification.issued_by_en : certification.issued_by_ar}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CertificationCard;
