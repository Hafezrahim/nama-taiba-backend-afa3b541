import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { getProjects, Project } from '@/backend/projects';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '@/components/SEO';

const Projects = () => {
  const { t, language, isRTL } = useLanguage();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        const data = await getProjects();
        setProjects(data);
        setLoading(false);
      } catch (err) {
        setError(t('Error loading projects', 'خطأ في تحميل المشاريع'));
        setLoading(false);
      }
    };

    loadProjects();
  }, [t]);

  // Function to extract year from date string
  const extractYear = (dateStr: string): string => {
    if (!dateStr || dateStr === "") return "";
    
    try {
      const date = new Date(dateStr);
      // Check if the date is valid
      if (isNaN(date.getTime())) return "";
      
      return date.getFullYear().toString();
    } catch (e) {
      console.error("Date parsing error:", e);
      return "";
    }
  };

  // Get color based on year
  const getYearColor = (year: string): string => {
    if (!year) return "bg-gray-500";
    
    const yearNum = parseInt(year);
    const colors = [
      "bg-blue-500", // 2020 or before
      "bg-green-500", // 2021
      "bg-purple-500", // 2022
      "bg-amber-500", // 2023
      "bg-cyan-500", // 2024
      "bg-pink-500", // 2025 or after
    ];
    
    if (yearNum <= 2020) return colors[0];
    if (yearNum >= 2025) return colors[5];
    
    // 2021-2024 map to indices 1-4
    return colors[yearNum - 2020];
  };

  // Generate slug from project title
  const generateSlug = (project: Project): string => {
    const title = language === 'en' ? project.titleEn : project.titleAr;
    return title.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-').replace(/^-|-$/g, '');
  };

  return (
    <div className={isRTL ? 'rtl' : 'ltr'}>
      <SEO 
        url="/projects"
        titleEn="Our Projects - Nama Taiba Factory"
        titleAr="مشاريعنا - مصنع نما طيبة"
        descriptionEn="View our portfolio of completed building projects across Saudi Arabia. See our work in residential, commercial, and infrastructure construction."
        descriptionAr="شاهد مشاريعنا المكتملة في جميع أنحاء المملكة العربية السعودية. شاهد أعمالنا في البناء السكني والتجاري والبنية التحتية."
        keywords="projects, portfolio, construction, buildings, مشاريع, محفظة, بناء, مباني"
      />
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold text-center mb-12">
            {t('Our Projects', 'مشاريعنا')}
          </h1>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-64 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${generateSlug(project)}`}
                  className="block"
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                    <div className="h-64 overflow-hidden relative">
                      <img
                        src={project.image || "https://images.unsplash.com/photo-1486718448742-163732cd1544"}
                        alt={language === 'en' ? project.titleEn : project.titleAr}
                        className="w-full h-full object-cover transition-transform hover:scale-105"
                      />
                      
                      {/* Year Badge */}
                      {project.date && extractYear(project.date) && (
                        <div className="absolute bottom-2 right-2">
                          <Badge 
                            className={`${getYearColor(extractYear(project.date))} text-white px-3 py-1 text-sm font-semibold`}
                          >
                            {extractYear(project.date)}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold mb-2">
                        {language === 'en' ? project.titleEn : project.titleAr}
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {language === 'en' ? project.descriptionEn : project.descriptionAr}
                      </p>
                      <div className="flex items-center text-sm text-gray-500">
                        <span>{project.location}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Projects;
