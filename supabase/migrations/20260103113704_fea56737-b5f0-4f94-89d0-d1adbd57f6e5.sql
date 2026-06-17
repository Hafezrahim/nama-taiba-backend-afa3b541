
-- Insert Saudi Arabian cities
INSERT INTO cities (name_ar, name_en, display_order, is_active) VALUES
('الرياض', 'Riyadh', 1, true),
('جدة', 'Jeddah', 2, true),
('مكة المكرمة', 'Makkah', 3, true),
('المدينة المنورة', 'Madinah', 4, true),
('الدمام', 'Dammam', 5, true),
('الخبر', 'Khobar', 6, true),
('الظهران', 'Dhahran', 7, true),
('الطائف', 'Taif', 8, true),
('تبوك', 'Tabuk', 9, true),
('بريدة', 'Buraidah', 10, true),
('خميس مشيط', 'Khamis Mushait', 11, true),
('أبها', 'Abha', 12, true),
('حائل', 'Hail', 13, true),
('نجران', 'Najran', 14, true),
('جازان', 'Jazan', 15, true);

-- Insert districts for Riyadh
INSERT INTO districts (city_id, name_ar, name_en, shipping_price, display_order, is_active)
SELECT c.id, d.name_ar, d.name_en, d.price, d.ord, true
FROM cities c,
(VALUES
  ('العليا', 'Al Olaya', 25, 1),
  ('النخيل', 'Al Nakheel', 25, 2),
  ('الملز', 'Al Malaz', 30, 3),
  ('السليمانية', 'Al Sulimaniyah', 25, 4),
  ('الربوة', 'Al Rabwah', 30, 5),
  ('الورود', 'Al Wurud', 25, 6),
  ('الياسمين', 'Al Yasmin', 35, 7),
  ('النرجس', 'Al Narjis', 35, 8),
  ('حي الملك فهد', 'King Fahd District', 30, 9),
  ('حي الصحافة', 'Al Sahafah', 35, 10)
) AS d(name_ar, name_en, price, ord)
WHERE c.name_en = 'Riyadh';

-- Insert districts for Jeddah
INSERT INTO districts (city_id, name_ar, name_en, shipping_price, display_order, is_active)
SELECT c.id, d.name_ar, d.name_en, d.price, d.ord, true
FROM cities c,
(VALUES
  ('الحمراء', 'Al Hamra', 30, 1),
  ('الروضة', 'Al Rawdah', 30, 2),
  ('الزهراء', 'Al Zahra', 35, 3),
  ('الصفا', 'Al Safa', 30, 4),
  ('النسيم', 'Al Naseem', 35, 5),
  ('البوادي', 'Al Bawadi', 35, 6),
  ('السلامة', 'Al Salamah', 30, 7),
  ('المرجان', 'Al Murjan', 40, 8)
) AS d(name_ar, name_en, price, ord)
WHERE c.name_en = 'Jeddah';

-- Insert districts for Makkah
INSERT INTO districts (city_id, name_ar, name_en, shipping_price, display_order, is_active)
SELECT c.id, d.name_ar, d.name_en, d.price, d.ord, true
FROM cities c,
(VALUES
  ('العزيزية', 'Al Aziziyah', 35, 1),
  ('الشوقية', 'Al Shawqiyah', 35, 2),
  ('الرصيفة', 'Al Rasifah', 40, 3),
  ('العوالي', 'Al Awali', 35, 4),
  ('الزاهر', 'Al Zahir', 40, 5)
) AS d(name_ar, name_en, price, ord)
WHERE c.name_en = 'Makkah';

-- Insert districts for Madinah
INSERT INTO districts (city_id, name_ar, name_en, shipping_price, display_order, is_active)
SELECT c.id, d.name_ar, d.name_en, d.price, d.ord, true
FROM cities c,
(VALUES
  ('العنابيس', 'Al Anabis', 40, 1),
  ('قباء', 'Quba', 35, 2),
  ('العوالي', 'Al Awali', 40, 3),
  ('الحرة الشرقية', 'Eastern Harrah', 45, 4),
  ('الحرة الغربية', 'Western Harrah', 45, 5)
) AS d(name_ar, name_en, price, ord)
WHERE c.name_en = 'Madinah';

-- Insert districts for Dammam
INSERT INTO districts (city_id, name_ar, name_en, shipping_price, display_order, is_active)
SELECT c.id, d.name_ar, d.name_en, d.price, d.ord, true
FROM cities c,
(VALUES
  ('الفيصلية', 'Al Faisaliyah', 30, 1),
  ('الشاطئ', 'Al Shati', 35, 2),
  ('المزروعية', 'Al Mazrouiyah', 30, 3),
  ('الجلوية', 'Al Jalawiyah', 35, 4),
  ('العنود', 'Al Anoud', 30, 5)
) AS d(name_ar, name_en, price, ord)
WHERE c.name_en = 'Dammam';

-- Insert districts for Khobar
INSERT INTO districts (city_id, name_ar, name_en, shipping_price, display_order, is_active)
SELECT c.id, d.name_ar, d.name_en, d.price, d.ord, true
FROM cities c,
(VALUES
  ('الراكة', 'Al Rakah', 30, 1),
  ('اليرموك', 'Al Yarmouk', 30, 2),
  ('الخزامى', 'Al Khuzama', 35, 3),
  ('العقربية', 'Al Aqrabiyah', 35, 4),
  ('الحزام الذهبي', 'Golden Belt', 40, 5)
) AS d(name_ar, name_en, price, ord)
WHERE c.name_en = 'Khobar';

-- Insert districts for Dhahran
INSERT INTO districts (city_id, name_ar, name_en, shipping_price, display_order, is_active)
SELECT c.id, d.name_ar, d.name_en, d.price, d.ord, true
FROM cities c,
(VALUES
  ('الدوحة', 'Al Doha', 35, 1),
  ('غرب الظهران', 'West Dhahran', 35, 2),
  ('شمال الظهران', 'North Dhahran', 40, 3)
) AS d(name_ar, name_en, price, ord)
WHERE c.name_en = 'Dhahran';

-- Insert districts for other cities with default pricing
INSERT INTO districts (city_id, name_ar, name_en, shipping_price, display_order, is_active)
SELECT c.id, 'وسط المدينة', 'City Center', 45, 1, true FROM cities c WHERE c.name_en = 'Taif'
UNION ALL
SELECT c.id, 'وسط المدينة', 'City Center', 50, 1, true FROM cities c WHERE c.name_en = 'Tabuk'
UNION ALL
SELECT c.id, 'وسط المدينة', 'City Center', 45, 1, true FROM cities c WHERE c.name_en = 'Buraidah'
UNION ALL
SELECT c.id, 'وسط المدينة', 'City Center', 50, 1, true FROM cities c WHERE c.name_en = 'Khamis Mushait'
UNION ALL
SELECT c.id, 'وسط المدينة', 'City Center', 50, 1, true FROM cities c WHERE c.name_en = 'Abha'
UNION ALL
SELECT c.id, 'وسط المدينة', 'City Center', 55, 1, true FROM cities c WHERE c.name_en = 'Hail'
UNION ALL
SELECT c.id, 'وسط المدينة', 'City Center', 60, 1, true FROM cities c WHERE c.name_en = 'Najran'
UNION ALL
SELECT c.id, 'وسط المدينة', 'City Center', 55, 1, true FROM cities c WHERE c.name_en = 'Jazan';
