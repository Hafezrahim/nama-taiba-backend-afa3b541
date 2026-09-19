
import { useParams, Link } from 'react-router-dom';
import { useState, useEffect, useRef, useMemo } from 'react';
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
import { ArrowLeft, Clock, Eye, Calendar, User, Share2, Check, Tag } from 'lucide-react';
import { stripHtml } from '@/lib/utils';
import { toast } from 'sonner';

const BlogDetails = () => {
  const { blogSlug } = useParams<{ blogSlug: string }>();
  const { t, isRTL, language } = useLanguage();
  const [copied, setCopied] = useState(false);
  
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

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: language === 'en' ? currentPost?.titleEn : currentPost?.titleAr,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        toast.success(t('Link copied to clipboard!', 'تم نسخ رابط المقالة!'));
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        toast.success(t('Link copied to clipboard!', 'تم نسخ رابط المقالة!'));
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };
  
  return (
    <div className={`min-h-screen flex flex-col ${isRTL ? 'rtl' : 'ltr'}`}>
      {currentPost && (
        <>
        <SEO
          titleEn={currentPost.metaTitleEn || currentPost.titleEn}
          titleAr={currentPost.metaTitleAr || currentPost.titleAr}
          descriptionEn={currentPost.metaDescriptionEn || stripHtml(currentPost.contentEn)?.substring(0, 160)}
          descriptionAr={currentPost.metaDescriptionAr || stripHtml(currentPost.contentAr)?.substring(0, 160)}
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
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="bg-destructive/10 border-l-4 border-destructive text-destructive p-4 rounded">
            {t('Error loading blog post. Please try again later.', 'خطأ في تحميل المقالة. الرجاء المحاولة مرة أخرى لاحقًا.')}
          </div>
        ) : currentPost ? (
          <div className="max-w-7xl mx-auto">
            {/* Back Button */}
            <div className="mb-6">
              <Link to="/blog">
                <Button variant="ghost" size="sm" className="group gap-2 text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1 rtl:rotate-180 rtl:group-hover:translate-x-1" />
                  {t('Back to Blog', 'العودة إلى المدونة')}
                </Button>
              </Link>
            </div>

            {/* Main 2-Column Grid: Image & Info on Left, Content on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start [direction:ltr]">
              
              {/* LEFT COLUMN: Featured Image + Article Metadata */}
              <aside 
                className="lg:col-span-5 xl:col-span-5 lg:sticky lg:top-24 space-y-6 self-start"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                {/* Featured Image */}
                {(currentPost.featuredImage || currentPost.image) ? (
                  <div className="overflow-hidden rounded-2xl border border-border/70 bg-muted shadow-md group">
                    <AspectRatio ratio={4 / 3}>
                      <img 
                        src={currentPost.featuredImage || currentPost.image} 
                        alt={language === 'en' ? currentPost.titleEn : currentPost.titleAr}
                        className="rounded-2xl object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                      />
                    </AspectRatio>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-border/70 bg-muted shadow-md group">
                    <AspectRatio ratio={4 / 3}>
                      <img 
                        src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1000&auto=format&fit=crop" 
                        alt={language === 'en' ? currentPost.titleEn : currentPost.titleAr}
                        className="rounded-2xl object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                      />
                    </AspectRatio>
                  </div>
                )}

                {/* Article Info Card */}
                <Card className="border-border/70 shadow-sm bg-card/70 backdrop-blur-sm">
                  <CardContent className="p-5 space-y-4">
                    {/* Author Row */}
                    <div className="flex items-center gap-3 pb-3 border-b border-border/50">
                      <div className="h-10 w-10 rounded-full bg-nama-purple/10 dark:bg-nama-gold/10 flex items-center justify-center text-nama-purple dark:text-nama-gold font-bold">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t('Author', 'الكاتب')}</p>
                        <p className="text-sm font-semibold text-foreground">{currentPost.author}</p>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-nama-purple dark:text-nama-gold shrink-0" />
                        <span>{currentPost.date}</span>
                      </div>
                      {currentPost.readTime && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-nama-purple dark:text-nama-gold shrink-0" />
                          <span>{currentPost.readTime} {t('min read', 'دقيقة قراءة')}</span>
                        </div>
                      )}
                      {currentPost.viewsCount !== undefined && currentPost.viewsCount > 0 && (
                        <div className="flex items-center gap-2 col-span-2">
                          <Eye className="h-4 w-4 text-nama-purple dark:text-nama-gold shrink-0" />
                          <span>{currentPost.viewsCount} {t('views', 'مشاهدة')}</span>
                        </div>
                      )}
                    </div>

                    {/* Share Button */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleShare}
                      className="w-full gap-2 border-border/80 hover:bg-nama-purple hover:text-white dark:hover:bg-nama-gold dark:hover:text-black transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 text-green-500" />
                          {t('Copied!', 'تم النسخ!')}
                        </>
                      ) : (
                        <>
                          <Share2 className="h-4 w-4" />
                          {t('Share Article', 'مشاركة المقالة')}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Tags & Keywords Card */}
                {currentPost.keywords && (
                  <Card className="border-border/70 shadow-sm bg-card/70 backdrop-blur-sm">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 font-semibold">
                        <Tag className="h-3.5 w-3.5 text-nama-purple dark:text-nama-gold" />
                        {t('Topics & Tags', 'المواضيع والكلمات الدلالية')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-1">
                      <div className="flex flex-wrap gap-1.5">
                        {currentPost.keywords.split(',').map((keyword, i) => (
                          <Badge key={i} variant="secondary" className="text-xs py-0.5 px-2 font-normal">
                            #{keyword.trim()}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </aside>

              {/* RIGHT COLUMN: Title, Sub-meta, and Full Article Body */}
              <article 
                className="lg:col-span-7 xl:col-span-7 space-y-6"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                {/* Title */}
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight leading-snug">
                  {language === 'en' ? currentPost.titleEn : currentPost.titleAr}
                </h1>

                {/* Subtitle / quick meta bar */}
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground pb-4 border-b border-border/60">
                  <span>{currentPost.date}</span>
                  <span>•</span>
                  <span>{currentPost.author}</span>
                  {currentPost.readTime && (
                    <>
                      <span>•</span>
                      <span>{currentPost.readTime} {t('min read', 'دقيقة قراءة')}</span>
                    </>
                  )}
                </div>

                {/* Article Body */}
                {(() => {
                  const content = language === 'en' ? currentPost.contentEn : currentPost.contentAr;
                  const hasHtml = /<[a-z][\s\S]*>/i.test(content || '');
                  return (
                    <div
                      className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-headings:text-nama-purple dark:prose-headings:text-nama-gold prose-p:text-foreground/90 prose-p:leading-relaxed prose-img:rounded-xl prose-img:shadow-md leading-relaxed break-words"
                      dir={isRTL ? 'rtl' : 'ltr'}
                    >
                      {hasHtml ? (
                        <div dangerouslySetInnerHTML={{ __html: content || '' }} />
                      ) : (
                        <p className="whitespace-pre-line text-foreground">
                          {content}
                        </p>
                      )}
                    </div>
                  );
                })()}
              </article>
            </div>

            {/* Related Articles Section */}
            {relatedPosts.length > 0 && (
              <div className="mt-16 pt-10 border-t border-border">
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
                            {stripHtml(isRTL ? post.contentAr : post.contentEn)}
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
