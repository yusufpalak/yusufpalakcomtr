import { asc, eq } from 'drizzle-orm'
import { socialLinks } from '../../database/schema'

export default defineEventHandler(async () => {
  const links = await useDb()
    .select({
      id: socialLinks.id,
      label: socialLinks.label,
      platform: socialLinks.platform,
      url: socialLinks.url,
      username: socialLinks.username,
      iconOverride: socialLinks.iconOverride,
      description: socialLinks.description,
      showHome: socialLinks.showHome,
      showContact: socialLinks.showContact,
      showFooter: socialLinks.showFooter,
    })
    .from(socialLinks)
    .where(eq(socialLinks.isActive, true))
    .orderBy(asc(socialLinks.sortOrder), asc(socialLinks.createdAt))

  return ok(links)
})
