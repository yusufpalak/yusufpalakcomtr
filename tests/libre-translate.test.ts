import { describe, expect, it } from 'vitest'
import { translateBlogDraft } from '../server/utils/libre-translate'

describe('LibreTranslate blog drafts', () => {
  it('translates text and HTML fields and derives localized metadata', async () => {
    const requests: Array<{ format: string, q: string | string[], api_key?: string }> = []
    const fetcher = (async (_input: string | URL | Request, init?: RequestInit) => {
      const payload = JSON.parse(String(init?.body)) as { format: string, q: string | string[], api_key?: string }
      requests.push(payload)
      const translatedText = payload.format === 'html'
        ? '<h2>Safe heading</h2><p>Translated content<script>alert(1)</script></p>'
        : ['A Multilingual Blog', 'This is the translated summary.', 'Localized SEO title', 'Localized SEO description']
      return new Response(JSON.stringify({ translatedText }), { status: 200, headers: { 'content-type': 'application/json' } })
    }) as typeof fetch

    const result = await translateBlogDraft({
      url: 'https://translate.example.test',
      apiKey: 'secret-key',
      timeoutMs: 5000,
      sourceLocale: 'tr',
      targetLocale: 'en',
      source: {
        title: 'Çok Dilli Blog',
        slug: 'cok-dilli-blog',
        excerpt: 'Bu yazı çeviri özelliğini ayrıntılı olarak anlatır.',
        content: '<h2>Güvenli başlık</h2><p>Çevrilecek içerik</p>',
        readingMinutes: 2,
        seoTitle: 'Yerelleştirilmiş SEO başlığı',
        seoDescription: 'Yerelleştirilmiş SEO açıklaması',
        canonicalUrl: null,
      },
    }, fetcher)

    expect(result).toMatchObject({
      title: 'A Multilingual Blog',
      slug: 'a-multilingual-blog',
      excerpt: 'This is the translated summary.',
      readingMinutes: 1,
      seoTitle: 'Localized SEO title',
      seoDescription: 'Localized SEO description',
      canonicalUrl: null,
    })
    expect(result.content).toContain('<h2>Safe heading</h2>')
    expect(result.content).not.toContain('<script>')
    expect(requests).toHaveLength(2)
    expect(requests.some(request => request.format === 'html')).toBe(true)
    expect(requests.every(request => request.api_key === 'secret-key')).toBe(true)
  })
})
