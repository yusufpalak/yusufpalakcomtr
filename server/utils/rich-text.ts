import sanitizeHtml from 'sanitize-html'
import { slugify } from '../../shared/utils/content'

export function sanitizeRichText(source: string) {
  const text = source.trim()
  const normalized = /<(?:h[1-6]|p|ul|ol|blockquote|pre)\b/i.test(text)
    ? text
    : text.split(/\n{2,}/).map(paragraph => `<p>${sanitizeHtml(paragraph, { allowedTags: [], allowedAttributes: {} })}</p>`).join('')

  return sanitizeHtml(normalized, {
    allowedTags: ['h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'blockquote', 'code', 'pre', 'a', 'br'],
    allowedAttributes: { a: ['href', 'title', 'target', 'rel'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: 'a',
        attribs: { ...attribs, rel: 'noopener noreferrer', ...(attribs.target === '_blank' ? { target: '_blank' } : {}) },
      }),
    },
  })
}

export function richTextWithHeadings(source: string) {
  const headings: Array<{ id: string, text: string }> = []
  const contentHtml = sanitizeRichText(source).replace(/<h([23])>([\s\S]*?)<\/h\1>/gi, (_match, level: string, inner: string) => {
    const text = sanitizeHtml(inner, { allowedTags: [], allowedAttributes: {} }).trim()
    const base = slugify(text) || 'section'
    let id = base
    let suffix = 2
    while (headings.some(item => item.id === id)) id = `${base}-${suffix++}`
    headings.push({ id, text })
    return `<h${level} id="${id}">${inner}</h${level}>`
  })
  return { contentHtml, headings }
}
