# Mimari

Nuxt/Nitro tek dağıtım birimidir. SSR public sayfalar SEO üretir; admin ayrı layout kullanır. İstemci yalnızca HTTP API ile konuşur. API → Zod → domain/service → Drizzle/PostgreSQL akışı izlenir. Sealed HttpOnly cookie oturumu ve endpoint bazlı yetki kontrolü güvenlik sınırıdır. Depolama yerel ve S3 sürücülerine ayrılabilecek kayıt modeline sahiptir.
