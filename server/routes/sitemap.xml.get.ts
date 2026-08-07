const escapeXml = (value: string) => value.replace(/[<>&'"]/g, character => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[character]!)

export default defineEventHandler(async (event) => {
  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  const base = String(useRuntimeConfig().public.siteUrl).replace(/\/$/, '')
  const [turkishContent, englishContent] = await Promise.all([getPublicSiteContent('tr'), getPublicSiteContent('en')])
  const staticPaths = [
    '', 'about', 'portfolio', 'blog', 'certificates', 'contact', 'privacy', 'cookies', 'terms',
  ]
  const paths = [
    ...staticPaths,
    ...turkishContent.projects.map(project => `portfolio/${project.slug}`),
    ...turkishContent.posts.map(post => `blog/${post.slug}`),
    ...staticPaths.map(path => path ? `en/${path}` : 'en'),
    ...englishContent.projects.map(project => `en/portfolio/${project.slug}`),
    ...englishContent.posts.map(post => `en/blog/${post.slug}`),
  ]
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path => `<url><loc>${escapeXml(`${base}/${path}`)}</loc></url>`).join('')}</urlset>`
})
