# Deployment

1. Secret manager ile `DATABASE_URL` ve `NUXT_SESSION_PASSWORD` tanımla.
2. Image oluştur ve güvenlik taraması yap.
3. `pnpm db:migrate` işini tek instance olarak çalıştır.
4. Uygulamayı en az bir instance başlat; `/api/health` ile kontrol et.
5. Reverse proxy'de TLS ve doğru forwarded IP başlıklarını etkinleştir.

Production başlangıcında `db:push` yoktur. Yerel medya kullanılırsa named volume ve ayrı yedek; S3 kullanılırsa bucket versioning önerilir.
