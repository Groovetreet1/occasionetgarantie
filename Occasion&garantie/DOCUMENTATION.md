# Documentation - Occasion & Garantie

## مقدمة
منصة مغربية لبيع وشراء الإلكترونيات المستعملة مع الضمان. تشمل نظام إعادة الشراء (Reprise)، نظام تتبع أمني للبائعين، ولوحة تحكم للمشرف.

---

## 1. هيكلة المشروع

```
occasion-garantie/
├── backend/                  # Express.js API
│   ├── config/
│   │   └── db.js             # اتصال MySQL
│   ├── emails/
│   │   ├── index.js          # إرسال الإيميلات عبر Resend
│   │   ├── verification.js
│   │   └── credit-confirmed.js
│   ├── middleware/
│   │   └── auth.js           # JWT authentication + admin/seller roles
│   ├── routes/
│   │   ├── auth.js           # Login, Signup, Verification, Reset password
│   │   ├── products.js       # CRUD produits + upload images
│   │   ├── admin.js          # Toutes les routes admin
│   │   ├── chat.js           # Messagerie entre acheteurs et vendeurs
│   │   ├── reprises.js       # Système de reprise
│   │   ├── notifications.js  # Notifications in-app
│   │   ├── newsletter.js     # Newsletter
│   │   └── contact.js        # Tickets de support
│   ├── services/
│   │   ├── tracker.js        # logVendorAction + resolveIp
│   │   └── gomobile.js       # SMS via GoMobile
│   ├── server.js             # Point d'entrée
│   └── .env                  # Variables d'environnement
│
└── frontend/                 # React + Vite
    ├── src/
    │   ├── api/
    │   │   └── axios.js      # Axios instance + interceptors
    │   ├── context/
    │   │   └── AuthContext.jsx # Contexte d'authentification
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── AdminRoute.jsx
    │   │   ├── SellerRoute.jsx
    │   │   ├── GoMobileTicker.jsx   # شريط إعلاني متحرك GoMobile
    │   │   ├── GoMobileFadeBar.jsx  # شريط إعلاني بتأثير الظهور/الاختفاء
    │   │   └── GoMobileBanner.jsx   # بانر سفلي يظهر بعد 8 ثواني
    │   ├── locales/            # الترجمات (fr / ar)
    │   └── pages/              # Toutes les pages
    ├── index.css
    └── vite.config.js
```

---

## 2. التثبيت والتشغيل

### المتطلبات
- Node.js 18+
- MySQL 8+
- Compte Render (استضافة)
- Compte Resend (إيميلات)
- Compte GoMobile (SMS)

### التثبيت محليا

```bash
# 1. استنساخ المشروع
git clone https://github.com/Groovetreet1/occasionetgarantie.git

# 2. تثبيت الاعتماديات
cd backend
npm install
cd ../frontend
npm install

# 3. إعداد ملف البيئة backend/.env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=...
DB_NAME=occasion_garantie
JWT_SECRET=...
RESEND_API_KEY=re_...
GOMOBILI_API_KEY=...

# 4. إنشاء قاعدة البيانات
mysql -u root -p -e "CREATE DATABASE occasion_garantie"

# 5. تشغيل التطبيق محليا
cd backend && npm run dev   # Port 5000
cd frontend && npm run dev  # Port 4001
```

### النشر على Render

```bash
# 1. رفع التغييرات
git add -A
git commit -m "..."
git push origin main

# 2. Render Dashboard
#    → Manual Deploy → Deploy latest commit
#    → Restart service
```

---

## 3. قاعدة البيانات (MySQL)

### جدول `users`
| العمود | النوع | الشرح |
|--------|------|-------|
| id | INT PK | رقم المستخدم |
| full_name | VARCHAR(100) | الاسم الكامل |
| email | VARCHAR(100) | البريد الإلكتروني |
| password | VARCHAR(255) | كلمة السر (bcrypt) |
| phone | VARCHAR(20) | رقم الهاتف |
| role | ENUM('user','seller','admin') | الصلاحية |
| store_name | VARCHAR(100) | اسم المتجر (للبائعين) |
| phone_verified | TINYINT(1) | هل تم توثيق الهاتف |
| suspended | TINYINT(1) | هل الحساب موقوف |
| suspension_reason | VARCHAR(255) | سبب الإيقاف |
| vpn_warned_at | DATETIME | آخر تحذير VPN |
| admin_managed_id | INT NULL | الحسابات التي يديرها المشرف |

### جدول `products`
| العمود | النوع | الشرح |
|--------|------|-------|
| id | INT PK | رقم المنتج |
| seller_id | INT FK | البائع |
| name | VARCHAR(200) | اسم المنتج |
| slug | VARCHAR(200) | الرابط |
| description | TEXT | الوصف |
| price | DECIMAL(10,2) | السعر |
| old_price | DECIMAL(10,2) | السعر القديم |
| category_id | INT | الفئة (1-5) |
| brand | VARCHAR(100) | الماركة |
| state | VARCHAR(50) | الحالة |
| warranty | VARCHAR(50) | الضمان |
| ville | VARCHAR(100) | المدينة |
| specs | JSON | المواصفات التقنية |
| image | VARCHAR(500) | الصورة الرئيسية |
| gallery | JSON | معرض الصور |
| approved | TINYINT(1) | هل تمت الموافقة |
| created_at | TIMESTAMP | تاريخ النشر |

### جدول `vendor_activity_log`
| العمود | النوع | الشرح |
|--------|------|-------|
| id | INT PK | رقم السجل |
| user_id | INT FK | المستخدم |
| action | VARCHAR(50) | الإجراء (connexion, produit_ajoute, statut_...) |
| ip_address | VARCHAR(45) | عنوان IP |
| isp | VARCHAR(200) | مزود الخدمة |
| city | VARCHAR(100) | المدينة (من IP) |
| region | VARCHAR(100) | الجهة |
| country | VARCHAR(100) | الدولة |
| is_vpn | TINYINT(1) | هل هو VPN |
| is_datacenter | TINYINT(1) | هل هو مركز بيانات |
| vpn_warned_at | DATETIME | وقت تحذير VPN |
| latitude | DECIMAL(10,7) | خط العرض (IP) |
| longitude | DECIMAL(10,7) | خط الطول (IP) |
| user_agent | TEXT | معلومات المتصفح |
| product_id | INT | المنتج المرتبط |
| details | TEXT | تفاصيل إضافية |
| created_at | TIMESTAMP | تاريخ الإجراء |

### جداول أخرى
- `conversations` — المحادثات
- `messages` — الرسائل
- `reprises` — طلبات إعادة الشراء
- `reprise_photos` — صور إعادة الشراء
- `notifications` — الإشعارات
- `credit_purchases` — شراء الرصيد
- `installments` — التقسيط
- `premium_payments` — طلبات برايم
- `contact_tickets` — تذاكر الدعم

---

## 4. الصلاحيات والأدوار

| الدور | الصلاحيات |
|-------|-----------|
| **admin** | كل الصلاحيات: إدارة المنتجات، المستخدمين، البائعين، journal des vendeurs، comptes vendeur، الموافقات |
| **seller** | إضافة وتعديل منتجاته، لوحة إحصائيات، إدارة الـ reprise الخاصة به |
| **user** | تصفح، شراء، مراسلة البائعين، تقديم طلبات reprise |

---

## 5. الميزات الأساسية

### 5.1 النظام الأمني للبائعين (Vendor Security Tracking)
- كل إجراء يقوم به البائع يُسجل في `vendor_activity_log`
- تسجيل الدخول، إضافة منتج، تغيير الحالة
- كشف VPN/IP عبر `resolveIp()` (ipapi.is + ip-api.com)
- تحذير عبر الإيميل إذا تم كشف VPN
- إيقاف الحساب تلقائيا بعد ساعة من استخدام VPN

### 5.2 Comptes Vendeur (مدير من المشرف)
- المشرف ينشئ حسابات بائعين من `/admin/managed-vendors`
- يتم توليد إيميل + كلمة سر عشوائية
- المشرف يستخدم هذه الحسابات لنشر إعلاناته
- وصول رسالة → إيميل للمشرف → يتصل بالحساب ويرد

### 5.3 نظام الـ Reprise (إعادة الشراء)
- الزبون يقدم طلب إعادة شراء
- يرفق صور المنتج
- البائع يوافق أو يرفض
- رفض تلقائي بعد 5 أيام
- إشعار في التطبيق عند تغيير الحالة

### 5.4 الموافقة على المنتجات (Approval)
- `approved` عمود في جدول المنتجات (0 أو 1)
- البائعون الجدد `approved=0` افتراضيا
- المشرف يوافق على المنتجات من `/admin/products/pending`
- زر "Approuver tout" للموافقة على الكل

### 5.5 GPS في إنشاء المنتج
- عند إنشاء منتج جديد، يطلب المتصفح الإذن بالموقع
- يتم تحديد المدينة عبر GPS → ملء حقل "Ville" تلقائيا
- لا يمكن نشر المنتج بدون قبول الموقع
- **ملاحظة**: تسجيل الدخول لا يتطلب GPS

### 5.6 جلسات الدخول (Session)
- JWT صالح لمدة **6 ساعات**
- عند انتهاء الجلسة أو خطأ 401 → إعادة توجيه تلقائي إلى `/login`

### 5.7 الإعلانات (GoMobile Ads)
- إعلانات للمستخدمين العاديين فقط (غير ظاهرة للمستخدمين `premium`)
- غير ظاهرة في صفحات `/admin`, `/messenger`, `/login`, `/signup`
- **GoMobileTicker** (شريط متحرك): أسفل قسم «Un téléphone à vendre ?» في الصفحة الرئيسية وأسفل الهيدر في صفحة «À propos»
- **GoMobileFadeBar** (شريط بظهور/اختفاء): أسفل قسم «Boutique Officielle» في الرئيسية وأسفل الهيدر في صفحة «Products»
- **GoMobileBanner** (بانر سفلي): يظهر بعد 8 ثواني في كل تنقّل، زر إغلاق ×، في الجوال يظهر كبطاقة تنزلق من الأسفل (bottom sheet)
- ارتفاع الأشرطة 120px وعرضها محدود بـ `max-width: 1200px`
- عند مرور الماوس تتوقف الحركة (pause on hover)
- كل النصوص مترجمة في `locales/fr/common.js` و `locales/ar/common.js` ضمن كائن `ad`

---

## 6. API Routes

### المصادقة (Auth)
| الطريقة | المسار | الشرح |
|---------|--------|-------|
| POST | `/api/auth/signup` | إنشاء حساب |
| POST | `/api/auth/login` | تسجيل الدخول |
| GET | `/api/auth/me` | معلومات المستخدم الحالي |
| POST | `/api/auth/verify` | توثيق الهاتف |
| POST | `/api/auth/forgot-password` | نسيت كلمة السر |
| POST | `/api/auth/reset-password` | إعادة تعيين كلمة السر |

### المنتجات (Products)
| الطريقة | المسار | الشرح |
|---------|--------|-------|
| GET | `/api/products` | قائمة المنتجات |
| GET | `/api/products/:slug` | تفاصيل منتج |
| POST | `/api/products` | إنشاء منتج (seller) |
| PUT | `/api/products/:id` | تعديل منتج (seller) |
| DELETE | `/api/products/:id` | حذف منتج (seller/admin) |

### لوحة المشرف (Admin)
| الطريقة | المسار | الشرح |
|---------|--------|-------|
| GET | `/api/admin/users` | جميع المستخدمين |
| GET | `/api/admin/products` | جميع المنتجات |
| GET | `/api/admin/products/pending` | المنتجات في انتظار الموافقة |
| POST | `/api/admin/products/approve-all` | موافقة على الكل |
| GET | `/api/admin/vendor-logs` | سجل نشاط البائعين |
| POST | `/api/admin/vendor-logs/reindex` | إعادة تحليل كل IP |
| GET | `/api/admin/test-resolve?ip=` | اختبار resolveIp |
| GET | `/api/admin/managed-vendors` | قائمة الحسابات المدارة |
| POST | `/api/admin/managed-vendors` | إنشاء حساب بائع مُدار |
| DELETE | `/api/admin/managed-vendors/:id` | حذف حساب مُدار |

### المحادثات (Chat)
| الطريقة | المسار | الشرح |
|---------|--------|-------|
| POST | `/api/chat/conversations` | إنشاء محادثة جديدة |
| GET | `/api/chat/conversations` | قائمة المحادثات |
| GET | `/api/chat/conversations/:id/messages` | رسائل المحادثة |
| POST | `/api/chat/conversations/:id/messages` | إرسال رسالة |
| POST | `/api/chat/conversations/:id/typing` | مؤشر الكتابة |

### الـ Reprise
| الطريقة | المسار | الشرح |
|---------|--------|-------|
| POST | `/api/reprises` | تقديم طلب reprise |
| GET | `/api/reprises` | قائمة الطلبات (admin/seller) |
| PUT | `/api/reprises/:id/status` | تغيير الحالة |

### الإشعارات
| الطريقة | المسار | الشرح |
|---------|--------|-------|
| GET | `/api/notifications` | قائمة الإشعارات |
| GET | `/api/notifications/unread-count` | عدد الإشعارات غير المقروءة |
| PUT | `/api/notifications/:id/read` | تحديد كمقروء |

---

## 7. دليل المشرف (Admin Guide)

### 7.1 لوحة التحكم `/admin`
- بطاقات سريعة لكل قسم
- روابط للصفحات الإدارية

### 7.2 إدارة الحسابات المُدارة `/admin/managed-vendors`
- إنشاء حساب بائع جديد (الاسم، المتجر، المدينة)
- يتم توليد إيميل + كلمة سر عشوائية
- تظهر البيانات مرة واحدة فقط — يجب نسخها
- حذف حساب
- عند وصول رسالة لهذا الحساب → إيميل للمشرف

### 7.3 سجل البائعين `/admin/vendor-logs`
- جدول بكل إجراءات البائعين
- خريطة Leaflet مع مواقع IP
- بحث بالاسم، الإيميل، العنوان IP
- زر "Re-analyser tout" لإعادة تحليل كل IP
- شارة VPN/Hebergement لكل سجل
- إمكانية نسخ الإحداثيات

### 7.4 الموافقة على المنتجات `/admin/products/pending`
- قائمة المنتجات في انتظار الموافقة
- موافقة فردية أو موافقة على الكل
- البائعون الجدد `approved=0` افتراضيا

### 7.5 البريد الإلكتروني
- إعدادات الإيميلات في `.env` عبر `RESEND_API_KEY`
- الإيميلات ترسل من `contact@contact.occasionetgarantie.store`
- إيميلات التحذير VPN ترسل للبائع
- إيميلات الرسائل الجديدة ترسل للمشرف (`contact-occasionetgarantie@proton.me`)

### 7.6 خريطة Leaflet (Vendor Logs)
- تستخدم OpenStreetMap (مجانا)
- كل علامة تحتوي على الاسم، الإيميل، الإجراء، IP، ISP
- رابط Google Maps لكل موقع
- يتم تحميل Leaflet ديناميكيا (lazy load)

---

## 8. دليل البائع (Seller Guide)

### 8.1 إنشاء حساب
- التسجيل عبر `/signup`
- توثيق الهاتف عبر رمز SMS/إيميل
- بعد التوثيق، يمكن تسجيل الدخول

### 8.2 نشر منتج
- `/seller/products/new`
- **مهم**: يجب قبول طلب الموقع (GPS) لتحديد المدينة
- إضافة صور، المواصفات، السعر، الضمان
- بعد النشر، المنتج في انتظار الموافقة (إذا كان البائع جديدا)
- بعد الموافقة، يظهر المنتج في الموقع

### 8.3 إدارة المنتجات
- `/seller` → لوحة البائع
- تعديل، تغيير الحالة (متوفر، في انتظار، مباع)
- إحصائيات المبيعات `/seller/stats`

### 8.4 Reprise (إعادة الشراء)
- إدارة طلبات إعادة الشراء من `/reprise/list`
- الموافقة أو الرفض على الطلبات

---

## 9. الأمان

### JWT
- ينتهي بعد 6 ساعات
- المخزن في `localStorage`
- 401 Interceptor → إعادة توجيه إلى `/login`

### كشف VPN
- `resolveIp()` يستخدم `ipapi.is` للكشف
- VPN/Proxy/Datacenter → تحذير عبر الإيميل
- استمرار VPN لأكثر من ساعة → إيقاف الحساب

### SQL Injection
- كل الاستعلامات عبر parameterized queries (`?` placeholders)
- لا يتم استخدام concat مباشرة

---

## 10. النشر (Deploy)

### 10.1 التحضير
```bash
cd "Occasion&garantie"
git add -A
git commit -m "..."
git push origin main
```

### 10.2 Render
1. الذهاب إلى **Render Dashboard**
2. **Manual Deploy** → **Deploy latest commit**
3. انتظار انتهاء الـ Build
4. **Restart Service**
5. اختبار الموقع

### 10.3 التحقق
```bash
# اختبار resolveIp
curl https://www.occasionetgarantie.store/api/admin/test-resolve?ip=105.190.181.219
# يجب أن تظهر parsedLat, hasLat, etc.
```

### 10.4 المتغيرات البيئية (Render)
```
JWT_SECRET=...
RESEND_API_KEY=re_...
GOMOBILI_API_KEY=...
DB_HOST=...
DB_USER=...
DB_PASSWORD=...
DB_NAME=occasion_garantie
```

---

## 11. الأكواد المهمة

### logVendorAction (tracker.js)
```js
async function logVendorAction({ userId, action, ip, userAgent, productId, details, latitude, longitude })
```
- تسجيل أي إجراء يقوم به المستخدم
- INSERT في `vendor_activity_log`
- resolveIp (async) → تحديث ISP, city, lat/lng, is_vpn
- كشف VPN وإرسال تحذير

### resolveIp (tracker.js)
```js
async function resolveIp(ip, force)
```
- `ip`: عنوان IP
- `force`: تجاهل الـ cache (true/false)
- يرجع: `{ isp, city, region, country, latitude, longitude, isVpn, isDatacenter }`

### logVendorAction (utilisation dans auth.js)
```js
const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
logVendorAction({ userId: user.id, action: 'connexion', ip, userAgent: req.headers['user-agent'] });
```

### GPS Product Creation (SellerProductForm.jsx)
```js
navigator.geolocation.getCurrentPosition(
  (pos) => { /* set GPS + reverse geocode city */ },
  () => { /* denied */ },
  { timeout: 15000 }
);
```

---

## 12. استكشاف الأخطاء

| المشكلة | الحل |
|---------|------|
| صفحة سوداء في `/admin/vendor-logs` | تحقق من تحميل Leaflet (lazy load + try-catch) |
| خطأ SQL في إنشاء حساب مُدار | تحقق من عدد `?` في INSERT يطابق عدد parameters |
| الإيميلات لا ترسل | تحقق من `RESEND_API_KEY` في `.env` |
| GPS لا يعمل | تأكد من HTTPS (المتصفحات تمنع GPS على HTTP) |
| 401 عند تسجيل الدخول | تحقق من مدة صلاحية JWT (6h) |
| خريطة لا تظهر | تحقق من اتصال OpenStreetMap (قد يكون محظورا) |
| البانر السفلي لا يظهر | تأكد أن المستخدم ليس `premium` وأنه ليس في `/admin` أو `/login` |

---

## 13. جهات الاتصال

- **Support technique**: `contact@contact.occasionetgarantie.store`
- **Administration**: `contact-occasionetgarantie@proton.me`
- **Dépôt GitHub**: `https://github.com/Groovetreet1/occasionetgarantie`

---

*Documentation générée par opencode - Août 2026*
