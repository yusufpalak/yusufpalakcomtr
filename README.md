# Yusuf Palak — Kişisel Web Sitesi

Nuxt 4, Vue 3, TypeScript, Nuxt UI, PostgreSQL ve Drizzle ile geliştirilen SSR kişisel marka ve içerik yönetim sistemi.

## Kurulum

Node 22+, pnpm 10+, PostgreSQL 16+ gerekir. Development compose servisi, yerel PostgreSQL kurulumlarıyla çakışmaması için host üzerinde `55432` portunu kullanır.

```bash
pnpm install
cp .env.example .env
docker compose -f docker-compose.dev.yml up -d postgres
pnpm db:push
pnpm db:seed
pnpm dev
```

İlk admin yalnızca `ADMIN_EMAIL` ve en az 12 karakterli `ADMIN_PASSWORD` tanımlanıp `pnpm db:seed` çalıştırıldığında idempotent biçimde oluşturulur. Parola loglanmaz.

## Komutlar

- `pnpm dev`, `pnpm build`, `pnpm start`
- `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:push` (yalnızca geliştirme), `pnpm db:seed`, `pnpm db:seed:content`, `pnpm db:studio`
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`

## Yapılandırma

Tüm değişkenler `.env.example` içindedir. Production'da güçlü `NUXT_SESSION_PASSWORD`, harici `DATABASE_URL` ve gerekirse S3 değerleri secret manager üzerinden verilir. İletişim mesajları veritabanına kaydedilir ve admin panelinin gelen kutusunda listelenir. E-posta bildirimi henüz etkin değildir; `.env.example` içindeki SMTP alanları tek başına e-posta gönderimi başlatmaz. S3 için endpoint, region, bucket ve anahtarlar; MinIO için ayrıca path-style açılır.

### Örnek portfolyo içeriği

`pnpm db:seed:content`, herkese açık [LinkedIn profilindeki](https://www.linkedin.com/in/yusufpalak/) doğrulanabilen bilgileri ve kullanıcının doğruladığı Kernela Soft kurucu ortaklığını temel alarak anasayfa/hakkımda bölümlerini, eğitimleri, sertifikaları, Kernela Soft deneyimini, Artemis Halı ve DineX içeriklerini ve otomatik istatistikleri ekler. Komut tekrar çalıştırılabilir; aynı anahtara/ada sahip mevcut kayıtları güncellemez. LinkedIn'de ayrıntısı görünmeyen iş deneyimi tarihleri, bireysel görev kapsamı ve görseller uydurulmaz. Sertifika tarihlerinde yalnızca ay/yıl bilindiğinden veritabanında ilgili ayın ilk günü kullanılır.

Kullanıcının sağladığı eski statik site arşivi ayrıca `scripts/import-legacy-portfolio.ts` ile içe aktarılabilir: ZIP'i güvenli bir klasöre açın ve `STORAGE_DRIVER=local` ile `pnpm exec tsx scripts/import-legacy-portfolio.ts <açılmış-arşiv-kökü>` çalıştırın. Betik yalnızca doğrulanan kariyer/eğitim kayıtlarını, dört gerçek okul projesini ve eşleşen proje/sertifika görselleri ile PDF belgelerini alır; eski şablonun örnek içeriklerini atlar. Var olan yönetim paneli kayıtları ve dolu medya alanları korunur. İçe aktarılan dosyalar `.data/uploads` altında tutulur; bu klasörü yedekleyin. Yerel medyayı sonradan S3'e taşımak ayrı bir göç işlemidir.

### Medya ve AWS S3

Yönetim panelindeki **Medya kütüphanesi** JPG, PNG, WebP, AVIF ve PDF yükler. Görseller WebP'ye dönüştürülür; yüklenen dosyalar proje/blog kapaklarında ve sertifikalarda seçilebilir. PDF dosyaları indirme olarak sunulur. Bir içerikte kullanılan dosya, önce o içerikten ayrılmadan silinemez.

Yerel geliştirmede `STORAGE_DRIVER=local` ve `LOCAL_UPLOAD_DIR=.data/uploads` kullanılır. AWS S3'e geçmek için `STORAGE_DRIVER=s3` yapıp bölge ve bucket değerlerini tanımlayın. Uygulama `S3_REGION` / `S3_BUCKET` yerine mevcut `AWS_REGION` / `AWS_S3_BUCKET_NAME` adlarını da kabul eder. `S3_ACCESS_KEY` ile `S3_SECRET_KEY` birlikte verilebilir; ikisi de boşsa AWS SDK'nın varsayılan kimlik bilgisi zinciri (`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` veya IAM rolü) kullanılır. Anahtarları kaynak koda koymayın. Gerçek AWS için `S3_ENDPOINT` boş ve `S3_FORCE_PATH_STYLE=false` kalır. Özel S3 uyumlu servislerde endpoint ve gerekirse path-style tanımlanır.

Yeni S3 dosyaları aynı bucket içinde `yusufpalakcomtr/uploads/<dosya-id>.webp` veya `.pdf` anahtarıyla saklanır; ayrı bucket ya da başta `/` kullanılmaz. Önceden `uploads/*` altında saklanan S3 dosyaları da okunmaya devam eder. IAM kimliğine yeni dosyalar için `yusufpalakcomtr/uploads/*`, eski S3 dosyaları varsa ayrıca `uploads/*` nesnelerinde `s3:PutObject`, `s3:GetObject` ve `s3:DeleteObject` izinleri verin. Bucket özel kalabilir; dosyalar uygulamanın `/api/public/media/:id` yolu üzerinden sunulur. Önceden yerel yüklenen dosyalar sürücü değişse de yerel dizinden okunur; o dizini silmeyin.

## Dil desteği

Public site Türkçe ve İngilizce çalışır. Türkçe mevcut URL'leri kullanır; İngilizce sayfalar `/en/...` altında yayınlanır. Yönetim paneli locale rotalarından bilinçli olarak ayrılmıştır ve `/admin` altında kalır.

Blog ekleme ve düzenleme ekranındaki dil sekmelerinde her yazının başlık, slug, özet, içerik, okuma süresi ve SEO alanları ayrı ayrı yönetilir. Türkçe ana sürümdür; diğer dil sürümleri etkinleştirildiklerinde kendi locale rotalarında yayınlanır. Çevirisi bulunmayan bir yazı o dilde listelenmez.

Türkçe içerik tamamlandıktan sonra diğer dil sekmelerindeki **LibreTranslate ile çevir** butonu başlık, özet, zengin metin içeriği ve dolu SEO alanlarını çevirir; hedef slug ile okuma süresini yeniden üretir. Sonuç yalnızca forma doldurulur, yayınlanmadan önce kontrol edilip kaydedilmelidir. Development compose içindeki yerel LibreTranslate yalnızca Türkçe ve İngilizce modellerini yükler ve `http://127.0.0.1:5500` adresinde çalışır. Farklı bir kurulum kullanmak için `NUXT_LIBRE_TRANSLATE_URL`; anahtar isteyen bir servis için ayrıca `NUXT_LIBRE_TRANSLATE_API_KEY` tanımlayın.

Yeni bir dil eklemek için `i18n/locales` altında mevcut dosyalardan biriyle aynı anahtarları taşıyan yeni bir JSON dosyası oluşturun ve `shared/i18n/locales.ts` içindeki merkezi dil listesine dil kodu, görünen ad, BCP 47 dil etiketi ve dosya adını ekleyin. Dil dosyalarının anahtar eşitliği testlerle doğrulanır; blog çeviri verisi aynı kaydın JSONB alanında tutulduğu için yeni bir veritabanı tablosu gerekmez.

## Deployment ve yedekleme

`docker build -t yusuf-palak .` ile non-root multi-stage image üretilir. Production veritabanı ayrı/shared PostgreSQL olabilir. Migration deployment öncesi ayrı iş olarak çalıştırılır. Günlük `pg_dump`, object storage versioning ve şifreli uzak yedek önerilir.

Sorun giderme: 503 veritabanı yapılandırmasının eksik olduğunu, 401 oturum gerektiğini, 429 rate limit aşıldığını gösterir. Migration öncesi `DATABASE_URL` ve PostgreSQL health durumunu kontrol edin.
