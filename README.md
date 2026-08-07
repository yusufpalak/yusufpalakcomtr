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
- `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:push` (yalnızca geliştirme), `pnpm db:seed`, `pnpm db:studio`
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`

## Yapılandırma

Tüm değişkenler `.env.example` içindedir. Production'da güçlü `NUXT_SESSION_PASSWORD`, harici `DATABASE_URL` ve gerekirse S3/SMTP değerleri secret manager üzerinden verilir. SMTP yokken mesaj veritabanına kaydolmaya devam eder. S3 için endpoint, region, bucket ve anahtarlar; MinIO için ayrıca path-style açılır.

## Dil desteği

Public site Türkçe ve İngilizce çalışır. Türkçe mevcut URL'leri kullanır; İngilizce sayfalar `/en/...` altında yayınlanır. Yönetim paneli locale rotalarından bilinçli olarak ayrılmıştır ve `/admin` altında kalır.

Blog ekleme ve düzenleme ekranındaki dil sekmelerinde her yazının başlık, slug, özet, içerik, okuma süresi ve SEO alanları ayrı ayrı yönetilir. Türkçe ana sürümdür; diğer dil sürümleri etkinleştirildiklerinde kendi locale rotalarında yayınlanır. Çevirisi bulunmayan bir yazı o dilde listelenmez.

Türkçe içerik tamamlandıktan sonra diğer dil sekmelerindeki **LibreTranslate ile çevir** butonu başlık, özet, zengin metin içeriği ve dolu SEO alanlarını çevirir; hedef slug ile okuma süresini yeniden üretir. Sonuç yalnızca forma doldurulur, yayınlanmadan önce kontrol edilip kaydedilmelidir. Development compose içindeki yerel LibreTranslate yalnızca Türkçe ve İngilizce modellerini yükler ve `http://127.0.0.1:5500` adresinde çalışır. Farklı bir kurulum kullanmak için `NUXT_LIBRE_TRANSLATE_URL`; anahtar isteyen bir servis için ayrıca `NUXT_LIBRE_TRANSLATE_API_KEY` tanımlayın.

Yeni bir dil eklemek için `i18n/locales` altında mevcut dosyalardan biriyle aynı anahtarları taşıyan yeni bir JSON dosyası oluşturun ve `shared/i18n/locales.ts` içindeki merkezi dil listesine dil kodu, görünen ad, BCP 47 dil etiketi ve dosya adını ekleyin. Dil dosyalarının anahtar eşitliği testlerle doğrulanır; blog çeviri verisi aynı kaydın JSONB alanında tutulduğu için yeni bir veritabanı tablosu gerekmez.

## Deployment ve yedekleme

`docker build -t yusuf-palak .` ile non-root multi-stage image üretilir. Production veritabanı ayrı/shared PostgreSQL olabilir. Migration deployment öncesi ayrı iş olarak çalıştırılır. Günlük `pg_dump`, object storage versioning ve şifreli uzak yedek önerilir.

Sorun giderme: 503 veritabanı yapılandırmasının eksik olduğunu, 401 oturum gerektiğini, 429 rate limit aşıldığını gösterir. Migration öncesi `DATABASE_URL` ve PostgreSQL health durumunu kontrol edin.
