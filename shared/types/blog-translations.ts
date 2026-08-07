import type { SupportedLocale } from '../i18n/locales'

export type BlogTranslation = {
  title: string
  slug: string
  excerpt: string
  content: string
  readingMinutes: number
  seoTitle: string | null
  seoDescription: string | null
  canonicalUrl: string | null
}

export type BlogTranslations = Partial<Record<SupportedLocale, BlogTranslation>>

export type AdminBlogTranslation = BlogTranslation & {
  enabled: boolean
}

export type AdminBlogTranslations = Record<SupportedLocale, AdminBlogTranslation>
