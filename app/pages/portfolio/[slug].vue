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
    <section v-if="project.gallery.length" class="project-detail__gallery" aria-labelledby="project-gallery-title">
      <h2 id="project-gallery-title">{{ t('projectDetail.gallery') }}</h2>
      <div class="project-detail__gallery-grid">
        <a v-for="image in project.gallery" :key="image.id" :href="image.url" target="_blank" rel="noopener noreferrer">
          <img :src="image.url" :alt="image.altText" loading="lazy">
        </a>
      </div>
    </section>
  </article>
</template>

<style scoped>
.project-detail__gallery{margin-top:4rem;padding-top:2.5rem;border-top:1px solid var(--line)}
.project-detail__gallery h2{margin:0 0 1.25rem;font-size:1.5rem}
.project-detail__gallery-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}
.project-detail__gallery-grid a{display:block;overflow:hidden;border:1px solid var(--line);border-radius:14px;background:var(--panel)}
.project-detail__gallery-grid img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover;transition:transform .25s ease}
.project-detail__gallery-grid a:hover img{transform:scale(1.02)}
@media(max-width:700px){.project-detail__gallery-grid{grid-template-columns:1fr}}
</style>
