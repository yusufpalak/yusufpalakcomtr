const escapeRss = (value: string) => value.replace(/[<>&'"]/g, character => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[character]!)

export default defineEventHandler(async (event) => {
  setHeader(event, 'content-type', 'application/rss+xml; charset=utf-8')
  const base = String(useRuntimeConfig().public.siteUrl).replace(/\/$/, '')
  const content = await getPublicSiteContent()
  const items = content.posts.slice(0, 20).map(post => `<item><title>${escapeRss(post.title)}</title><link>${escapeRss(`${base}/blog/${post.slug}`)}</link><guid>${escapeRss(`${base}/blog/${post.slug}`)}</guid><pubDate>${new Date(post.date).toUTCString()}</pubDate><description>${escapeRss(post.excerpt)}</description></item>`).join('')
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Yusuf Palak Blog</title><link>${escapeRss(`${base}/blog`)}</link><description>Yazılım geliştirme notları</description>${items}</channel></rss>`
})
