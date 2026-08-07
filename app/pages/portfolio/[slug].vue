<script setup lang="ts">
import type { PublicProjectDetail } from '#shared/types/public-content'

const { locale, t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const slug = String(route.params.slug)
const { data, error } = await useFetch<{ success: true, data: PublicProjectDetail }>(`/api/public/projects/${encodeURIComponent(slug)}`, { key: `public-project-${slug}` })
if (error.value || !data.value?.data) throw createError({ statusCode: 404, statusMessage: t('projectDetail.notFound') })
const project = computed(() => data.value!.data)

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat(locale.value === 'tr' ? 'tr-TR' : 'en-US', { month: 'long', year: 'numeric' }).format(new Date(value)) : null
}

useSeoMeta({
  title: () => project.value.seoTitle || project.value.title,
  description: () => project.value.seoDescription || project.value.summary,
  ogTitle: () => project.value.seoTitle || project.value.title,
  ogDescription: () => project.value.seoDescription || project.value.summary,
})
</script>

<template>
  <article class="container article-shell project-detail">
    <NuxtLink :to="localePath('portfolio')" class="back-link"><i class="bi bi-arrow-left" /> {{ t('projectDetail.allProjects') }}</NuxtLink>
    <header class="article-header">
      <p class="eyebrow">{{ project.category || t('common.project').toLocaleUpperCase(locale === 'tr' ? 'tr-TR' : 'en-US') }}</p>
      <h1>{{ project.title }}</h1>
      <p>{{ project.summary }}</p>
      <div class="project-detail__actions">
        <a v-if="project.liveUrl" :href="project.liveUrl" target="_blank" rel="noopener noreferrer" class="btn">{{ t('projectDetail.openLive') }} <i class="bi bi-arrow-up-right" /></a>
        <a v-if="project.repoUrl" :href="project.repoUrl" target="_blank" rel="noopener noreferrer" class="btn secondary">{{ t('projectDetail.repository') }} <i class="bi bi-github" /></a>
      </div>
    </header>
    <img v-if="project.coverUrl" class="project-detail__cover" :src="project.coverUrl" :alt="project.coverAlt">
    <div class="project-detail__layout">
      <aside>
        <dl>
          <template v-if="project.clientName"><dt>{{ t('projectDetail.client') }}</dt><dd>{{ project.clientName }}</dd></template>
          <template v-if="project.role"><dt>{{ t('projectDetail.role') }}</dt><dd>{{ project.role }}</dd></template>
          <template v-if="project.startDate || project.endDate || project.isCurrent"><dt>{{ t('projectDetail.date') }}</dt><dd>{{ [formatDate(project.startDate), project.isCurrent ? t('common.current') : formatDate(project.endDate)].filter(Boolean).join(` ${t('common.dateSeparator')} `) }}</dd></template>
        </dl>
        <div v-if="project.technologies.length"><span v-for="item in project.technologies" :key="item" class="tag">{{ item }}</span></div>
      </aside>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="article-content rich-content" v-html="project.contentHtml" />
    </div>
  </article>
</template>
