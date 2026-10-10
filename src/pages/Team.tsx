import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTeamMembers } from '@/backend/team';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TeamSection from '@/components/about/TeamSection';
import SEO from '@/components/SEO';

const Team = () => {
  const { t } = useLanguage();
  const { data: team = [], isLoading } = useQuery({ queryKey: ['team-page'], queryFn: getTeamMembers });

  return (
    <div className="min-h-screen flex flex-col">
      <SEO titleEn="Our Team | Nama Taiba" titleAr="فريقنا | نما طيبة" descriptionEn="Meet the Nama Taiba team" descriptionAr="تعرّف على فريق نما طيبة" url="/team" />
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10">
        {isLoading ? (
          <p className="text-center text-muted-foreground">{t('Loading...', 'جارٍ التحميل...')}</p>
        ) : team.length ? (
          <TeamSection team={team} />
        ) : (
          <p className="text-center text-muted-foreground py-20">{t('Team members coming soon.', 'سيتم إضافة أعضاء الفريق قريباً.')}</p>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Team;
