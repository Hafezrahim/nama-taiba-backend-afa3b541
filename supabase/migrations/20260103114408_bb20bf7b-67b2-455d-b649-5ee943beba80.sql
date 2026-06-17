
-- Add more districts for Riyadh
INSERT INTO districts (city_id, name_ar, name_en, shipping_price, display_order, is_active)
SELECT c.id, d.name_ar, d.name_en, d.price, d.ord, true
FROM cities c,
(VALUES
  ('العقيق', 'Al Aqeeq', 30, 11),
  ('الغدير', 'Al Ghadir', 35, 12),
  ('المروج', 'Al Morouj', 30, 13),
  ('الروابي', 'Al Rawabi', 35, 14),
  ('المونسية', 'Al Munsiyah', 40, 15),
  ('الشفا', 'Al Shifa', 35, 16),
  ('لبن', 'Laban', 40, 17),
  ('السويدي', 'Al Suwaidi', 35, 18),
  ('البديعة', 'Al Badiah', 30, 19),
  ('الفيحاء', 'Al Fayha', 35, 20)
) AS d(name_ar, name_en, price, ord)
WHERE c.name_en = 'Riyadh';

-- Add more districts for Jeddah
INSERT INTO districts (city_id, name_ar, name_en, shipping_price, display_order, is_active)
SELECT c.id, d.name_ar, d.name_en, d.price, d.ord, true
FROM cities c,
(VALUES
  ('الفيصلية', 'Al Faisaliyah', 30, 9),
  ('النعيم', 'Al Naeem', 35, 10),
  ('المروة', 'Al Marwah', 35, 11),
  ('الشرفية', 'Al Sharafiyah', 30, 12),
  ('الربوة', 'Al Rabwah', 35, 13),
  ('أبحر الشمالية', 'North Obhur', 45, 14),
  ('أبحر الجنوبية', 'South Obhur', 40, 15),
  ('الكورنيش', 'Corniche', 35, 16)
) AS d(name_ar, name_en, price, ord)
WHERE c.name_en = 'Jeddah';

-- Add more districts for Dammam
INSERT INTO districts (city_id, name_ar, name_en, shipping_price, display_order, is_active)
SELECT c.id, d.name_ar, d.name_en, d.price, d.ord, true
FROM cities c,
(VALUES
  ('النور', 'Al Noor', 30, 6),
  ('الريان', 'Al Rayyan', 35, 7),
  ('الفردوس', 'Al Firdaws', 35, 8),
  ('الخليج', 'Al Khaleej', 40, 9),
  ('البادية', 'Al Badiyah', 35, 10)
) AS d(name_ar, name_en, price, ord)
WHERE c.name_en = 'Dammam';

-- Add more districts for Khobar
INSERT INTO districts (city_id, name_ar, name_en, shipping_price, display_order, is_active)
SELECT c.id, d.name_ar, d.name_en, d.price, d.ord, true
FROM cities c,
(VALUES
  ('الثقبة', 'Al Thuqbah', 30, 6),
  ('العزيزية', 'Al Aziziyah', 35, 7),
  ('الروابي', 'Al Rawabi', 35, 8),
  ('الحمراء', 'Al Hamra', 30, 9),
  ('البحيرة', 'Al Buhairah', 40, 10)
) AS d(name_ar, name_en, price, ord)
WHERE c.name_en = 'Khobar';

-- Add more districts for Makkah
INSERT INTO districts (city_id, name_ar, name_en, shipping_price, display_order, is_active)
SELECT c.id, d.name_ar, d.name_en, d.price, d.ord, true
FROM cities c,
(VALUES
  ('الحمراء', 'Al Hamra', 35, 6),
  ('النسيم', 'Al Naseem', 40, 7),
  ('العمرة', 'Al Umrah', 35, 8),
  ('الخالدية', 'Al Khalidiyah', 40, 9),
  ('الشرائع', 'Al Sharaie', 45, 10)
) AS d(name_ar, name_en, price, ord)
WHERE c.name_en = 'Makkah';

-- Add more districts for Madinah
INSERT INTO districts (city_id, name_ar, name_en, shipping_price, display_order, is_active)
SELECT c.id, d.name_ar, d.name_en, d.price, d.ord, true
FROM cities c,
(VALUES
  ('السلام', 'Al Salam', 35, 6),
  ('الدفاع', 'Al Difaa', 40, 7),
  ('الخالدية', 'Al Khalidiyah', 35, 8),
  ('المناخة', 'Al Manakhah', 40, 9),
  ('العزيزية', 'Al Aziziyah', 35, 10)
) AS d(name_ar, name_en, price, ord)
WHERE c.name_en = 'Madinah';

-- Add districts for Taif
INSERT INTO districts (city_id, name_ar, name_en, shipping_price, display_order, is_active)
SELECT c.id, d.name_ar, d.name_en, d.price, d.ord, true
FROM cities c,
(VALUES
  ('الشهداء', 'Al Shuhada', 45, 2),
  ('القيم', 'Al Qaim', 50, 3),
  ('الحلقة', 'Al Halaqah', 45, 4),
  ('الهدا', 'Al Hada', 55, 5)
) AS d(name_ar, name_en, price, ord)
WHERE c.name_en = 'Taif';

-- Add districts for Tabuk
INSERT INTO districts (city_id, name_ar, name_en, shipping_price, display_order, is_active)
SELECT c.id, d.name_ar, d.name_en, d.price, d.ord, true
FROM cities c,
(VALUES
  ('المروج', 'Al Morouj', 50, 2),
  ('الفيصلية', 'Al Faisaliyah', 55, 3),
  ('السليمانية', 'Al Sulimaniyah', 50, 4)
) AS d(name_ar, name_en, price, ord)
WHERE c.name_en = 'Tabuk';

-- Add districts for Abha
INSERT INTO districts (city_id, name_ar, name_en, shipping_price, display_order, is_active)
SELECT c.id, d.name_ar, d.name_en, d.price, d.ord, true
FROM cities c,
(VALUES
  ('المنسك', 'Al Mansak', 50, 2),
  ('الخالدية', 'Al Khalidiyah', 55, 3),
  ('المروج', 'Al Morouj', 50, 4)
) AS d(name_ar, name_en, price, ord)
WHERE c.name_en = 'Abha';
