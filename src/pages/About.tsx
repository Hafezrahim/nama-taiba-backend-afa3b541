import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getAboutInfo, AboutInfo } from '@/backend/about';
import { getTeamMembers, TeamMember } from '@/backend/team';
import { getCertifications, Certification } from '@/backend/certifications';
import { getPartners, Partner } from '@/backend/partners';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CertificationsSection from '@/components/about/CertificationsSection';
import TeamSection from '@/components/about/TeamSection';
import PartnersSection from '@/components/about/PartnersSection';
import TestimonialsSection from '@/components/about/TestimonialsSection';
import CompanyInfoSection from '@/components/about/CompanyInfoSection';
import AboutPageSkeleton from '@/components/about/AboutPageSkeleton';
import SEO from '@/components/SEO';

const About = () => {
  const { t, isRTL } = useLanguage();
  const [aboutInfo, setAboutInfo] = useState<AboutInfo | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [aboutData, teamData, certData, partnersData] = await Promise.all([
          getAboutInfo(),
          getTeamMembers(),
          getCertifications(),
          getPartners()
        ]);
        setAboutInfo(aboutData);
        setTeam(teamData);
        setCertifications(certData);
        setPartners(partnersData);
        setLoading(false);
      } catch (err) {
        setError(t('Error loading information', 'خطأ في تحميل المعلومات'));
        setLoading(false);
      }
    };

    loadData();
  }, [t]);

  return (
    <div className={isRTL ? 'rtl' : 'ltr'}>
      <SEO 
        url="/about"
        titleEn="About Us - Nama Taiba Factory"
        titleAr="من نحن - مصنع نما طيبة"
        descriptionEn="Learn about Nama Taiba Factory's mission, vision, team, certifications, and partners. Leading building materials manufacturer in Saudi Arabia."
        descriptionAr="تعرف على رسالة ورؤية وفريق وشهادات وشركاء مصنع نما طيبة. مصنع رائد لمواد البناء في المملكة العربية السعودية."
        keywords="about, company, team, certifications, partners, من نحن, الشركة, الفريق"
      />
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold text-center mb-12">
            {t('About Us', 'من نحن')}
          </h1>

          {loading ? (
            <AboutPageSkeleton />
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : aboutInfo && (
            <>
              <CompanyInfoSection aboutInfo={aboutInfo} />
              <CertificationsSection certifications={certifications} />
              <TeamSection team={team} />
              <PartnersSection partners={partners} />
              <TestimonialsSection />
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default About;
