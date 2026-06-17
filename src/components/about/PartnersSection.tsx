import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { type Partner } from '@/backend/partners';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
interface PartnersSectionProps {
  partners: Partner[];
}
const PartnersSection = ({
  partners
}: PartnersSectionProps) => {
  const {
    t
  } = useLanguage();
  return <section className="py-12 container mx-auto px-4">
      <h2 className="text-3xl font-bold text-center text-nama-purple mb-8">
        {t('Our Partners', 'شركاؤنا')}
      </h2>
      <Carousel opts={{
      align: "start",
      loop: true
    }} className="w-full">
        <CarouselContent>
          {partners.map((partner, index) => <CarouselItem key={index} className="basis-1/2 md:basis-1/3 lg:basis-1/5">
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="h-48 w-full bg-white flex items-center justify-center p-4">
                    <img src={partner.logo || '/placeholder.svg'} alt={partner.name} className="max-w-full max-h-full object-contain" />
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>)}
        </CarouselContent>
        <CarouselPrevious className="mx-[35px]" />
        <CarouselNext />
      </Carousel>
    </section>;
};
export default PartnersSection;