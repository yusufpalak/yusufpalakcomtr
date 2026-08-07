import type { PublicSiteContent } from '#shared/types/public-content'

export const emptyPublicContent: PublicSiteContent = {
  profile: { name: 'Yusuf Palak', title: 'Full-Stack Developer', focus: [] },
  hero: null,
  homepageSections: [],
  aboutSections: [],
  stats: [],
  skills: [],
  experiences: [],
  educations: [],
  projects: [],
  posts: [],
  certificates: [],
}

export function usePublicContent() {
  const { locale } = useI18n()
  return useFetch<{ success: true, data: PublicSiteContent }>('/api/public/content', {
    key: computed(() => `public-site-content-${locale.value}`),
    query: computed(() => ({ locale: locale.value })),
  })
}
