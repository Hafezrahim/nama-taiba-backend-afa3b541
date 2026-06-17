
import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getProjects, Project } from '@/backend/projects';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';
import { Badge } from './ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './ui/carousel';

const ProjectsSection = () => {
  const { t, language } = useLanguage();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        const data = await getProjects();
        setProjects(data.slice(0, 3));
        setLoading(false);
      } catch (err) {
        setError(t('Error loading projects', 'خطأ في تحميل المشاريع'));
        setLoading(false);
      }
    };
    loadProjects();
  }, [t]);

  const extractYear = (dateStr: string): string => {
    if (!dateStr || dateStr === "") return "";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "";
      return date.getFullYear().toString();
    } catch (e) {
      console.error("Date parsing error:", e);
      return "";
    }
  };

  const getYearColor = (year: string): string => {
    if (!year) return "bg-gray-500";
    const yearNum = parseInt(year);
    const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-amber-500", "bg-cyan-500", "bg-pink-500"];
    if (yearNum <= 2020) return colors[0];
    if (yearNum >= 2025) return colors[5];
    return colors[yearNum - 2020];
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <h2 className="section-title">{t('Our Projects', 'مشاريعنا')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-64 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="section-title">{t('Our Projects', 'مشاريعنا')}</h2>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const displayProjects = projects.length > 0 ? projects : [
    { id: '1', titleEn: 'Riyadh Business Tower', titleAr: 'برج الأعمال بالرياض', descriptionEn: 'Supplied high-quality building materials for this iconic structure.', descriptionAr: 'قمنا بتوريد مواد بناء عالية الجودة لهذا المبنى الشهير.', image: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b', date: '2023-06-15', location: 'Riyadh, Saudi Arabia' },
    { id: '2', titleEn: 'Jeddah Residential Complex', titleAr: 'مجمع سكني بجدة', descriptionEn: 'Provided all necessary construction materials for this large residential project.', descriptionAr: 'قدمنا جميع مواد البناء اللازمة لهذا المشروع السكني الكبير.', image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6', date: '2022-04-22', location: 'Jeddah, Saudi Arabia' },
    { id: '3', titleEn: 'Dammam Shopping Mall', titleAr: 'مركز تسوق الدمام', descriptionEn: 'Custom manufacturing of specialized materials for this commercial project.', descriptionAr: 'تصنيع مخصص للمواد المتخصصة لهذا المشروع التجاري.', image: 'https://images.unsplash.com/photo-1500673922987-e212871fec22', date: '2021-11-30', location: 'Dammam, Saudi Arabia' }
  ];

  const ProjectCard = ({ project }: { project: typeof displayProjects[0] }) => (
    <Card className="overflow-hidden card-hover h-full">
      <div className="h-64 overflow-hidden relative">
        <img
          src={project.image || "https://placehold.co/600x400?text=Project"}
          alt={language === 'en' ? project.titleEn : project.titleAr}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
        {project.date && extractYear(project.date) && (
          <div className="absolute bottom-2 right-2">
            <Badge className={`${getYearColor(extractYear(project.date))} text-white px-3 py-1 text-sm font-semibold`}>
              {extractYear(project.date)}
            </Badge>
          </div>
        )}
      </div>
      <CardContent className="p-5">
        <h3 className="text-xl font-bold mb-2">
          {language === 'en' ? project.titleEn : project.titleAr}
        </h3>
        <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed md:leading-[1.8] text-sm md:text-base">
          {language === 'en' ? project.descriptionEn : project.descriptionAr}
        </p>
        <div className="flex items-center text-sm text-gray-500">
          <span>{project.location}</span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-16">
      <h2 className="section-title">{t('Featured Projects', 'مشاريع مميزة')}</h2>
      
      {isMobile ? (
        <Carousel opts={{ align: "start", direction: language === 'ar' ? 'rtl' : 'ltr' }} className="w-full">
          <CarouselContent>
            {displayProjects.map((project) => (
              <CarouselItem key={project.id} className="basis-[85%]">
                <ProjectCard project={project} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {displayProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
      
      <div className="text-center mt-10">
        <Link to="/projects">
          <Button size="lg" variant="outline" className="border-2 border-nama-purple text-nama-purple hover:bg-nama-purple hover:text-white">
            {t('View All Projects', 'عرض جميع المشاريع')}
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ProjectsSection;
