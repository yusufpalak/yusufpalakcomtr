import { defaultLocale, supportedLocales } from './shared/i18n/locales'

const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const libreTranslateTimeout = Number(process.env.NUXT_LIBRE_TRANSLATE_TIMEOUT_MS || 30000)

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: ['@nuxt/ui', 'nuxt-auth-utils', '@nuxtjs/i18n', '@nuxt/eslint'],
  css: [
    '~/assets/css/main.css',
    '~/assets/css/refinement.css',
    '~/assets/css/social.css',
    '~/assets/css/i18n.css',
    '~/assets/css/public-content.css',
    '~/assets/css/public-content-overrides.css',
    '~/assets/css/admin.css',
    '~/assets/css/admin-relations.css',
    'bootstrap-icons/font/bootstrap-icons.css',
  ],
  i18n: {
    baseUrl: siteUrl,
    customRoutes: 'meta',
    defaultLocale,
    strategy: 'prefix_except_default',
    detectBrowserLanguage: false,
    locales: supportedLocales.map(locale => ({ ...locale })),
  },
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    libreTranslate: {
      url: process.env.NUXT_LIBRE_TRANSLATE_URL || 'http://127.0.0.1:5500',
      apiKey: process.env.NUXT_LIBRE_TRANSLATE_API_KEY || '',
      timeoutMs: Number.isFinite(libreTranslateTimeout) ? Math.min(60000, Math.max(3000, libreTranslateTimeout)) : 30000,
    },
    session: {
      password: process.env.NUXT_SESSION_PASSWORD || (process.env.NODE_ENV === 'production' ? '' : 'dev-only-session-secret-change-me-32-chars'),
    },
    public: { siteUrl },
  },
  typescript: { strict: true, typeCheck: false },
  routeRules: {
    '/admin/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
    '/api/public/**': { cache: false },
  },
  nitro: {
    routeRules: {
      '/**': {
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
          'X-Frame-Options': 'DENY',
          'Content-Security-Policy': "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'",
        },
      },
    },
  },
  app: {
    head: {
      titleTemplate: '%s · Yusuf Palak',
      link: [{ rel: 'icon', href: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22><text y=%22.9em%22 font-size=%2290%22>YP</text></svg>' }],
    },
  },
})
