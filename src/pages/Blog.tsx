import { useState, useMemo } from 'react';
import { Eye, Clock, Tag, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Input } from '@/components/ui/input';
import { getBlogs, type Blog as BlogType } from '@/backend/blogs';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';

const Blog = () => {
  const { t, isRTL } = useLanguage();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: blogPosts, isLoading, error } = useQuery({
    queryKey: ['blogPosts'],
    queryFn: getBlogs
  });

  // Extract all unique tags from keywords
  const allTags = useMemo(() => {
    if (!blogPosts) return [];
    const tagSet = new Set<string>();
    blogPosts.forEach(post => {
      if (post.keywords) {
        post.keywords.split(',').forEach(tag => {
          const trimmed = tag.trim();
          if (trimmed) tagSet.add(trimmed);
        });
      }
    });
    return Array.from(tagSet).sort();
  }, [blogPosts]);

  // Filter posts by selected tags and search
  const filteredPosts = useMemo(() => {
    if (!blogPosts) return [];
    return blogPosts.filter(post => {
      const matchesSearch = !searchTerm ||
        post.titleEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.titleAr.includes(searchTerm);

      const matchesTags = selectedTags.length === 0 || selectedTags.some(tag =>
        post.keywords?.toLowerCase().includes(tag.toLowerCase())
      );

      return matchesSearch && matchesTags;
    });
  }, [blogPosts, selectedTags, searchTerm]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className={`min-h-screen flex flex-col ${isRTL ? 'rtl' : 'ltr'}`}>
      <SEO
        url="/blog"
        titleEn="Blog - Latest News & Articles"
        titleAr="المدونة - آخر الأخبار والمقالات"
        descriptionEn="Stay updated with the latest news, tips, and articles about building materials, construction trends, and architectural innovations."
        descriptionAr="ابق على اطلاع بآخر الأخبار والنصائح والمقالات حول مواد البناء واتجاهات البناء والابتكارات المعمارية."
        keywords="blog, news, articles, construction, building materials, مدونة, أخبار, مقالات"
      />
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-nama-purple">
          {t('Blog', 'المدونة')}
        </h1>

        {/* Search & Filter Bar */}
        <div className="space-y-4 mb-8">
          <Input
            placeholder={t('Search articles...', 'البحث في المقالات...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />

          {allTags.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Tag className="h-4 w-4" />
                {t('Filter by topic:', 'تصفية حسب الموضوع:')}
              </div>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                    {selectedTags.includes(tag) && <X className="h-3 w-3 ml-1" />}
                  </Badge>
                ))}
              </div>
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  {t('Clear all filters', 'مسح جميع الفلاتر')}
                </button>
              )}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nama-purple"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
            {t('Error loading blog posts. Please try again later.', 'خطأ في تحميل المقالات. الرجاء المحاولة مرة أخرى لاحقًا.')}
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post: BlogType) => (
              <Link key={post.id} to={`/blog/${post.slug || post.id}`} className="block">
                <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <div className="relative">
                    <AspectRatio ratio={16 / 9}>
                      <img
                        src={post.image || "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1000&auto=format&fit=crop"}
                        alt={isRTL ? post.titleAr : post.titleEn}
                        className="object-cover w-full h-full"
                        loading="lazy"
                      />
                    </AspectRatio>
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary">{post.author}</Badge>
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl text-nama-purple">
                      {isRTL ? post.titleAr : post.titleEn}
                    </CardTitle>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{post.date}</span>
                      {post.readTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> {post.readTime} {t('min', 'د')}
                        </span>
                      )}
                      {post.viewsCount !== undefined && post.viewsCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" /> {post.viewsCount}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-muted-foreground line-clamp-3">
                      {isRTL ? post.contentAr : post.contentEn}
                    </p>
                    {post.keywords && (
                      <div className="flex flex-wrap gap-1">
                        {post.keywords.split(',').slice(0, 3).map((kw, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0">
                            {kw.trim()}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <span className="inline-block text-nama-purple hover:text-nama-gold font-medium transition-colors">
                      {t('Read More', 'اقرأ المزيد')} →
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-lg text-muted-foreground">
              {selectedTags.length > 0 || searchTerm
                ? t('No articles match your filters.', 'لا توجد مقالات تطابق الفلاتر.')
                : t('No blog posts available at the moment.', 'لا توجد مقالات متاحة في الوقت الحالي.')}
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
