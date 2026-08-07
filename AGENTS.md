# Yusuf Palak Portfolio — Agent Guide

Nuxt 4 monolitidir: `app/` public/admin UI, `server/api/public` anonim API, `server/api/admin` server-side oturum korumalı API, `server/database` Drizzle şeması ve migrationlar, `shared` ortak Zod şemaları ve saf domain utilityleri.

## Kurallar

- TypeScript strict; `any` kullanma. UI içinde SQL yazma.
- Her admin endpointinde `requireAdmin(event)` çağır; client middleware tek başına güvenlik sınırı değildir.
- Her girdi Zod ile doğrulanır, rich text sunucuda sanitize edilir.
- Migration geçmişini silme; production'da `db:push` çalıştırma.
- Secret commit etme. Yeni çevre değişkenini `.env.example` ve README'ye ekle.
- Public sorgular yalnızca aktif/yayınlanmış kayıtları ve gerekli kolonları seçer.
- Dış bağlantılarda `noopener noreferrer`; silmede ilişki davranışını açıkça seç.
- Değişiklik sonrası en az `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` çalıştır.
