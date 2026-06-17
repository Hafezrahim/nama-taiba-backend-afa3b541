import { useLanguage } from '@/contexts/LanguageContext';
import { type Certification } from '@/backend/certifications';
import CertificationCard from './CertificationCard';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
interface CertificationsSectionProps {
  certifications: Certification[];
}
const CertificationsSection = ({
  certifications
}: CertificationsSectionProps) => {
  const {
    t
  } = useLanguage();
  return <section className="py-12 container mx-auto px-4">
      <h2 className="text-3xl font-bold text-center text-nama-purple mb-8">
        {t('Our Certifications', 'شهاداتنا')}
      </h2>
      <Carousel opts={{
      align: "start",
      loop: true
    }} className="w-full">
        <CarouselContent>
          {certifications.map((cert, index) => <CarouselItem key={index} className="basis-1/2 md:basis-1/3 lg:basis-1/5">
              <CertificationCard certification={cert} />
            </CarouselItem>)}
        </CarouselContent>
        <CarouselPrevious className="mx-[43px]" />
        <CarouselNext />
      </Carousel>
    </section>;
};
export default CertificationsSection;