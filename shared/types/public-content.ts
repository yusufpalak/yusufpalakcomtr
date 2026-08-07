import type { SupportedLocale } from '../i18n/locales'

export type PublicHeroImage = {
  id: string
  url: string
  width: number | null
  height: number | null
  altText: string
}

export type PublicProfile = {
  name: string
  title: string
  focus: string[]
}

export type PublicSection = {
  id: string
  key: string
  title: string | null
  content: string | null
  sortOrder: number
}

export type PublicStat = {
  id: string
  key: string
  label: string
  value: number | null
}

export type PublicSkill = {
  id: string
  name: string
  level: string
  years: number | null
  description: string | null
  icon: string | null
  category: string | null
  categorySlug: string | null
}

export type PublicExperience = {
  id: string
  company: string
  position: string
  employmentType: string | null
  location: string | null
  startDate: string | null
  endDate: string | null
  isCurrent: boolean
  summary: string | null
  responsibilities: string | null
  companyUrl: string | null
}

export type PublicEducation = {
  id: string
  school: string
  department: string | null
  degree: string | null
  startDate: string | null
  endDate: string | null
  isCurrent: boolean
  description: string | null
  url: string | null
}

export type PublicProject = {
  id: string
  slug: string
  title: string
  summary: string
  category: string | null
  categorySlug: string | null
  technologies: string[]
  featured: boolean
  coverUrl: string | null
  coverAlt: string
  liveUrl: string | null
  repoUrl: string | null
  clientName: string | null
  role: string | null
  startDate: string | null
  endDate: string | null
  isCurrent: boolean
}

export type PublicProjectDetail = PublicProject & {
  contentHtml: string
  seoTitle: string | null
  seoDescription: string | null
}

export type PublicBlogPost = {
  id: string
  slug: string
  title: string
  excerpt: string
  date: string
  category: string
  categorySlug: string | null
  tags: string[]
  readingMinutes: number
  featured: boolean
  coverPosition: 'left' | 'center' | 'right'
  coverUrl: string | null
  coverAlt: string
  locale: SupportedLocale
}

export type PublicBlogPostDetail = PublicBlogPost & {
  contentHtml: string
  headings: Array<{ id: string, text: string }>
  seoTitle: string | null
  seoDescription: string | null
  canonicalUrl: string | null
  localizedSlugs: Partial<Record<SupportedLocale, string>>
}

export type PublicCertificate = {
  id: string
  name: string
  issuer: string
  issuedAt: string | null
  expiresAt: string | null
  neverExpires: boolean
  credentialId: string | null
  verifyUrl: string | null
  description: string | null
  category: string | null
  imageUrl: string | null
}

export type PublicSiteContent = {
  profile: PublicProfile
  hero: PublicHeroImage | null
  homepageSections: PublicSection[]
  aboutSections: PublicSection[]
  stats: PublicStat[]
  skills: PublicSkill[]
  experiences: PublicExperience[]
  educations: PublicEducation[]
  projects: PublicProject[]
  posts: PublicBlogPost[]
  certificates: PublicCertificate[]
}
