import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../contexts/LanguageContext';
import { getProjects, Project } from '../services/sheetsService';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Calendar, Building2 } from 'lucide-react';

const ProjectDetails = () => {
  const { projectSlug } = useParams<{ projectSlug: string }>();
  const { t, language, isRTL } = useLanguage();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProject = async () => {
      try {
        setLoading(true);
        const projects = await getProjects();
        
        const foundProject = projects.find(p => {
          const slugEn = p.titleEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          const slugAr = p.titleAr.replace(/\s+/g, '-');
          return slugEn === projectSlug || slugAr === projectSlug;
        });
        
        if (foundProject) {
          setProject(foundProject);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error loading project:', err);
        setLoading(false);
      }
    };

    loadProject();
  }, [projectSlug]);

  const extractYear = (dateStr: string): string => {
    if (!dateStr || dateStr === "") return "";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "";
      return date.getFullYear().toString();
    } catch (e) {
      return "";
    }
  };

  if (loading) {
    return (
      <div className={isRTL ? 'rtl' : 'ltr'}>
        <Header />
        <main className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-16">
            <div className="animate-pulse">
              <div className="h-96 bg-gray-200 rounded-lg mb-8"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!project) {
    return (
      <div className={isRTL ? 'rtl' : 'ltr'}>
        <Header />
        <main className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-16 text-center">
            <h1 className="text-3xl font-bold mb-4">
              {t('Project Not Found', 'المشروع غير موجود')}
            </h1>
            <Button onClick={() => navigate('/projects')}>
              {t('Back to Projects', 'العودة للمشاريع')}
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const title = language === 'en' ? project.titleEn : project.titleAr;
  const description = language === 'en'
    ? (project.descriptionEn || '').slice(0, 160)
    : (project.descriptionAr || '').slice(0, 160);

  return (
    <div className={isRTL ? 'rtl' : 'ltr'}>
      <Helmet>
        <title>{title} | Nama Taiba</title>
        <meta name="description" content={description} />
        {project.keywords && <meta name="keywords" content={project.keywords} />}
        <link rel="canonical" href={`https://www.nama-taiba.com/projects/${projectSlug}`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://www.nama-taiba.com/projects/${projectSlug}`} />
        {project.image && (
          <meta
            property="og:image"
            content={project.image.startsWith('http') ? project.image : `https://www.nama-taiba.com${project.image}`}
          />
        )}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CreativeWork',
            name: title,
            description,
            image: project.image,
            url: `https://www.nama-taiba.com/projects/${projectSlug}`,
            ...(project.location && { locationCreated: project.location }),
            ...(project.date && { dateCreated: project.date }),
            creator: { '@type': 'Organization', name: 'Nama Taiba Factory' },
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.nama-taiba.com/' },
              { '@type': 'ListItem', position: 2, name: 'Projects', item: 'https://www.nama-taiba.com/projects' },
              { '@type': 'ListItem', position: 3, name: title, item: `https://www.nama-taiba.com/projects/${projectSlug}` },
            ],
          })}
        </script>
      </Helmet>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate('/projects')}
            className="mb-6"
          >
            <ArrowLeft className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('Back to Projects', 'العودة للمشاريع')}
          </Button>

          {/* Project Header */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
            <div className="relative h-96 md:h-[500px]">
              <img
                src={project.image || "https://images.unsplash.com/photo-1486718448742-163732cd1544"}
                alt={title}
                className="w-full h-full object-cover"
              />
              {project.date && extractYear(project.date) && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-nama-purple text-white px-4 py-2 text-lg">
                    {extractYear(project.date)}
                  </Badge>
                </div>
              )}
            </div>

            <div className="p-8">
              <h1 className="text-4xl font-bold mb-6 text-nama-purple">
                {title}
              </h1>

              {/* Project Meta Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {project.location && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <MapPin className="w-5 h-5 text-nama-orange" />
                    <div>
                      <p className="text-sm text-gray-500">{t('Location', 'الموقع')}</p>
                      <p className="font-semibold">{project.location}</p>
                    </div>
                  </div>
                )}

                {project.date && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <Calendar className="w-5 h-5 text-nama-orange" />
                    <div>
                      <p className="text-sm text-gray-500">{t('Year', 'السنة')}</p>
                      <p className="font-semibold">{extractYear(project.date)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Project Description */}
              <div className="prose max-w-none">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-nama-purple" />
                  {t('Project Description', 'وصف المشروع')}
                </h2>
                <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-line">
                  {language === 'en' ? project.descriptionEn : project.descriptionAr}
                </p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">
              {t('Interested in Similar Projects?', 'مهتم بمشاريع مماثلة؟')}
            </h2>
            <p className="text-gray-600 mb-6">
              {t(
                'Contact us to discuss your construction needs',
                'تواصل معنا لمناقشة احتياجات البناء الخاصة بك'
              )}
            </p>
            <Button
              onClick={() => navigate('/contact')}
              className="bg-nama-purple hover:bg-nama-purple/90"
              size="lg"
            >
              {t('Contact Us', 'اتصل بنا')}
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProjectDetails;
