<script setup lang="ts">
const { locale, t } = useI18n()
const localePath = useLocalePath()
const { data: contentResponse } = await usePublicContent()
const projects = computed(() => contentResponse.value?.data.projects || [])
const query = ref('')
const category = ref('')
const technology = ref('')
const categories = computed(() => [...new Set(projects.value.flatMap(project => project.category ? [project.category] : []))])
const technologies = computed(() => [...new Set(projects.value.flatMap(project => project.technologies))])
const languageTag = computed(() => locale.value === 'tr' ? 'tr-TR' : 'en-US')
const filtered = computed(() => {
  const term = query.value.trim().toLocaleLowerCase(languageTag.value)
  return projects.value.filter(project => {
    const haystack = `${project.title} ${project.summary} ${project.category || ''} ${project.technologies.join(' ')}`.toLocaleLowerCase(languageTag.value)
    return (!term || haystack.includes(term)) && (!category.value || project.category === category.value) && (!technology.value || project.technologies.includes(technology.value))
  })
})

useSeoMeta({ title: () => t('portfolio.seoTitle'), description: () => t('portfolio.seoDescription') })
</script>

<template>
  <div class="container page-top">
    <div class="page-intro"><p class="eyebrow">{{ t('portfolio.eyebrow') }}</p><h1>{{ t('portfolio.title') }}</h1><p>{{ t('portfolio.intro') }}</p></div>
    <div class="filters portfolio-filters">
      <input v-model="query" :aria-label="t('portfolio.searchLabel')" :placeholder="t('portfolio.search')">
      <select v-model="category" :aria-label="t('portfolio.category')"><option value="">{{ t('portfolio.allCategories') }}</option><option v-for="item in categories" :key="item" :value="item">{{ item }}</option></select>
      <select v-model="technology" :aria-label="t('portfolio.technology')"><option value="">{{ t('portfolio.allTechnologies') }}</option><option v-for="item in technologies" :key="item" :value="item">{{ item }}</option></select>
    </div>
    <div v-if="filtered.length" class="project-grid">
      <article v-for="project in filtered" :key="project.id" class="project-card">
        <NuxtLink :to="localePath({ name: 'portfolio-slug', params: { slug: project.slug } })" class="project-card__visual" :aria-label="t('portfolio.viewAria', { title: project.title })"><img v-if="project.coverUrl" :src="project.coverUrl" :alt="project.coverAlt"><span v-else>{{ project.title.slice(0, 2).toLocaleUpperCase(languageTag) }}</span></NuxtLink>
        <div class="project-card__body"><div class="project-card__meta"><span>{{ project.category || t('common.project') }}</span><span v-if="project.featured">{{ t('common.featured') }}</span></div><h2><NuxtLink :to="localePath({ name: 'portfolio-slug', params: { slug: project.slug } })">{{ project.title }}</NuxtLink></h2><p>{{ project.summary }}</p><div v-if="project.technologies.length"><span v-for="item in project.technologies" :key="item" class="tag">{{ item }}</span></div><NuxtLink :to="localePath({ name: 'portfolio-slug', params: { slug: project.slug } })" class="text-link">{{ t('portfolio.viewDetail') }} <i class="bi bi-arrow-up-right" /></NuxtLink></div>
      </article>
    </div>
    <div v-else class="empty-state"><i class="bi bi-search" /><h2>{{ projects.length ? t('portfolio.noResult') : t('portfolio.noProject') }}</h2><p>{{ projects.length ? t('portfolio.changeFilters') : t('portfolio.adminHint') }}</p></div>
  </div>
</template>
