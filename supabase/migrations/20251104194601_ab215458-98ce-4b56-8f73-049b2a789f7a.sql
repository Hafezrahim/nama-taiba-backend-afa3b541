
-- Insert sample products
INSERT INTO products (name_ar, name_en, description_ar, description_en, image, category, size, price, is_featured, in_stock, keywords) VALUES
('إسمنت حلوان', 'Helwan Cement', 'إسمنت عالي الجودة مناسب لجميع أنواع البناء', 'High-quality cement suitable for all types of construction', 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=500', 'Cement', '50kg', 45.00, true, true, 'cement, construction, building'),
('رمل بناء', 'Building Sand', 'رمل نظيف ومغسول مثالي للبناء', 'Clean and washed sand ideal for construction', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500', 'Sand', 'Cubic Meter', 120.00, true, true, 'sand, building, construction'),
('حديد تسليح 12 ملم', 'Steel Rebar 12mm', 'حديد تسليح عالي الجودة مطابق للمواصفات', 'High-quality steel rebar meeting specifications', 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=500', 'Steel', '12mm', 2800.00, true, true, 'steel, rebar, reinforcement'),
('طوب أحمر', 'Red Brick', 'طوب أحمر عالي الجودة للبناء', 'High-quality red brick for construction', 'https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=500', 'Brick', '1000 pieces', 850.00, true, true, 'brick, building, construction'),
('جبس بورد', 'Gypsum Board', 'ألواح جبس بورد للديكورات الداخلية', 'Gypsum boards for interior decoration', 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=500', 'Gypsum', '2.4m x 1.2m', 35.00, true, true, 'gypsum, board, decoration'),
('دهان خارجي', 'Exterior Paint', 'دهان مقاوم للعوامل الجوية', 'Weather-resistant exterior paint', 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=500', 'Paint', '20L', 280.00, true, true, 'paint, exterior, coating'),
('بلاط سيراميك', 'Ceramic Tiles', 'بلاط سيراميك فاخر بتصاميم متنوعة', 'Luxury ceramic tiles with various designs', 'https://images.unsplash.com/photo-1615873968403-89e068629265?w=500', 'Tiles', 'Box (10 pieces)', 450.00, true, true, 'tiles, ceramic, flooring'),
('خشب MDF', 'MDF Wood', 'ألواح خشب MDF عالية الكثافة', 'High-density MDF wood boards', 'https://images.unsplash.com/photo-1632778620177-32c7e1295ea6?w=500', 'Wood', '2.4m x 1.2m', 180.00, true, true, 'wood, mdf, furniture');

-- Insert sample offers
INSERT INTO offers (title_ar, title_en, description_ar, description_en, image, valid_until, price, min_qty, max_qty, category, contact, is_active) VALUES
('عرض خاص على الإسمنت', 'Special Offer on Cement', 'خصم 15% على جميع أنواع الإسمنت لفترة محدودة', '15% discount on all types of cement for a limited time', 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=500', '2025-12-31', 38.25, 10, 100, 'Cement', '+966501234567', true),
('باقة البناء الشاملة', 'Complete Building Package', 'احصل على كامل احتياجاتك من مواد البناء بسعر مخفض', 'Get all your building material needs at a discounted price', 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=500', '2025-11-30', 15000.00, 1, 5, 'Package', '+966501234567', true),
('عرض التشطيبات', 'Finishing Materials Offer', 'خصم خاص على مواد التشطيب والديكور', 'Special discount on finishing and decoration materials', 'https://images.unsplash.com/photo-1615873968403-89e068629265?w=500', '2025-10-31', 5000.00, 1, 10, 'Finishing', '+966501234567', true);

-- Insert sample projects
INSERT INTO projects (title_ar, title_en, description_ar, description_en, image, date, location, is_featured) VALUES
('برج الأعمال بالرياض', 'Riyadh Business Tower', 'قمنا بتوريد مواد بناء عالية الجودة لهذا المبنى الشهير', 'Supplied high-quality building materials for this iconic structure', 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800', '2023-06-15', 'Riyadh, Saudi Arabia', true),
('مجمع سكني بجدة', 'Jeddah Residential Complex', 'قدمنا جميع مواد البناء اللازمة لهذا المشروع السكني الكبير', 'Provided all necessary construction materials for this large residential project', 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800', '2022-04-22', 'Jeddah, Saudi Arabia', true),
('مركز تسوق الدمام', 'Dammam Shopping Mall', 'تصنيع مخصص للمواد المتخصصة لهذا المشروع التجاري', 'Custom manufacturing of specialized materials for this commercial project', 'https://images.unsplash.com/photo-1500673922987-e212871fec22?w=800', '2021-11-30', 'Dammam, Saudi Arabia', true);

-- Insert sample blogs
INSERT INTO blogs (title_ar, title_en, content_ar, content_en, image, published_date, author, is_published) VALUES
('أهمية اختيار مواد البناء عالية الجودة', 'The Importance of Choosing High-Quality Building Materials', 'تعتبر جودة مواد البناء من أهم العوامل التي تحدد متانة وعمر المباني. في هذا المقال نستعرض أهم النقاط التي يجب مراعاتها عند اختيار مواد البناء لمشروعك.', 'The quality of building materials is one of the most important factors determining the durability and lifespan of buildings. In this article, we review the key points to consider when choosing building materials for your project.', 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800', '2024-01-15', 'Ahmed Hassan', true),
('دليلك الشامل للإسمنت وأنواعه', 'Your Complete Guide to Cement and Its Types', 'الإسمنت هو أحد المكونات الأساسية في عملية البناء. تعرف على الأنواع المختلفة من الإسمنت واستخداماتها المثلى في هذا الدليل الشامل.', 'Cement is one of the essential components in the construction process. Learn about the different types of cement and their optimal uses in this comprehensive guide.', 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800', '2024-02-10', 'Sara Al-Mansour', true),
('نصائح لتوفير التكاليف في مشاريع البناء', 'Tips for Cost Savings in Construction Projects', 'توفير التكاليف في مشاريع البناء لا يعني التنازل عن الجودة. نقدم لك مجموعة من النصائح العملية لتقليل التكاليف مع الحفاظ على جودة عالية.', 'Cost savings in construction projects does not mean compromising on quality. We provide you with a set of practical tips to reduce costs while maintaining high quality.', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800', '2024-03-05', 'Mohammed Al-Qasimi', true);

-- Insert contact info
INSERT INTO contact_info (email, phone, whatsapp, address_en, address_ar, map_url) VALUES
('info@namabuildingmaterials.com', '+966 11 234 5678', '+966501234567', 'Riyadh, Saudi Arabia', 'الرياض، المملكة العربية السعودية', 'https://maps.google.com');

-- Insert about info
INSERT INTO about_info (section_key, content_ar, content_en, image) VALUES
('vision', 'نسعى لأن نكون الشركة الرائدة في توريد وتصنيع مواد البناء في المملكة العربية السعودية، من خلال تقديم منتجات عالية الجودة وخدمات متميزة تلبي احتياجات عملائنا وتساهم في بناء مستقبل أفضل.', 'We aspire to be the leading company in the supply and manufacture of building materials in Saudi Arabia, by providing high-quality products and excellent services that meet our customers'' needs and contribute to building a better future.', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800'),
('mission', 'مهمتنا هي توفير مواد بناء عالية الجودة بأسعار تنافسية، مع الالتزام بأعلى معايير الخدمة والاحترافية، والمساهمة في نمو قطاع البناء والتشييد في المملكة.', 'Our mission is to provide high-quality building materials at competitive prices, while adhering to the highest standards of service and professionalism, and contributing to the growth of the construction sector in the Kingdom.', 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800'),
('history', 'تأسست شركة نما لمواد البناء في عام 2010، ومنذ ذلك الحين ونحن نعمل على تقديم أفضل الحلول لعملائنا. بدأنا كشركة صغيرة ونمونا لنصبح واحدة من أبرز الشركات في المجال.', 'Nama Building Materials was established in 2010, and since then we have been working to provide the best solutions for our customers. We started as a small company and grew to become one of the leading companies in the field.', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800');

-- Insert services
INSERT INTO services (title_ar, title_en, description_ar, description_en, icon_name, is_active, display_order) VALUES
('توريد مواد البناء', 'Building Materials Supply', 'نوفر جميع أنواع مواد البناء من إسمنت، حديد، رمل، وغيرها', 'We provide all types of building materials including cement, steel, sand, and more', 'package', true, 1),
('تصنيع مواد خاصة', 'Custom Manufacturing', 'نقوم بتصنيع مواد بناء خاصة حسب المواصفات المطلوبة', 'We manufacture custom building materials according to required specifications', 'settings', true, 2),
('التوصيل السريع', 'Fast Delivery', 'خدمة توصيل سريعة وآمنة لجميع أنحاء المملكة', 'Fast and safe delivery service to all parts of the Kingdom', 'truck', true, 3),
('الاستشارات الفنية', 'Technical Consulting', 'فريق من الخبراء لتقديم الاستشارات الفنية للمشاريع', 'Team of experts to provide technical consulting for projects', 'clipboard', true, 4);

-- Insert team members
INSERT INTO team_members (name_ar, name_en, position_ar, position_en, image_url, is_active, display_order) VALUES
('أحمد محمد', 'Ahmed Mohammed', 'المدير التنفيذي', 'CEO', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400', true, 1),
('سارة أحمد', 'Sara Ahmed', 'مديرة المبيعات', 'Sales Manager', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400', true, 2),
('خالد العلي', 'Khaled Al-Ali', 'مدير العمليات', 'Operations Manager', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400', true, 3);

-- Insert certifications
INSERT INTO certifications (name_ar, name_en, type_ar, type_en, issued_by_ar, issued_by_en, image, issued_date, display_order) VALUES
('شهادة الأيزو 9001', 'ISO 9001 Certificate', 'جودة', 'Quality', 'المنظمة الدولية للمعايير', 'International Organization for Standardization', 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400', '2023-01-15', 1),
('شهادة الأيزو 14001', 'ISO 14001 Certificate', 'بيئة', 'Environment', 'المنظمة الدولية للمعايير', 'International Organization for Standardization', 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400', '2023-06-20', 2);

-- Insert partners
INSERT INTO partners (name, description_ar, description_en, logo, website, is_active, display_order) VALUES
('شركة الإسمنت السعودية', 'شريكنا الرئيسي في توريد الإسمنت', 'Our main partner in cement supply', 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300', 'https://example.com', true, 1),
('مصنع الحديد الوطني', 'شريك موثوق في توريد الحديد', 'Trusted partner in steel supply', 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300', 'https://example.com', true, 2);

-- Insert testimonials
INSERT INTO testimonials (name_ar, name_en, position_ar, position_en, content_ar, content_en, rating, avatar, is_approved, is_featured) VALUES
('محمد السالم', 'Mohammed Al-Salem', 'مهندس معماري', 'Architect', 'خدمة ممتازة ومواد عالية الجودة. أنصح بالتعامل مع شركة نما لمواد البناء', 'Excellent service and high-quality materials. I recommend dealing with Nama Building Materials', 5, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300', true, true),
('فاطمة أحمد', 'Fatima Ahmed', 'مديرة مشروع', 'Project Manager', 'تعاملنا معهم في عدة مشاريع ودائماً ما يكون أداؤهم متميزاً', 'We have dealt with them on several projects and their performance is always outstanding', 5, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300', true, true);
