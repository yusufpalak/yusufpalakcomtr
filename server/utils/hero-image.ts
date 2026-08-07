import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { resolve, sep } from 'node:path'
import { eq } from 'drizzle-orm'
import sharp from 'sharp'
import { z } from 'zod'
import { mediaFiles, siteSettings } from '../database/schema'

const HERO_KEY = 'homepage.heroImage'
const uploadRoot = () => resolve(process.cwd(), '.data', 'uploads')

function mediaIdFromValue(value: unknown) {
  const result = z.object({ mediaId: z.uuid() }).safeParse(value)
  return result.success ? result.data.mediaId : undefined
}

export async function getHeroImage() {
  const [setting] = await useDb().select().from(siteSettings).where(eq(siteSettings.key, HERO_KEY)).limit(1)
  const mediaId = mediaIdFromValue(setting?.value)
  if (!mediaId) return null
  const [media] = await useDb().select().from(mediaFiles).where(eq(mediaFiles.id, mediaId)).limit(1)
  if (!media) return null
  return { id: media.id, url: `/api/public/media/${media.id}`, width: media.width, height: media.height, altText: media.altText || 'Yusuf Palak portre görseli' }
}

export async function saveHeroImage(data: Uint8Array, filename: string, altText?: string) {
  if (data.byteLength > 8 * 1024 * 1024) throw createError({ statusCode: 413, statusMessage: 'Görsel en fazla 8 MB olabilir.' })

  let output: Buffer
  let info: sharp.OutputInfo
  try {
    const result = await sharp(data, { failOn: 'error', limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: 1600, height: 2000, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 86 })
      .toBuffer({ resolveWithObject: true })
    output = result.data
    info = result.info
  }
  catch {
    throw createError({ statusCode: 422, statusMessage: 'Geçerli bir JPG, PNG, WebP veya AVIF görseli yükleyin.' })
  }

  const previous = await getHeroImage()
  const id = randomUUID()
  const storageKey = `uploads/${id}.webp`
  const root = uploadRoot()
  await mkdir(root, { recursive: true })
  await writeFile(resolve(root, `${id}.webp`), output)

  const [media] = await useDb().insert(mediaFiles).values({
    id,
    storageKey,
    filename: filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180) || 'hero.webp',
    mimeType: 'image/webp',
    size: output.byteLength,
    altText: altText?.trim().slice(0, 240) || 'Yusuf Palak portre görseli',
    width: info.width,
    height: info.height,
    usageCount: 1,
  }).returning()

  await useDb().insert(siteSettings).values({ key: HERO_KEY, value: { mediaId: media!.id } }).onConflictDoUpdate({ target: siteSettings.key, set: { value: { mediaId: media!.id }, updatedAt: new Date() } })
  if (previous?.id) await removeMedia(previous.id)
  return getHeroImage()
}

export async function removeMedia(id: string) {
  const [media] = await useDb().select().from(mediaFiles).where(eq(mediaFiles.id, id)).limit(1)
  if (!media) return
  const root = uploadRoot()
  const target = resolve(process.cwd(), '.data', media.storageKey)
  if (target.startsWith(`${root}${sep}`) && /^uploads\/[0-9a-f-]+\.webp$/i.test(media.storageKey)) await rm(target, { force: true })
  await useDb().delete(mediaFiles).where(eq(mediaFiles.id, id))
}

export async function deleteHeroImage() {
  const current = await getHeroImage()
  await useDb().delete(siteSettings).where(eq(siteSettings.key, HERO_KEY))
  if (current?.id) await removeMedia(current.id)
  return Boolean(current)
}

export async function streamMedia(event: Parameters<typeof setHeader>[0], id: string) {
  const mediaId = z.uuid().parse(id)
  const [media] = await useDb().select().from(mediaFiles).where(eq(mediaFiles.id, mediaId)).limit(1)
  if (!media || !/^uploads\/[0-9a-f-]+\.webp$/i.test(media.storageKey)) throw createError({ statusCode: 404, statusMessage: 'Görsel bulunamadı.' })
  const root = uploadRoot()
  const target = resolve(process.cwd(), '.data', media.storageKey)
  if (!target.startsWith(`${root}${sep}`)) throw createError({ statusCode: 404, statusMessage: 'Görsel bulunamadı.' })
  setHeader(event, 'Content-Type', media.mimeType)
  setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  return readFile(target)
}
