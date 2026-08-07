<script setup lang="ts">
import type { PublicBlogPostDetail } from '#shared/types/public-content'

const { locale, t } = useI18n()
const localePath = useLocalePath()
const setI18nParams = useSetI18nParams()
const route = useRoute()
const slug = String(route.params.slug)
const [{ data, error }, { data: siteResponse }] = await Promise.all([
  useFetch<{ success: true, data: PublicBlogPostDetail }>(`/api/public/blog/${encodeURIComponent(slug)}`, { key: `public-blog-${locale.value}-${slug}`, query: { locale } }),
  usePublicContent(),
])
if (error.value || !data.value?.data) {
  if (locale.value !== 'tr') await navigateTo(localePath('blog'), { redirectCode: 302 })
  throw createError({ statusCode: 404, statusMessage: t('blogDetail.notFound') })
}
const post = computed(() => data.value!.data)
const related = computed(() => (siteResponse.value?.data.posts || []).filter(item => item.slug !== post.value.slug).slice(0, 2))
setI18nParams(Object.fromEntries(Object.entries(post.value.localizedSlugs).map(([localeCode, localizedSlug]) => [localeCode, { slug: localizedSlug }])))

useSeoMeta({
  title: () => post.value.seoTitle || post.value.title,
  description: () => post.value.seoDescription || post.value.excerpt,
  articlePublishedTime: () => post.value.date,
  ogTitle: () => post.value.seoTitle || post.value.title,
  ogDescription: () => post.value.seoDescription || post.value.excerpt,
})
useHead(() => ({
  link: post.value.canonicalUrl ? [{ rel: 'canonical', href: post.value.canonicalUrl }] : [],
  script: [{ type: 'application/ld+json', innerHTML: JSON.stringify({ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.value.title, datePublished: post.value.date, author: { '@type': 'Person', name: 'Yusuf Palak' } }) }],
}))

function formatDate(value: string) {
  return new Intl.DateTimeFormat(locale.value === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value))
}
</script>

<template>
  <article class="container article-shell">
    <NuxtLink :to="localePath('blog')" class="back-link"><i class="bi bi-arrow-left" /> {{ t('blogDetail.allPosts') }}</NuxtLink>
    <header class="article-header"><div class="blog-meta"><span>{{ post.category }}</span><time :datetime="post.date">{{ formatDate(post.date) }}</time><span>{{ t('blogDetail.readingTime', { minutes: post.readingMinutes }) }}</span></div><h1>{{ post.title }}</h1><p>{{ post.excerpt }}</p></header>
    <BlogCover :position="post.coverPosition" :alt="post.coverAlt" :image-url="post.coverUrl" large />
    <div class="article-layout" :class="{ 'article-layout--single': !post.headings.length }">
      <aside v-if="post.headings.length"><strong>{{ t('blogDetail.contents') }}</strong><a v-for="heading in post.headings" :key="heading.id" :href="`#${heading.id}`">{{ heading.text }}</a></aside>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="article-content rich-content" v-html="post.contentHtml" />
    </div>
    <div v-if="post.tags.length" class="article-tags"><span v-for="tag in post.tags" :key="tag" class="tag">{{ tag }}</span></div>
    <section v-if="related.length" class="related-posts"><p class="eyebrow">{{ t('blogDetail.discover') }}</p><h2>{{ t('blogDetail.related') }}</h2><div class="blog-grid blog-grid--two"><BlogCard v-for="item in related" :key="item.id" :post="item" /></div></section>
  </article>
</template>
