
import { useParams } from 'react-router-dom';
import { useEffect, useRef, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '@/components/SEO';
import { Helmet } from 'react-helmet-async';
import { getBlogs, incrementBlogViews, type Blog } from '@/backend/blogs';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, Eye } from 'lucide-react';

const BlogDetails = () => {
  const { blogSlug } = useParams<{ blogSlug: string }>();
  const { t, isRTL, language } = useLanguage();
  
  const { data: blogPosts, isLoading, error } = useQuery({
    queryKey: ['blogPosts'],
    queryFn: getBlogs
  });
  
  const currentPost = blogPosts?.find(post => post.slug === blogSlug || post.id === blogSlug);
  
  const relatedPosts = useMemo(() => {
    if (!currentPost || !blogPosts) return [];
    const currentKeywords = (currentPost.keywords || '').toLowerCase().split(',').map(k => k.trim()).filter(Boolean);
    if (currentKeywords.length === 0) return [];
    
    return blogPosts
      .filter(p => p.id !== currentPost.id)
      .map(post => {
        const postKeywords = (post.keywords || '').toLowerCase().split(',').map(k => k.trim()).filter(Boolean);
        const score = postKeywords.filter(k => currentKeywords.includes(k)).length;
        return { post, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ post }) => post);
  }, [currentPost, blogPosts]);

  const viewCounted = useRef(false);
  useEffect(() => {
    if (currentPost && !viewCounted.current) {
      viewCounted.current = true;
      incrementBlogViews(currentPost.id);
    }
  }, [currentPost]);

  useEffect(() => {
    viewCounted.current = false;
  }, [blogSlug]);
  
  return (
    <div className={`min-h-screen flex flex-col ${isRTL ? 'rtl' : 'ltr'}`}>
      {currentPost && (
        <>
        <SEO
          titleEn={currentPost.metaTitleEn || currentPost.titleEn}
          titleAr={currentPost.metaTitleAr || currentPost.titleAr}
          descriptionEn={currentPost.metaDescriptionEn || currentPost.contentEn?.substring(0, 160)}
          descriptionAr={currentPost.metaDescriptionAr || currentPost.contentAr?.substring(0, 160)}
          keywords={currentPost.keywords}
          image={currentPost.featuredImage || currentPost.image}
          url={`/blog/${currentPost.slug || currentPost.id}`}
          type="article"
          article={{
            publishedTime: currentPost.date,
            author: currentPost.author,
          }}
        />
        <Helmet>
          <script type="application/ld+json">
            {JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Article',
              headline: language === 'en' ? currentPost.titleEn : currentPost.titleAr,
              image: currentPost.featuredImage || currentPost.image,
              datePublished: currentPost.date,
              author: { '@type': 'Person', name: currentPost.author },
              publisher: { '@type': 'Organization', name: 'Nama Taiba Factory' },
              mainEntityOfPage: `https://www.nama-taiba.com/blog/${currentPost.slug || currentPost.id}`,
            })}
          </script>
          <script type="application/ld+json">
            {JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.nama-taiba.com/' },
                { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://www.nama-taiba.com/blog' },
                { '@type': 'ListItem', position: 3, name: language === 'en' ? currentPost.titleEn : currentPost.titleAr, item: `https://www.nama-taiba.com/blog/${currentPost.slug || currentPost.id}` },
              ],
            })}
          </script>
        </Helmet>
        </>
      )}
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <Link to="/blog">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('Back to Blog', 'العودة إلى المدونة')}
          </Button>
        </Link>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="bg-destructive/10 border-l-4 border-destructive text-destructive p-4 rounded">
            {t('Error loading blog post. Please try again later.', 'خطأ في تحميل المقالة. الرجاء المحاولة مرة أخرى لاحقًا.')}
          </div>
        ) : currentPost ? (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-4 text-primary">
              {language === 'en' ? currentPost.titleEn : currentPost.titleAr}
            </h1>
            
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4 text-muted-foreground">
                <p>{currentPost.date}</p>
                {currentPost.readTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" /> {currentPost.readTime} {t('min read', 'دقيقة قراءة')}
                  </span>
                )}
                {currentPost.viewsCount !== undefined && currentPost.viewsCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" /> {currentPost.viewsCount}
                  </span>
                )}
              </div>
              <Badge variant="secondary">{currentPost.author}</Badge>
            </div>
            
            {(currentPost.featuredImage || currentPost.image) && (
              <div className="mb-8">
                <AspectRatio ratio={16/9}>
                  <img 
                    src={currentPost.featuredImage || currentPost.image} 
                    alt={language === 'en' ? currentPost.titleEn : currentPost.titleAr}
                    className="rounded-lg object-cover w-full h-full"
                  />
                </AspectRatio>
              </div>
            )}
            
            <div className="prose prose-lg max-w-none">
              <p className="whitespace-pre-line text-foreground">
                {language === 'en' ? currentPost.contentEn : currentPost.contentAr}
              </p>
            </div>

            {currentPost.keywords && (
              <div className="mt-8 pt-4 border-t border-border">
                <div className="flex flex-wrap gap-2">
                  {currentPost.keywords.split(',').map((keyword, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{keyword.trim()}</Badge>
                  ))}
                </div>
              </div>
            )}

            {relatedPosts.length > 0 && (
              <div className="mt-12 pt-8 border-t border-border">
                <h2 className="text-2xl font-bold mb-6 text-primary">
                  {t('Related Articles', 'مقالات ذات صلة')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatedPosts.map((post: Blog) => (
                    <Link key={post.id} to={`/blog/${post.slug || post.id}`} className="block">
                      <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                        {(post.featuredImage || post.image) && (
                          <AspectRatio ratio={16 / 9}>
                            <img
                              src={post.featuredImage || post.image}
                              alt={isRTL ? post.titleAr : post.titleEn}
                              className="object-cover w-full h-full"
                              loading="lazy"
                            />
                          </AspectRatio>
                        )}
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base text-primary line-clamp-2">
                            {isRTL ? post.titleAr : post.titleEn}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{post.date}</span>
                            {post.readTime && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {post.readTime} {t('min', 'د')}
                              </span>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {isRTL ? post.contentAr : post.contentEn}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-lg text-muted-foreground">
              {t('Blog post not found.', 'لم يتم العثور على المقالة.')}
            </p>
            <Link to="/blog" className="mt-4 inline-block">
              <Button variant="outline" className="mt-4">
                {t('Back to Blog', 'العودة إلى المدونة')}
              </Button>
            </Link>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default BlogDetails;
