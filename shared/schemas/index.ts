import { z } from 'zod'
import { supportedLocaleCodes } from '../i18n/locales'

const emptyToNull = (maximum: number) => z.union([z.string().trim().max(maximum), z.null()]).transform(value => value || null)
const safeWebUrl = emptyToNull(2048).refine((value) => {
  if (value === null) {
    return true
  }

  const parsed = z.url().safeParse(value)
  return parsed.success && ['http:', 'https:'].includes(new URL(value).protocol)
}, 'Güvensiz bağlantı')

export const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(8).max(200),
  redirect: z.string().startsWith('/').optional(),
})

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(254),
  subject: z.string().trim().min(2).max(160),
  message: z.string().trim().min(10).max(5000),
  privacy: z.literal(true),
  website: z.string().max(0),
})

export const adminMessageQuerySchema = z.object({
  status: z.enum(['all', 'new', 'read', 'archived']).default('all'),
  q: z.string().trim().max(100).default(''),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
})

export const adminMessageStatusSchema = z.object({
  status: z.enum(['new', 'read', 'archived']),
}).strict()

export const siteProfileSchema = z.object({
  name: z.string().trim().min(1, 'Ad ve soyad zorunludur.').max(120),
  title: z.string().trim().min(1, 'Mesleki unvan zorunludur.').max(160),
  focus: z.array(z.string().trim().min(1).max(100)).max(12),
})

export const socialLinkSchema = z.object({
  label: z.string().trim().min(2).max(60),
  platform: z.string().trim().max(40).optional(),
  url: z.url().refine(value => ['http:', 'https:', 'mailto:', 'tel:'].includes(new URL(value).protocol), 'Güvensiz bağlantı'),
  username: z.string().trim().max(80).optional(),
  iconOverride: z.string().regex(/^bi bi-[a-z0-9-]+$/).optional(),
  description: z.string().trim().max(240).optional(),
  isActive: z.boolean().default(true),
  showHome: z.boolean().default(true),
  showContact: z.boolean().default(true),
  showFooter: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
})

export const blogTranslationSchema = z.object({
  title: z.string().trim().min(3).max(180),
  slug: z.string().trim().max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  excerpt: z.string().trim().min(10).max(500),
  content: z.string().trim().min(20).max(200000),
  readingMinutes: z.coerce.number().int().min(1).max(999).default(1),
  seoTitle: emptyToNull(180),
  seoDescription: emptyToNull(500),
  canonicalUrl: safeWebUrl,
})

export const blogTranslationsSchema = z.partialRecord(z.enum(supportedLocaleCodes), blogTranslationSchema)

export const blogTranslationRequestSchema = z.object({
  sourceLocale: z.enum(supportedLocaleCodes),
  targetLocale: z.enum(supportedLocaleCodes),
  source: blogTranslationSchema,
}).refine(value => value.sourceLocale !== value.targetLocale, {
  path: ['targetLocale'],
  message: 'Kaynak ve hedef dil farklı olmalıdır.',
})

export const publicLocaleQuerySchema = z.object({
  locale: z.enum(supportedLocaleCodes).default('tr'),
})

export const postSchema = blogTranslationSchema.pick({ title: true, slug: true, excerpt: true, content: true }).extend({
  status: z.enum(['draft', 'published', 'scheduled', 'archived']),
  publishedAt: z.coerce.date().nullable().optional(),
})
