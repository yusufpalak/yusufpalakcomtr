import { randomUUID } from 'node:crypto'
import { desc, eq, or } from 'drizzle-orm'
import sharp from 'sharp'
import { z } from 'zod'
import {
  blogPosts,
  certificates,
  educations,
  experiences,
  mediaFiles,
  projectImages,
  projects,
  siteSettings,
} from '../database/schema'
import { createMediaStorageKey, deleteMediaObject, getMediaObject, putMediaObject } from './media-storage'

const altTextSchema = z.string().trim().max(240)
const allowedImageFormats = new Set(['jpeg', 'png', 'webp', 'avif'])

export async function saveMediaFile(data: Uint8Array, filename: string, altText = '', options: { hero?: boolean } = {}) {
  const isPdf = !options.hero && filename.toLowerCase().endsWith('.pdf') && Buffer.from(data.subarray(0, 5)).toString('ascii') === '%PDF-'
  const limit = isPdf ? 12 * 1024 * 1024 : 8 * 1024 * 1024
  if (data.byteLength > limit) throw createError({ statusCode: 413, statusMessage: `Dosya en fazla ${isPdf ? 12 : 8} MB olabilir.` })
  if (!data.byteLength) throw createError({ statusCode: 422, statusMessage: 'Boş dosya yüklenemez.' })

  let output: Uint8Array = data
  let mimeType = 'application/pdf'
  let extension: 'pdf' | 'webp' = 'pdf'
  let width: number | null = null
  let height: number | null = null
  if (!isPdf) {
    try {
      const input = sharp(data, { failOn: 'error', limitInputPixels: 40_000_000 })
      const metadata = await input.metadata()
      if (!metadata.format || !allowedImageFormats.has(metadata.format)) throw new Error('Unsupported image format')
      const result = await input.rotate().resize({ width: options.hero ? 1600 : 2000, height: options.hero ? 2000 : 2000, fit: 'inside', withoutEnlargement: true }).webp({ quality: 86 }).toBuffer({ resolveWithObject: true })
      output = result.data
      mimeType = 'image/webp'
      extension = 'webp'
      width = result.info.width
      height = result.info.height
    }
    catch {
      throw createError({ statusCode: 422, statusMessage: 'Geçerli bir JPG, PNG, WebP, AVIF veya PDF dosyası yükleyin.' })
    }
  }

  const id = randomUUID()
  const storageKey = createMediaStorageKey(id, extension)
  await putMediaObject(storageKey, output, mimeType)
  try {
    const [media] = await useDb().insert(mediaFiles).values({
      id,
      storageKey,
      filename: filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180) || `media.${extension}`,
      mimeType,
      size: output.byteLength,
      altText: altTextSchema.parse(altText),
      width,
      height,
      usageCount: options.hero ? 1 : 0,
    }).returning()
    return media!
  }
  catch (error) {
    await deleteMediaObject(storageKey)
    throw error
  }
}

export async function listMediaFiles() {
  const rows = await useDb().select({
    id: mediaFiles.id,
    filename: mediaFiles.filename,
    mimeType: mediaFiles.mimeType,
    size: mediaFiles.size,
    altText: mediaFiles.altText,
    width: mediaFiles.width,
    height: mediaFiles.height,
    createdAt: mediaFiles.createdAt,
  }).from(mediaFiles).orderBy(desc(mediaFiles.createdAt))
  return rows.map(row => ({ ...row, url: `/api/public/media/${row.id}` }))
}

export async function removeMediaFile(id: string, checkReferences = true) {
  const mediaId = z.uuid().parse(id)
  const [media] = await useDb().select().from(mediaFiles).where(eq(mediaFiles.id, mediaId)).limit(1)
  if (!media) return false
  if (checkReferences) {
    const [heroSetting, projectUse, blogUse, certificateUse, experienceUse, educationUse, galleryUse] = await Promise.all([
      useDb().select({ value: siteSettings.value }).from(siteSettings).where(eq(siteSettings.key, 'homepage.heroImage')).limit(1),
      useDb().select({ id: projects.id }).from(projects).where(or(eq(projects.coverMediaId, mediaId), eq(projects.ogMediaId, mediaId))).limit(1),
      useDb().select({ id: blogPosts.id }).from(blogPosts).where(eq(blogPosts.coverMediaId, mediaId)).limit(1),
      useDb().select({ id: certificates.id }).from(certificates).where(or(eq(certificates.imageMediaId, mediaId), eq(certificates.pdfMediaId, mediaId))).limit(1),
      useDb().select({ id: experiences.id }).from(experiences).where(eq(experiences.logoMediaId, mediaId)).limit(1),
      useDb().select({ id: educations.id }).from(educations).where(eq(educations.logoMediaId, mediaId)).limit(1),
      useDb().select({ id: projectImages.id }).from(projectImages).where(eq(projectImages.mediaId, mediaId)).limit(1),
    ])
    const heroValue = heroSetting[0]?.value
    const isHero = heroValue && typeof heroValue === 'object' && !Array.isArray(heroValue) && (heroValue as Record<string, unknown>).mediaId === mediaId
    if (isHero || [projectUse, blogUse, certificateUse, experienceUse, educationUse, galleryUse].some(rows => rows.length)) {
      throw createError({ statusCode: 409, statusMessage: 'Dosya bir içerikte kullanılıyor. Önce ilgili içerikten kaldırın.' })
    }
  }
  await deleteMediaObject(media.storageKey)
  await useDb().delete(mediaFiles).where(eq(mediaFiles.id, mediaId))
  return true
}

export async function readPublicMedia(id: string) {
  const mediaId = z.uuid().parse(id)
  const [media] = await useDb().select({ storageKey: mediaFiles.storageKey, filename: mediaFiles.filename, mimeType: mediaFiles.mimeType }).from(mediaFiles).where(eq(mediaFiles.id, mediaId)).limit(1)
  if (!media) throw createError({ statusCode: 404, statusMessage: 'Dosya bulunamadı.' })
  try {
    return { media, data: await getMediaObject(media.storageKey) }
  }
  catch (error) {
    if (error && typeof error === 'object' && ('code' in error && error.code === 'ENOENT' || 'name' in error && error.name === 'NoSuchKey')) {
      throw createError({ statusCode: 404, statusMessage: 'Dosya bulunamadı.' })
    }
    throw error
  }
}
