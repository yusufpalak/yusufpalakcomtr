export default defineEventHandler(event=>{setHeader(event,'content-type','text/plain');return 'User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: /sitemap.xml\n'})
