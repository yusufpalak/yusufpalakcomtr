import { and, asc, desc, eq, inArray, isNull, lte, or } from 'drizzle-orm'
import { blogTranslationsSchema } from '../../shared/schemas'
import { defaultLocale, type SupportedLocale } from '../../shared/i18n/locales'
import type { BlogTranslation, BlogTranslations } from '../../shared/types/blog-translations'
import { richTextWithHeadings, sanitizeRichText } from './rich-text'
import type {
  PublicBlogPost,
  PublicBlogPostDetail,
  PublicCertificate,
  PublicEducation,
  PublicExperience,
  PublicProfile,
  PublicProject,
  PublicProjectDetail,
  PublicSection,
  PublicSiteContent,
  PublicSkill,
  PublicStat,
} from '../../shared/types/public-content'
import {
  blogCategories,
  blogPosts,
  blogPostTags,
  blogTags,
  certificates,
  educations,
  experiences,
  homepageSections,
  mediaFiles,
  projectCategories,
  projectImages,
  projects,
  projectTechnologies,
  siteSettings,
  skillCategories,
  skills,
  stats,
  technologies,
} from '../database/schema'

const DEFAULT_PROFILE: PublicProfile = {
  name: 'Yusuf Palak',
  title: 'Full-Stack Developer',
  focus: ['Web geliştirme', 'Backend sistemleri', 'Veritabanı', 'DevOps'],
}

const levelLabels: Record<string, string> = {
  beginner: 'Başlangıç',
  intermediate: 'Orta',
  advanced: 'İleri',
  expert: 'Uzman',
}

const iso = (value: Date | null) => value ? value.toISOString() : null

function storedBlogTranslations(value: unknown): BlogTranslations {
  const parsed = blogTranslationsSchema.safeParse(value)
  return parsed.success ? parsed.data : {}
}

function profileFromSetting(value: unknown): PublicProfile {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return DEFAULT_PROFILE
  const source = value as Record<string, unknown>
  const focus = Array.isArray(source.focus) ? source.focus.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())).map(item => item.trim()).slice(0, 12) : DEFAULT_PROFILE.focus
  return {
    name: typeof source.name === 'string' && source.name.trim() ? source.name.trim() : DEFAULT_PROFILE.name,
    title: typeof source.title === 'string' && source.title.trim() ? source.title.trim() : DEFAULT_PROFILE.title,
    focus,
  }
}

function sectionFromRow(row: typeof homepageSections.$inferSelect): PublicSection {
  return {
    id: row.id,
    key: row.key.replace(/^about:/, ''),
    title: row.title,
    content: row.content,
    sortOrder: row.sortOrder,
  }
}

function mediaUrl(row: { id: string, storageKey: string } | undefined) {
  if (!row || !/^(?:s3\/(?:yusufpalakcomtr\/)?)?uploads\/[0-9a-f-]{36}\.webp$/i.test(row.storageKey)) return null
  return `/api/public/media/${row.id}`
}

function mediaPdfUrl(row: { id: string, storageKey: string } | undefined) {
  if (!row || !/^(?:s3\/(?:yusufpalakcomtr\/)?)?uploads\/[0-9a-f-]{36}\.pdf$/i.test(row.storageKey)) return null
  return `/api/public/media/${row.id}`
}

function experienceYears(rows: Array<{ startDate: Date | null }>) {
  const timestamps = rows.flatMap(row => row.startDate ? [row.startDate.getTime()] : [])
  if (!timestamps.length) return null
  return Math.max(0, Math.floor((Date.now() - Math.min(...timestamps)) / (365.25 * 24 * 60 * 60 * 1000)))
}

export async function getPublicSiteContent(locale: SupportedLocale = defaultLocale): Promise<PublicSiteContent> {
  const db = useDb()
  const now = new Date()
  const publicPost = or(eq(blogPosts.status, 'published'), and(eq(blogPosts.status, 'scheduled'), lte(blogPosts.publishedAt, now)))

  const [profileRows, sectionRows, statRows, skillRows, experienceRows, educationRows, projectRows, postRows, certificateRows, hero] = await Promise.all([
    db.select({ value: siteSettings.value }).from(siteSettings).where(eq(siteSettings.key, 'profile')).limit(1),
    db.select().from(homepageSections).where(eq(homepageSections.isActive, true)).orderBy(asc(homepageSections.sortOrder), asc(homepageSections.createdAt)),
    db.select().from(stats).orderBy(asc(stats.sortOrder), asc(stats.createdAt)),
    db.select({
      id: skills.id,
      name: skills.name,
      level: skills.level,
      years: skills.years,
      description: skills.description,
      icon: skills.icon,
      category: skillCategories.name,
      categorySlug: skillCategories.slug,
    }).from(skills).leftJoin(skillCategories, eq(skills.categoryId, skillCategories.id)).where(eq(skills.isActive, true)).orderBy(asc(skills.sortOrder), asc(skills.name)),
    db.select().from(experiences).where(and(eq(experiences.isActive, true), isNull(experiences.deletedAt))).orderBy(asc(experiences.sortOrder), desc(experiences.startDate)),
    db.select().from(educations).where(eq(educations.isActive, true)).orderBy(asc(educations.sortOrder), desc(educations.startDate)),
    db.select({
      id: projects.id,
      slug: projects.slug,
      title: projects.title,
      summary: projects.summary,
      content: projects.content,
      featured: projects.isFeatured,
      coverMediaId: projects.coverMediaId,
      liveUrl: projects.liveUrl,
      repoUrl: projects.repoUrl,
      clientName: projects.clientName,
      role: projects.role,
      startDate: projects.startDate,
      endDate: projects.endDate,
      isCurrent: projects.isCurrent,
      seoTitle: projects.seoTitle,
      seoDescription: projects.seoDescription,
      category: projectCategories.name,
      categorySlug: projectCategories.slug,
    }).from(projects).leftJoin(projectCategories, eq(projects.categoryId, projectCategories.id)).where(and(eq(projects.status, 'published'), isNull(projects.deletedAt))).orderBy(asc(projects.sortOrder), desc(projects.updatedAt)),
    db.select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      title: blogPosts.title,
      excerpt: blogPosts.excerpt,
      content: blogPosts.content,
      translations: blogPosts.translations,
      publishedAt: blogPosts.publishedAt,
      readingMinutes: blogPosts.readingMinutes,
      featured: blogPosts.isFeatured,
      coverMediaId: blogPosts.coverMediaId,
      seoTitle: blogPosts.seoTitle,
      seoDescription: blogPosts.seoDescription,
      canonicalUrl: blogPosts.canonicalUrl,
      category: blogCategories.name,
      categorySlug: blogCategories.slug,
    }).from(blogPosts).leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id)).where(and(publicPost, isNull(blogPosts.deletedAt))).orderBy(desc(blogPosts.publishedAt), desc(blogPosts.updatedAt)),
    db.select().from(certificates).where(eq(certificates.isActive, true)).orderBy(asc(certificates.sortOrder), desc(certificates.issuedAt)),
    getHeroImage(),
  ])

  const localizedPostRows = postRows.flatMap((row) => {
    if (locale === defaultLocale) return [row]
    const translation = storedBlogTranslations(row.translations)[locale]
    if (!translation) return []
    return [{
      ...row,
      title: translation.title,
      slug: translation.slug,
      excerpt: translation.excerpt,
      content: translation.content,
      readingMinutes: translation.readingMinutes,
      seoTitle: translation.seoTitle,
      seoDescription: translation.seoDescription,
      canonicalUrl: translation.canonicalUrl,
    }]
  })

  const projectIds = projectRows.map(row => row.id)
  const postIds = localizedPostRows.map(row => row.id)
  const allMediaIds = [...new Set([
    ...experienceRows.flatMap(row => row.logoMediaId ? [row.logoMediaId] : []),
    ...educationRows.flatMap(row => row.logoMediaId ? [row.logoMediaId] : []),
    ...projectRows.flatMap(row => row.coverMediaId ? [row.coverMediaId] : []),
    ...localizedPostRows.flatMap(row => row.coverMediaId ? [row.coverMediaId] : []),
    ...certificateRows.flatMap(row => row.imageMediaId ? [row.imageMediaId] : []),
    ...certificateRows.flatMap(row => row.pdfMediaId ? [row.pdfMediaId] : []),
  ])]

  const [technologyRows, tagRows, mediaRows] = await Promise.all([
    projectIds.length
      ? db.select({ projectId: projectTechnologies.projectId, name: technologies.name }).from(projectTechnologies).innerJoin(technologies, eq(projectTechnologies.technologyId, technologies.id)).where(inArray(projectTechnologies.projectId, projectIds)).orderBy(asc(technologies.name))
      : Promise.resolve([]),
    postIds.length
      ? db.select({ postId: blogPostTags.postId, name: blogTags.name }).from(blogPostTags).innerJoin(blogTags, eq(blogPostTags.tagId, blogTags.id)).where(inArray(blogPostTags.postId, postIds)).orderBy(asc(blogTags.name))
      : Promise.resolve([]),
    allMediaIds.length
      ? db.select({ id: mediaFiles.id, storageKey: mediaFiles.storageKey, altText: mediaFiles.altText }).from(mediaFiles).where(inArray(mediaFiles.id, allMediaIds))
      : Promise.resolve([]),
  ])

  const mediaById = new Map(mediaRows.map(row => [row.id, row]))
  const technologiesByProject = new Map<string, string[]>()
  for (const row of technologyRows) technologiesByProject.set(row.projectId, [...(technologiesByProject.get(row.projectId) || []), row.name])
  const tagsByPost = new Map<string, string[]>()
  for (const row of tagRows) tagsByPost.set(row.postId, [...(tagsByPost.get(row.postId) || []), row.name])

  const publicExperiences: PublicExperience[] = experienceRows.map(row => ({
    id: row.id,
    company: row.company,
    position: row.position,
    employmentType: row.employmentType,
    location: row.location,
    startDate: iso(row.startDate),
    endDate: iso(row.endDate),
    isCurrent: row.isCurrent,
    summary: row.summary,
    responsibilities: row.responsibilities,
    companyUrl: row.companyUrl,
    logoUrl: mediaUrl(row.logoMediaId ? mediaById.get(row.logoMediaId) : undefined),
    logoAlt: row.logoMediaId ? mediaById.get(row.logoMediaId)?.altText || `${row.company} logosu` : `${row.company} logosu`,
  }))

  const publicEducations: PublicEducation[] = educationRows.map(row => ({
    id: row.id,
    school: row.school,
    department: row.department,
    degree: row.degree,
    startDate: iso(row.startDate),
    endDate: iso(row.endDate),
    isCurrent: row.isCurrent,
    description: row.description,
    url: row.url,
    logoUrl: mediaUrl(row.logoMediaId ? mediaById.get(row.logoMediaId) : undefined),
    logoAlt: row.logoMediaId ? mediaById.get(row.logoMediaId)?.altText || `${row.school} logosu` : `${row.school} logosu`,
  }))

  const publicProjects: PublicProject[] = projectRows.map(row => {
    const cover = row.coverMediaId ? mediaById.get(row.coverMediaId) : undefined
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      category: row.category,
      categorySlug: row.categorySlug,
      technologies: technologiesByProject.get(row.id) || [],
      featured: row.featured,
      coverUrl: mediaUrl(cover),
      coverAlt: cover?.altText || `${row.title} proje görseli`,
      liveUrl: row.liveUrl,
      repoUrl: row.repoUrl,
      clientName: row.clientName,
      role: row.role,
      startDate: iso(row.startDate),
      endDate: iso(row.endDate),
      isCurrent: row.isCurrent,
    }
  })

  const coverPositions = ['left', 'center', 'right'] as const
  const publicPosts: PublicBlogPost[] = localizedPostRows.map((row, index) => {
    const cover = row.coverMediaId ? mediaById.get(row.coverMediaId) : undefined
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      date: iso(row.publishedAt) || new Date(0).toISOString(),
      category: row.category || (locale === 'en' ? 'General' : 'Genel'),
      categorySlug: row.categorySlug,
      tags: tagsByPost.get(row.id) || [],
      readingMinutes: row.readingMinutes,
      featured: row.featured,
      coverPosition: coverPositions[index % coverPositions.length]!,
      coverUrl: mediaUrl(cover),
      coverAlt: cover?.altText || (locale === 'en' ? `${row.title} cover image` : `${row.title} yazı görseli`),
      locale,
    }
  })

  const publicCertificates: PublicCertificate[] = certificateRows.map(row => ({
    id: row.id,
    name: row.name,
    issuer: row.issuer,
    issuedAt: iso(row.issuedAt),
    expiresAt: iso(row.expiresAt),
    neverExpires: row.neverExpires,
    credentialId: row.credentialId,
    verifyUrl: row.verifyUrl,
    description: row.description,
    category: row.category,
    imageUrl: mediaUrl(row.imageMediaId ? mediaById.get(row.imageMediaId) : undefined),
    pdfUrl: mediaPdfUrl(row.pdfMediaId ? mediaById.get(row.pdfMediaId) : undefined),
  }))

  const automaticValues: Record<string, number | null> = {
    projects: publicProjects.length,
    project: publicProjects.length,
    posts: publicPosts.length,
    blog: publicPosts.length,
    certificates: publicCertificates.length,
    certificate: publicCertificates.length,
    experiences: experienceYears(experienceRows),
    experience: experienceYears(experienceRows),
    'experience-years': experienceYears(experienceRows),
    collaborations: new Set(projectRows.flatMap(row => row.clientName ? [row.clientName] : [])).size,
  }

  const publicStats: PublicStat[] = statRows.length
    ? statRows.map(row => ({ id: row.id, key: row.key, label: row.label, value: row.mode === 'automatic' ? (automaticValues[row.key] ?? null) : row.value }))
    : [
        { id: 'projects', key: 'projects', label: 'Proje', value: publicProjects.length },
        { id: 'experience-years', key: 'experience-years', label: 'Tecrübe yılı', value: experienceYears(experienceRows) },
        { id: 'collaborations', key: 'collaborations', label: 'İş birliği', value: automaticValues.collaborations ?? null },
        { id: 'certificates', key: 'certificates', label: 'Sertifika', value: publicCertificates.length },
      ]

  const publicSkills: PublicSkill[] = skillRows.map(row => ({
    ...row,
    level: levelLabels[row.level] || row.level,
  }))

  return {
    profile: profileFromSetting(profileRows[0]?.value),
    hero,
    homepageSections: sectionRows.filter(row => !row.key.startsWith('about:')).map(sectionFromRow),
    aboutSections: sectionRows.filter(row => row.key.startsWith('about:')).map(sectionFromRow),
    stats: publicStats,
    skills: publicSkills,
    experiences: publicExperiences,
    educations: publicEducations,
    projects: publicProjects,
    posts: publicPosts,
    certificates: publicCertificates,
  }
}

export async function getPublicProject(slug: string): Promise<PublicProjectDetail | undefined> {
  const content = await getPublicSiteContent()
  const project = content.projects.find(item => item.slug === slug)
  if (!project) return undefined
  const [row] = await useDb().select({ content: projects.content, seoTitle: projects.seoTitle, seoDescription: projects.seoDescription }).from(projects).where(and(eq(projects.slug, slug), eq(projects.status, 'published'), isNull(projects.deletedAt))).limit(1)
  if (!row) return undefined
  const galleryRows = await useDb().select({ id: mediaFiles.id, storageKey: mediaFiles.storageKey, altText: mediaFiles.altText })
    .from(projectImages)
    .innerJoin(mediaFiles, eq(projectImages.mediaId, mediaFiles.id))
    .where(eq(projectImages.projectId, project.id))
    .orderBy(asc(projectImages.sortOrder))
  const gallery = galleryRows.flatMap((image) => {
    const url = mediaUrl(image)
    return url ? [{ id: image.id, url, altText: image.altText || `${project.title} ekran görüntüsü` }] : []
  })
  return { ...project, contentHtml: sanitizeRichText(row.content), seoTitle: row.seoTitle, seoDescription: row.seoDescription, gallery }
}

export async function getPublicBlogPost(slug: string, locale: SupportedLocale = defaultLocale): Promise<PublicBlogPostDetail | undefined> {
  const content = await getPublicSiteContent(locale)
  const post = content.posts.find(item => item.slug === slug)
  if (!post) return undefined
  const now = new Date()
  const publicPost = or(eq(blogPosts.status, 'published'), and(eq(blogPosts.status, 'scheduled'), lte(blogPosts.publishedAt, now)))
  const [row] = await useDb().select({ slug: blogPosts.slug, content: blogPosts.content, translations: blogPosts.translations, seoTitle: blogPosts.seoTitle, seoDescription: blogPosts.seoDescription, canonicalUrl: blogPosts.canonicalUrl }).from(blogPosts).where(and(eq(blogPosts.id, post.id), publicPost, isNull(blogPosts.deletedAt))).limit(1)
  if (!row) return undefined
  const stored = storedBlogTranslations(row.translations)
  const translation: BlogTranslation = locale === defaultLocale
    ? { title: post.title, slug: row.slug, excerpt: post.excerpt, content: row.content, readingMinutes: post.readingMinutes, seoTitle: row.seoTitle, seoDescription: row.seoDescription, canonicalUrl: row.canonicalUrl }
    : stored[locale]!
  const localizedSlugs: Partial<Record<SupportedLocale, string>> = { [defaultLocale]: row.slug }
  for (const supportedLocale of Object.keys(stored) as SupportedLocale[]) {
    const localized = stored[supportedLocale]
    if (localized) localizedSlugs[supportedLocale] = localized.slug
  }
  return { ...post, ...richTextWithHeadings(translation.content), seoTitle: translation.seoTitle, seoDescription: translation.seoDescription, canonicalUrl: translation.canonicalUrl, localizedSlugs }
}
