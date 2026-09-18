import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { mediaFiles, siteSettings } from '../database/schema'
import { readPublicMedia, removeMediaFile, saveMediaFile } from './media-files'

const HERO_KEY = 'homepage.heroImage'

function mediaIdFromValue(value: unknown) {
  const result = z.object({ mediaId: z.uuid() }).safeParse(value)
  return result.success ? result.data.mediaId : undefined
}

export async function getHeroImage() {
  const [setting] = await useDb().select({ value: siteSettings.value }).from(siteSettings).where(eq(siteSettings.key, HERO_KEY)).limit(1)
  const mediaId = mediaIdFromValue(setting?.value)
  if (!mediaId) return null
  const [media] = await useDb().select({ id: mediaFiles.id, width: mediaFiles.width, height: mediaFiles.height, altText: mediaFiles.altText, mimeType: mediaFiles.mimeType }).from(mediaFiles).where(eq(mediaFiles.id, mediaId)).limit(1)
  if (!media || media.mimeType !== 'image/webp') return null
  return { id: media.id, url: `/api/public/media/${media.id}`, width: media.width, height: media.height, altText: media.altText || 'Yusuf Palak portre görseli' }
}

export async function saveHeroImage(data: Uint8Array, filename: string, altText?: string) {
  const media = await saveMediaFile(data, filename, altText || 'Yusuf Palak portre görseli', { hero: true })
  try {
    await useDb().insert(siteSettings).values({ key: HERO_KEY, value: { mediaId: media.id } }).onConflictDoUpdate({ target: siteSettings.key, set: { value: { mediaId: media.id }, updatedAt: new Date() } })
  }
  catch (error) {
    await removeMediaFile(media.id, false)
    throw error
  }
  // Eski dosya medya kütüphanesinde kalır; başka içeriklerde kullanılıyorsa kaybolmaz.
  return getHeroImage()
}

export async function deleteHeroImage() {
  const current = await getHeroImage()
  await useDb().delete(siteSettings).where(eq(siteSettings.key, HERO_KEY))
  // Görseli yalnızca ana sayfadan ayır; dosya ayrıca medya kütüphanesinden silinebilir.
  return Boolean(current)
}

export async function streamMedia(event: Parameters<typeof setHeader>[0], id: string) {
  const { media, data } = await readPublicMedia(id)
  setHeader(event, 'Content-Type', media.mimeType)
  setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  if (media.mimeType === 'application/pdf') setHeader(event, 'Content-Disposition', `attachment; filename="${media.filename.replace(/[^a-zA-Z0-9._-]/g, '_')}"`)
  return data
}
