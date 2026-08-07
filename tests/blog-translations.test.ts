import { describe, expect, it } from 'vitest'
import { blogTranslationRequestSchema, blogTranslationsSchema, publicLocaleQuerySchema } from '../shared/schemas'

const englishTranslation = {
  title: 'Building a multilingual portfolio',
  slug: 'building-a-multilingual-portfolio',
  excerpt: 'A practical look at publishing one article in multiple languages.',
  content: '<p>This article explains how localized blog content is managed safely.</p>',
  readingMinutes: 4,
  seoTitle: 'Building a multilingual portfolio',
  seoDescription: 'How one blog post can have independent localized content.',
  canonicalUrl: 'https://example.com/en/blog/building-a-multilingual-portfolio',
}

describe('blog translations', () => {
  it('accepts a complete supported-locale translation', () => {
    expect(blogTranslationsSchema.parse({ en: englishTranslation })).toEqual({ en: englishTranslation })
  })

  it('accepts null optional metadata returned by translation providers', () => {
    const translation = { ...englishTranslation, seoTitle: null, seoDescription: null, canonicalUrl: null }
    expect(blogTranslationsSchema.parse({ en: translation })).toEqual({ en: translation })
  })

  it('rejects unsupported locales and unsafe canonical URLs', () => {
    expect(blogTranslationsSchema.safeParse({ de: englishTranslation }).success).toBe(false)
    expect(blogTranslationsSchema.safeParse({ en: { ...englishTranslation, canonicalUrl: 'javascript:alert(1)' } }).success).toBe(false)
  })

  it('accepts only configured public locales', () => {
    expect(publicLocaleQuerySchema.parse({ locale: 'en' }).locale).toBe('en')
    expect(publicLocaleQuerySchema.safeParse({ locale: 'de' }).success).toBe(false)
  })

  it('requires different supported source and target locales', () => {
    expect(blogTranslationRequestSchema.safeParse({ sourceLocale: 'tr', targetLocale: 'en', source: englishTranslation }).success).toBe(true)
    expect(blogTranslationRequestSchema.safeParse({ sourceLocale: 'tr', targetLocale: 'tr', source: englishTranslation }).success).toBe(false)
  })
})
