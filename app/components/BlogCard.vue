<script setup lang="ts">
import type { PublicBlogPost } from '#shared/types/public-content'
defineProps<{ post: PublicBlogPost }>()
const { locale, t } = useI18n()
const localePath = useLocalePath()

function formatDate(value: string) {
  return new Intl.DateTimeFormat(locale.value === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
}
</script>

<template>
  <article class="blog-card">
    <NuxtLink :to="localePath({ name: 'blog-slug', params: { slug: post.slug } })" class="blog-card__cover" :aria-label="t('blog.readAria', { title: post.title })"><BlogCover :position="post.coverPosition" :alt="post.coverAlt" :image-url="post.coverUrl" /></NuxtLink>
    <div class="blog-card__body">
      <div class="blog-meta"><span>{{ post.category }}</span><span>{{ post.readingMinutes }} {{ t('common.minuteShort') }}</span></div>
      <h2><NuxtLink :to="localePath({ name: 'blog-slug', params: { slug: post.slug } })">{{ post.title }}</NuxtLink></h2>
      <p>{{ post.excerpt }}</p>
      <div class="blog-card__footer"><time :datetime="post.date">{{ formatDate(post.date) }}</time><NuxtLink :to="localePath({ name: 'blog-slug', params: { slug: post.slug } })" class="text-link">{{ t('blog.read') }} <i class="bi bi-arrow-up-right" /></NuxtLink></div>
    </div>
  </article>
</template>
