<script setup lang="ts">
const { locale, t } = useI18n()
const { data: contentResponse } = await usePublicContent()
const posts = computed(() => contentResponse.value?.data.posts || [])
const query = ref('')
const category = ref('')
const categories = computed(() => [...new Set(posts.value.map(post => post.category))])
const filtered = computed(() => posts.value.filter((post) => {
  const languageTag = locale.value === 'tr' ? 'tr-TR' : 'en-US'
  const term = query.value.toLocaleLowerCase(languageTag)
  return (!term || `${post.title} ${post.excerpt} ${post.tags.join(' ')}`.toLocaleLowerCase(languageTag).includes(term)) && (!category.value || post.category === category.value)
}))

useSeoMeta({ title: 'Blog', description: () => t('blog.seoDescription') })
</script>

<template>
  <div class="container page-top">
    <div class="page-intro"><p class="eyebrow">{{ t('blog.eyebrow') }}</p><h1>{{ t('blog.title') }}</h1><p>{{ t('blog.intro') }}</p></div>
    <div class="filters blog-filters"><input v-model="query" :aria-label="t('blog.searchLabel')" :placeholder="t('blog.search')"><select v-model="category" :aria-label="t('blog.category')"><option value="">{{ t('blog.allCategories') }}</option><option v-for="item in categories" :key="item" :value="item">{{ item }}</option></select></div>
    <div v-if="filtered.length" class="blog-grid"><BlogCard v-for="post in filtered" :key="post.id" :post="post" /></div>
    <div v-else class="empty-state"><i class="bi bi-search" /><h2>{{ posts.length ? t('blog.noResult') : t('blog.noPost') }}</h2><p>{{ posts.length ? t('blog.changeFilters') : t('blog.adminHint') }}</p></div>
  </div>
</template>
