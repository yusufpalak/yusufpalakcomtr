<script setup lang="ts">
const { locale, t } = useI18n()
const localePath = useLocalePath()
const { data: contentResponse } = await usePublicContent()
const content = computed(() => contentResponse.value?.data || emptyPublicContent)
const heroImage = computed(() => content.value.hero)
const heroSection = computed(() => content.value.homepageSections.find(section => ['hero', 'hero-intro', 'intro'].includes(section.key)))
const extraHomepageSections = computed(() => content.value.homepageSections.filter(section => !['hero', 'hero-intro', 'intro'].includes(section.key)))
const featuredProjects = computed(() => {
  const featured = content.value.projects.filter(project => project.featured)
  return (featured.length ? featured : content.value.projects).slice(0, 3)
})
const latestPosts = computed(() => content.value.posts.slice(0, 3))
const languageTag = computed(() => locale.value === 'tr' ? 'tr-TR' : 'en-US')

useSeoMeta({
  title: () => t('home.seoTitle'),
  ogTitle: 'Yusuf Palak — Full-Stack Developer',
  description: () => t('home.seoDescription'),
})
</script>

<template>
  <div class="container">
    <section class="hero">
      <div class="hero-copy">
        <div class="eyebrow">{{ content.profile.title.toLocaleUpperCase(languageTag) }} · {{ t('home.location') }}</div>
        <h1>{{ heroSection?.title || t('home.fallbackTitle') }}</h1>
        <p>{{ heroSection?.content || t('home.fallbackIntro', { name: content.profile.name }) }}</p>
        <div class="hero-actions-stack">
          <div class="actions">
            <NuxtLink class="btn" :to="localePath('portfolio')">{{ t('home.viewProjects') }}</NuxtLink>
            <NuxtLink class="btn secondary" :to="localePath('contact')">{{ t('home.contact') }}</NuxtLink>
            <a class="btn secondary" href="/cv.pdf" download>{{ t('home.downloadCv') }}</a>
          </div>
          <div class="hero-socials">
            <span>{{ t('home.socialProfiles') }}</span>
            <SocialLinks location="home" compact />
          </div>
        </div>
      </div>
      <div class="portrait" :aria-label="heroImage ? undefined : 'Yusuf Palak monogram'">
        <img v-if="heroImage" :key="heroImage.url" class="portrait__image" :src="heroImage.url" :alt="heroImage.altText">
        <template v-else>YP</template>
      </div>
    </section>

    <section class="stats">
      <div v-for="stat in content.stats" :key="stat.id" class="stat"><b>{{ stat.value ?? '—' }}</b><span>{{ stat.label }}</span></div>
    </section>

    <section v-for="section in extraHomepageSections" :key="section.id" class="home-section managed-section">
      <p class="eyebrow">{{ section.key.toLocaleUpperCase(languageTag) }}</p>
      <h2 v-if="section.title" class="section-title">{{ section.title }}</h2>
      <p v-if="section.content" class="lede managed-copy">{{ section.content }}</p>
    </section>

    <section class="home-section">
      <p class="eyebrow">{{ t('home.skillsEyebrow') }}</p>
      <h2 class="section-title">{{ t('home.skillsTitle') }}</h2>
      <div v-if="content.skills.length"><span v-for="skill in content.skills" :key="skill.id" class="tag">{{ skill.name }}</span></div>
      <div v-else class="empty-state"><p>{{ t('home.noSkills') }}</p></div>
    </section>

    <section class="home-section">
      <div class="section-heading"><div><p class="eyebrow">{{ t('home.projectsEyebrow') }}</p><h2 class="section-title">{{ t('home.projectsTitle') }}</h2></div><NuxtLink :to="localePath('portfolio')" class="text-link">{{ t('home.allProjects') }} <i class="bi bi-arrow-right" /></NuxtLink></div>
      <div v-if="featuredProjects.length" class="grid"><article v-for="project in featuredProjects" :key="project.id" class="card"><small v-if="project.category" class="muted">{{ project.category }}</small><h3>{{ project.title }}</h3><p class="muted">{{ project.summary }}</p><NuxtLink :to="localePath({ name: 'portfolio-slug', params: { slug: project.slug } })" class="text-link">{{ t('home.viewProject') }} <i class="bi bi-arrow-up-right" /></NuxtLink></article></div>
      <div v-else class="empty-state"><i class="bi bi-window-stack" /><h3>{{ t('home.noProjectsTitle') }}</h3><p>{{ t('home.noProjectsText') }}</p></div>
    </section>

    <section class="home-section">
      <div class="section-heading"><div><p class="eyebrow">{{ t('home.notesEyebrow') }}</p><h2 class="section-title">{{ t('home.latestPosts') }}</h2></div><NuxtLink :to="localePath('blog')" class="text-link">{{ t('home.allPosts') }} <i class="bi bi-arrow-right" /></NuxtLink></div>
      <div v-if="latestPosts.length" class="blog-grid"><BlogCard v-for="post in latestPosts" :key="post.id" :post="post" /></div>
      <div v-else class="empty-state"><i class="bi bi-journal-text" /><h3>{{ t('home.noPosts') }}</h3></div>
    </section>
  </div>
</template>
