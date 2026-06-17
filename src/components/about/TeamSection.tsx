
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { type TeamMember } from '@/backend/team';

interface TeamSectionProps {
  team: TeamMember[];
}

const TeamSection = ({ team }: TeamSectionProps) => {
  const { t, language } = useLanguage();

  return (
    <section className="py-12 bg-gray-50">
      <h2 className="text-3xl font-bold text-center text-nama-purple mb-8">
        {t('Our Team', 'فريقنا')}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {team.map((member, index) => (
          <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-square overflow-hidden">
              <img 
                src={member.image_url || 'placeholder.svg'} 
                alt={language === 'en' ? member.nam_en : member.nam_ar}
                className="w-full h-full object-cover"
              />
            </div>
            <CardContent className="p-4 text-center">
              <h3 className="font-semibold text-lg mb-1">
                {language === 'en' ? member.nam_en : member.nam_ar}
              </h3>
              <p className="text-gray-600">
                {language === 'en' ? member.position_en : member.position_ar}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default TeamSection;
