import { z } from 'zod'
import { readingTime, slugify } from '../../shared/utils/content'
import type { SupportedLocale } from '../../shared/i18n/locales'
import type { BlogTranslation } from '../../shared/types/blog-translations'
import { sanitizeRichText } from './rich-text'

const translationResponseSchema = z.object({
  translatedText: z.union([z.string(), z.array(z.string())]),
})

const providerErrorSchema = z.object({ error: z.string().trim().min(1).max(500) })

type LibreTranslateOptions = {
  url: string
  apiKey?: string
  timeoutMs: number
  sourceLocale: SupportedLocale
  targetLocale: SupportedLocale
  source: BlogTranslation
}

type TranslatableTextField = 'title' | 'excerpt' | 'seoTitle' | 'seoDescription'

export class LibreTranslateError extends Error {
  constructor(message: string, readonly statusCode = 502) {
    super(message)
    this.name = 'LibreTranslateError'
  }
}

function translationEndpoint(baseUrl: string) {
  const parsed = z.url().safeParse(baseUrl.trim())
  if (!parsed.success) throw new LibreTranslateError('LibreTranslate adresi yapılandırılmamış.', 503)
  const url = new URL(parsed.data)
  if (!['http:', 'https:'].includes(url.protocol)) throw new LibreTranslateError('LibreTranslate adresi güvenli değil.', 503)
  return new URL('translate', `${url.toString().replace(/\/+$/, '')}/`).toString()
}

function statusError(status: number, providerMessage?: string) {
  if (status === 401 || status === 403) return new LibreTranslateError('LibreTranslate API anahtarı kabul edilmedi.', 502)
  if (status === 429) return new LibreTranslateError('LibreTranslate kullanım sınırına ulaştı. Biraz sonra tekrar deneyin.', 429)
  if (status >= 400 && status < 500) return new LibreTranslateError(providerMessage || 'LibreTranslate çeviri isteğini kabul etmedi.', 422)
  return new LibreTranslateError('LibreTranslate şu anda yanıt veremiyor. Daha sonra tekrar deneyin.', 502)
}

async function requestTranslation(
  options: LibreTranslateOptions,
  q: string | string[],
  format: 'text' | 'html',
  fetcher: typeof fetch,
) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs)

  try {
    const response = await fetcher(translationEndpoint(options.url), {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        q,
        source: options.sourceLocale,
        target: options.targetLocale,
        format,
        ...(options.apiKey?.trim() ? { api_key: options.apiKey.trim() } : {}),
      }),
      signal: controller.signal,
    })
    const payload: unknown = await response.json().catch(() => null)
    if (!response.ok) {
      const providerError = providerErrorSchema.safeParse(payload)
      throw statusError(response.status, providerError.success ? providerError.data.error : undefined)
    }
    const parsed = translationResponseSchema.safeParse(payload)
    if (!parsed.success) throw new LibreTranslateError('LibreTranslate beklenmeyen bir yanıt verdi.')
    return typeof parsed.data.translatedText === 'string' ? [parsed.data.translatedText] : parsed.data.translatedText
  }
  catch (error) {
    if (error instanceof LibreTranslateError) throw error
    if (error instanceof Error && error.name === 'AbortError') throw new LibreTranslateError('LibreTranslate isteği zaman aşımına uğradı.', 504)
    throw new LibreTranslateError('LibreTranslate servisine ulaşılamadı.', 502)
  }
  finally {
    clearTimeout(timeout)
  }
}

export async function translateBlogDraft(options: LibreTranslateOptions, fetcher: typeof fetch = fetch): Promise<BlogTranslation> {
  const textFields: Array<{ key: TranslatableTextField, value: string }> = [
    { key: 'title', value: options.source.title },
    { key: 'excerpt', value: options.source.excerpt },
  ]
  if (options.source.seoTitle) textFields.push({ key: 'seoTitle', value: options.source.seoTitle })
  if (options.source.seoDescription) textFields.push({ key: 'seoDescription', value: options.source.seoDescription })

  const [translatedTexts, translatedContentResult] = await Promise.all([
    requestTranslation(options, textFields.map(field => field.value), 'text', fetcher),
    requestTranslation(options, options.source.content, 'html', fetcher),
  ])
  if (translatedTexts.length !== textFields.length || translatedContentResult.length !== 1) {
    throw new LibreTranslateError('LibreTranslate eksik çeviri döndürdü.')
  }

  const translated = new Map<TranslatableTextField, string>()
  textFields.forEach((field, index) => translated.set(field.key, translatedTexts[index]!.trim()))
  const title = translated.get('title') || options.source.title
  const content = sanitizeRichText(translatedContentResult[0]!)

  return {
    title,
    slug: slugify(title) || `${options.source.slug}-${options.targetLocale}`,
    excerpt: translated.get('excerpt') || options.source.excerpt,
    content,
    readingMinutes: readingTime(content),
    seoTitle: translated.get('seoTitle') || null,
    seoDescription: translated.get('seoDescription') || null,
    canonicalUrl: null,
  }
}
