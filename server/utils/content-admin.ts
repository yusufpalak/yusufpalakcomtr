import { and, asc, desc, eq, getTableColumns, inArray, isNull, like, notLike, sql, type SQL } from 'drizzle-orm'
import type { AnyPgColumn, AnyPgTable } from 'drizzle-orm/pg-core'
import { z } from 'zod'
import { blogLocalizedFields, getAdminContentForm, type AdminContentField } from '../../shared/admin-content'
import { defaultLocale, supportedLocaleCodes, type SupportedLocale } from '../../shared/i18n/locales'
import { blogTranslationSchema, blogTranslationsSchema, siteProfileSchema } from '../../shared/schemas'
import type { AdminBlogTranslation, AdminBlogTranslations, BlogTranslation, BlogTranslations } from '../../shared/types/blog-translations'
import { sanitizeRichText } from './rich-text'
import {
  blogCategories,
  blogPostTags,
  blogPosts,
  blogTags,
  certificates,
  educations,
  experiences,
  homepageSections,
  mediaFiles,
  projectCategories,
  projectTechnologies,
  projects,
  siteSettings,
  skillCategories,
  skills,
  stats,
  technologies,
} from '../database/schema'

type ContentAdapter = {
  table: AnyPgTable
  titleField: string
  subtitleField?: string
  statusField?: string
  activeField?: string
  sortField?: string
  where: SQL
  publicPath?: string
}

const blogTranslationDraftsSchema = z.partialRecord(
  z.enum(supportedLocaleCodes),
  z.object({ enabled: z.boolean() }).passthrough(),
)

function emptyAdminBlogTranslation(enabled = false): AdminBlogTranslation {
  return {
    enabled,
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    readingMinutes: 1,
    seoTitle: null,
    seoDescription: null,
    canonicalUrl: null,
  }
}

function storedBlogTranslations(value: unknown): BlogTranslations {
  const parsed = blogTranslationsSchema.safeParse(value)
  return parsed.success ? parsed.data : {}
}

function adminBlogTranslations(row: Record<string, unknown>): AdminBlogTranslations {
  const stored = storedBlogTranslations(row.translations)
  const translations = Object.fromEntries(supportedLocaleCodes.map(locale => [locale, emptyAdminBlogTranslation(locale === defaultLocale)])) as AdminBlogTranslations
  translations[defaultLocale] = {
    enabled: true,
    title: String(row.title || ''),
    slug: String(row.slug || ''),
    excerpt: String(row.excerpt || ''),
    content: String(row.content || ''),
    readingMinutes: typeof row.readingMinutes === 'number' ? row.readingMinutes : 1,
    seoTitle: typeof row.seoTitle === 'string' ? row.seoTitle : null,
    seoDescription: typeof row.seoDescription === 'string' ? row.seoDescription : null,
    canonicalUrl: typeof row.canonicalUrl === 'string' ? row.canonicalUrl : null,
  }
  for (const locale of supportedLocaleCodes) {
    if (locale === defaultLocale || !stored[locale]) continue
    translations[locale] = { enabled: true, ...stored[locale] }
  }
  return translations
}

export type AdminContentRecord = {
  id: string
  title: string
  subtitle: string
  status: string
  updatedAt: string
  data: Record<string, unknown>
  publicUrl?: string
}

const adapters: Record<string, ContentAdapter> = {
  'site-settings': { table: siteSettings, titleField: 'key', subtitleField: 'key', where: sql`true` },
  homepage: { table: homepageSections, titleField: 'title', subtitleField: 'key', activeField: 'isActive', sortField: 'sortOrder', where: notLike(homepageSections.key, 'about:%') },
  about: { table: homepageSections, titleField: 'title', subtitleField: 'key', activeField: 'isActive', sortField: 'sortOrder', where: like(homepageSections.key, 'about:%') },
  stats: { table: stats, titleField: 'label', subtitleField: 'key', sortField: 'sortOrder', where: sql`true` },
  skills: { table: skills, titleField: 'name', subtitleField: 'level', activeField: 'isActive', sortField: 'sortOrder', where: sql`true` },
  'skill-categories': { table: skillCategories, titleField: 'name', subtitleField: 'slug', sortField: 'sortOrder', where: sql`true` },
  experiences: { table: experiences, titleField: 'position', subtitleField: 'company', activeField: 'isActive', sortField: 'sortOrder', where: isNull(experiences.deletedAt) },
  educations: { table: educations, titleField: 'school', subtitleField: 'department', activeField: 'isActive', sortField: 'sortOrder', where: sql`true` },
  projects: { table: projects, titleField: 'title', subtitleField: 'summary', statusField: 'status', sortField: 'sortOrder', where: isNull(projects.deletedAt), publicPath: '/portfolio/' },
  'project-categories': { table: projectCategories, titleField: 'name', subtitleField: 'slug', where: sql`true` },
  technologies: { table: technologies, titleField: 'name', subtitleField: 'slug', where: sql`true` },
  'blog-posts': { table: blogPosts, titleField: 'title', subtitleField: 'excerpt', statusField: 'status', where: isNull(blogPosts.deletedAt), publicPath: '/blog/' },
  'blog-categories': { table: blogCategories, titleField: 'name', subtitleField: 'slug', where: sql`true` },
  'blog-tags': { table: blogTags, titleField: 'name', subtitleField: 'slug', where: sql`true` },
  certificates: { table: certificates, titleField: 'name', subtitleField: 'issuer', activeField: 'isActive', sortField: 'sortOrder', where: sql`true` },
}

export function getContentAdapter(module: string) {
  const adapter = adapters[module]
  const form = getAdminContentForm(module)
  if (!adapter || !form) throw createError({ statusCode: 404, statusMessage: 'İçerik modülü bulunamadı.' })
  return { adapter, form }
}

function column(adapter: ContentAdapter, key: string) {
  const value = (getTableColumns(adapter.table) as Record<string, AnyPgColumn>)[key]
  if (!value) throw createError({ statusCode: 500, statusMessage: 'İçerik alanı yapılandırılamadı.' })
  return value
}

function displayStatus(row: Record<string, unknown>, adapter: ContentAdapter) {
  if (adapter.statusField) {
    const labels: Record<string, string> = { draft: 'Taslak', published: 'Yayında', scheduled: 'Zamanlanmış', archived: 'Arşiv' }
    const value = String(row[adapter.statusField] || 'draft')
    return labels[value] || value
  }
  if (adapter.activeField) return row[adapter.activeField] === false ? 'Pasif' : 'Aktif'
  return 'Kayıtlı'
}

function serializeRecord(module: string, row: Record<string, unknown>, adapter: ContentAdapter, fields: AdminContentField[]): AdminContentRecord {
  const data: Record<string, unknown> = {}
  for (const field of fields) {
    let value = row[field.key]
    if (module === 'about' && field.key === 'key' && typeof value === 'string') value = value.replace(/^about:/, '')
    if (value instanceof Date) value = value.toISOString()
    data[field.key] = value
  }
  if (module === 'blog-posts') data.translations = adminBlogTranslations(row)
  const title = String(row[adapter.titleField] || row.key || 'İsimsiz kayıt')
  const slug = typeof row.slug === 'string' ? row.slug : undefined
  return {
    id: String(row.id),
    title,
    subtitle: String((adapter.subtitleField && row[adapter.subtitleField]) || ''),
    status: displayStatus(row, adapter),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : new Date().toISOString(),
    data,
    publicUrl: adapter.publicPath && slug ? `${adapter.publicPath}${slug}` : undefined,
  }
}

async function hydrateRelationValues(module: string, records: AdminContentRecord[]) {
  if (!records.length) return records
  const ids = records.map(record => record.id)
  if (module === 'projects') {
    const rows = await useDb().select().from(projectTechnologies).where(inArray(projectTechnologies.projectId, ids))
    for (const record of records) record.data.technologyIds = rows.filter(row => row.projectId === record.id).map(row => row.technologyId)
  }
  if (module === 'blog-posts') {
    const rows = await useDb().select().from(blogPostTags).where(inArray(blogPostTags.postId, ids))
    for (const record of records) record.data.tagIds = rows.filter(row => row.postId === record.id).map(row => row.tagId)
  }
  return records
}

function normalizeText(field: AdminContentField, value: unknown) {
  const textValue = typeof value === 'string' ? value.trim() : ''
  if (field.required && !textValue) throw new z.ZodError([{ code: 'custom', path: [field.key], message: `${field.label} zorunludur.` }])
  if (!textValue) return null
  if (field.type === 'slug' && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(textValue)) throw new z.ZodError([{ code: 'custom', path: [field.key], message: 'Slug yalnızca küçük harf, rakam ve tire içerebilir.' }])
  if (field.type === 'url') {
    const parsed = z.url().safeParse(textValue)
    if (!parsed.success || !['http:', 'https:'].includes(new URL(textValue).protocol)) throw new z.ZodError([{ code: 'custom', path: [field.key], message: 'Geçerli bir http veya https adresi yazın.' }])
  }
  return textValue
}

export function normalizeContentInput(module: string, body: unknown) {
  const { form } = getContentAdapter(module)
  const source = z.record(z.string(), z.unknown()).parse(body)
  const values: Record<string, unknown> = {}

  for (const field of form.fields) {
    const raw = source[field.key] ?? field.default
    if (field.type === 'relation-multiple') {
      const rawValues = Array.isArray(raw) ? raw : []
      values[field.key] = [...new Set(rawValues.map(value => z.uuid().parse(value)))]
      continue
    }
    if (field.type === 'relation' || field.type === 'media') {
      const textValue = normalizeText(field, raw)
      values[field.key] = textValue === null ? null : z.uuid().parse(textValue)
      continue
    }
    if (field.type === 'checkbox') {
      values[field.key] = typeof raw === 'boolean' ? raw : Boolean(field.default)
      continue
    }
    if (field.type === 'number') {
      if (raw === '' || raw === null || raw === undefined) {
        values[field.key] = field.required ? (field.default ?? 0) : null
        continue
      }
      const numeric = z.coerce.number().int().min(field.min ?? -2147483648).max(field.max ?? 2147483647).parse(raw)
      values[field.key] = numeric
      continue
    }
    if (field.type === 'date' || field.type === 'datetime') {
      values[field.key] = raw ? z.coerce.date().parse(raw) : null
      continue
    }
    if (field.type === 'json') {
      const textValue = normalizeText(field, raw)
      if (textValue === null) values[field.key] = null
      else {
        try { values[field.key] = JSON.parse(textValue) }
        catch { values[field.key] = textValue }
      }
      continue
    }
    const textValue = normalizeText(field, raw)
    if (field.type === 'select' && textValue !== null && field.options?.length && !field.options.some(option => option.value === textValue)) throw new z.ZodError([{ code: 'custom', path: [field.key], message: 'Geçersiz seçim.' }])
    values[field.key] = textValue
  }

  if (module === 'about' && typeof values.key === 'string') values.key = `about:${values.key.replace(/^about:/, '')}`
  if (module === 'site-settings' && values.key === 'profile') values.value = siteProfileSchema.parse(values.value)
  if (module === 'blog-posts') {
    const baseTranslation = blogTranslationSchema.parse(source)
    for (const field of blogLocalizedFields) values[field.key] = baseTranslation[field.key as keyof BlogTranslation]
    values.content = sanitizeRichText(baseTranslation.content)

    const drafts = blogTranslationDraftsSchema.parse(source.translations ?? {})
    const translations: BlogTranslations = {}
    for (const locale of supportedLocaleCodes) {
      if (locale === defaultLocale || drafts[locale]?.enabled !== true) continue
      const translation = blogTranslationSchema.parse(drafts[locale])
      translations[locale] = { ...translation, content: sanitizeRichText(translation.content) }
    }
    values.translations = translations
  }
  return values
}

async function assertLocalizedBlogSlugsAvailable(translations: BlogTranslations, excludeId?: string) {
  const localizedEntries = Object.entries(translations) as Array<[SupportedLocale, BlogTranslation]>
  if (!localizedEntries.length) return

  const rows = await useDb().select({ id: blogPosts.id, translations: blogPosts.translations }).from(blogPosts).where(isNull(blogPosts.deletedAt))
  for (const row of rows) {
    if (row.id === excludeId) continue
    const existing = storedBlogTranslations(row.translations)
    for (const [locale, translation] of localizedEntries) {
      if (existing[locale]?.slug === translation.slug) {
        throw createError({ statusCode: 409, statusMessage: `${locale.toLocaleUpperCase()} dilinde “${translation.slug}” slug değeri daha önce kullanılmış.` })
      }
    }
  }
}

export async function listAdminContent(module: string) {
  const { adapter, form } = getContentAdapter(module)
  const orderColumn = adapter.sortField ? column(adapter, adapter.sortField) : column(adapter, 'updatedAt')
  const rows = await useDb().select().from(adapter.table).where(adapter.where).orderBy(adapter.sortField ? asc(orderColumn) : desc(orderColumn))
  const records = (rows as unknown as Record<string, unknown>[]).map(row => serializeRecord(module, row, adapter, form.fields))
  return hydrateRelationValues(module, records)
}

export async function getAdminContentRecord(module: string, id: string) {
  const { adapter, form } = getContentAdapter(module)
  const idValue = z.uuid().parse(id)
  const [row] = await useDb().select().from(adapter.table).where(and(adapter.where, eq(column(adapter, 'id'), idValue))).limit(1)
  if (!row) return undefined
  const [record] = await hydrateRelationValues(module, [serializeRecord(module, row as unknown as Record<string, unknown>, adapter, form.fields)])
  return record
}

function extractManyRelations(module: string, values: Record<string, unknown>) {
  const relations: Record<string, string[]> = {}
  if (module === 'projects') {
    relations.technologyIds = Array.isArray(values.technologyIds) ? values.technologyIds as string[] : []
    delete values.technologyIds
  }
  if (module === 'blog-posts') {
    relations.tagIds = Array.isArray(values.tagIds) ? values.tagIds as string[] : []
    delete values.tagIds
  }
  return relations
}

async function syncManyRelations(module: string, id: string, relations: Record<string, string[]>) {
  const db = useDb()
  if (module === 'projects') {
    await db.delete(projectTechnologies).where(eq(projectTechnologies.projectId, id))
    if (relations.technologyIds?.length) await db.insert(projectTechnologies).values(relations.technologyIds.map(technologyId => ({ projectId: id, technologyId })))
  }
  if (module === 'blog-posts') {
    await db.delete(blogPostTags).where(eq(blogPostTags.postId, id))
    if (relations.tagIds?.length) await db.insert(blogPostTags).values(relations.tagIds.map(tagId => ({ postId: id, tagId })))
  }
}

async function assertMediaReferencesExist(module: string, values: Record<string, unknown>) {
  const { form } = getContentAdapter(module)
  const fields = form.fields.filter(field => field.type === 'media' && typeof values[field.key] === 'string')
  if (!fields.length) return
  const ids = fields.map(field => values[field.key] as string)
  const rows = await useDb().select({ id: mediaFiles.id, mimeType: mediaFiles.mimeType }).from(mediaFiles).where(inArray(mediaFiles.id, ids))
  const byId = new Map(rows.map(row => [row.id, row.mimeType]))
  for (const field of fields) {
    const mimeType = byId.get(values[field.key] as string)
    if (!mimeType || field.mediaKind === 'pdf' && mimeType !== 'application/pdf' || field.mediaKind === 'image' && !mimeType.startsWith('image/')) {
      throw new z.ZodError([{ code: 'custom', path: [field.key], message: `${field.label} için geçerli bir dosya seçin.` }])
    }
  }
}

export async function createAdminContentRecord(module: string, body: unknown) {
  const { adapter } = getContentAdapter(module)
  const values = normalizeContentInput(module, body)
  await assertMediaReferencesExist(module, values)
  if (module === 'blog-posts') await assertLocalizedBlogSlugsAvailable(storedBlogTranslations(values.translations))
  const relations = extractManyRelations(module, values)
  const [row] = await useDb().insert(adapter.table).values(values).returning()
  const id = String((row as unknown as Record<string, unknown>).id)
  await syncManyRelations(module, id, relations)
  return getAdminContentRecord(module, id)
}

export async function updateAdminContentRecord(module: string, id: string, body: unknown) {
  const { adapter } = getContentAdapter(module)
  const idValue = z.uuid().parse(id)
  const normalized = normalizeContentInput(module, body)
  await assertMediaReferencesExist(module, normalized)
  if (module === 'blog-posts') await assertLocalizedBlogSlugsAvailable(storedBlogTranslations(normalized.translations), idValue)
  const relations = extractManyRelations(module, normalized)
  const values = { ...normalized, updatedAt: new Date() }
  const [row] = await useDb().update(adapter.table).set(values).where(and(adapter.where, eq(column(adapter, 'id'), idValue))).returning()
  if (!row) return undefined
  await syncManyRelations(module, idValue, relations)
  return getAdminContentRecord(module, idValue)
}

export async function getContentRelationOptions(module: string) {
  const { form } = getContentAdapter(module)
  const db = useDb()
  const mediaFields = form.fields.filter(field => field.type === 'media')
  const mediaOptions: Record<string, Array<{ label: string, value: string }>> = {}
  if (mediaFields.length) {
    const mediaRows = await db.select({ id: mediaFiles.id, filename: mediaFiles.filename, mimeType: mediaFiles.mimeType }).from(mediaFiles).orderBy(desc(mediaFiles.createdAt))
    for (const field of mediaFields) mediaOptions[field.key] = mediaRows.filter(row => field.mediaKind === 'pdf' ? row.mimeType === 'application/pdf' : row.mimeType.startsWith('image/')).map(row => ({ label: row.filename, value: row.id }))
  }
  if (module === 'skills') {
    const rows = await db.select({ label: skillCategories.name, value: skillCategories.id }).from(skillCategories).orderBy(asc(skillCategories.sortOrder), asc(skillCategories.name))
    return { categoryId: rows, ...mediaOptions }
  }
  if (module === 'projects') {
    const [categories, technologyOptions] = await Promise.all([
      db.select({ label: projectCategories.name, value: projectCategories.id }).from(projectCategories).orderBy(asc(projectCategories.name)),
      db.select({ label: technologies.name, value: technologies.id }).from(technologies).orderBy(asc(technologies.name)),
    ])
    return { categoryId: categories, technologyIds: technologyOptions, ...mediaOptions }
  }
  if (module === 'blog-posts') {
    const [categories, tagOptions] = await Promise.all([
      db.select({ label: blogCategories.name, value: blogCategories.id }).from(blogCategories).orderBy(asc(blogCategories.name)),
      db.select({ label: blogTags.name, value: blogTags.id }).from(blogTags).orderBy(asc(blogTags.name)),
    ])
    return { categoryId: categories, tagIds: tagOptions, ...mediaOptions }
  }
  return mediaOptions
}

export async function deleteAdminContentRecord(module: string, id: string) {
  const { adapter } = getContentAdapter(module)
  const idValue = z.uuid().parse(id)
  const [row] = await useDb().delete(adapter.table).where(and(adapter.where, eq(column(adapter, 'id'), idValue))).returning({ id: column(adapter, 'id') })
  return row ? idValue : undefined
}

export function contentDatabaseError(error: unknown): never {
  if (error && typeof error === 'object' && 'code' in error && error.code === '23505') throw createError({ statusCode: 409, statusMessage: 'Bu anahtar veya slug daha önce kullanılmış.' })
  if (error && typeof error === 'object' && 'code' in error && error.code === '23503') throw createError({ statusCode: 409, statusMessage: 'Bu kayıt başka içeriklerde kullanıldığı için silinemez.' })
  validationError(error)
}
