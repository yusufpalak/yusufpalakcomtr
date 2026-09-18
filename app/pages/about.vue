<script setup lang="ts">
const { locale, t } = useI18n()
const { data: contentResponse } = await usePublicContent()
const content = computed(() => contentResponse.value?.data || emptyPublicContent)
const introSection = computed(() => content.value.aboutSections.find(section => ['intro', 'biyografi', 'bio'].includes(section.key)))
const detailSections = computed(() => content.value.aboutSections.filter(section => !['intro', 'biyografi', 'bio'].includes(section.key)))

const languageTag = computed(() => locale.value === 'tr' ? 'tr-TR' : 'en-US')

function monthYear(value: string | null) {
  if (!value) return null
  return new Intl.DateTimeFormat(languageTag.value, { month: 'short', year: 'numeric' }).format(new Date(value))
}

function period(startDate: string | null, endDate: string | null, isCurrent: boolean) {
  const start = monthYear(startDate)
  const end = isCurrent ? t('common.current') : monthYear(endDate)
  if (!start && !end) return null
  return [start, end].filter(Boolean).join(` ${t('common.dateSeparator')} `)
}

function employmentLabel(type: string) {
  const key = ['full-time', 'part-time', 'freelance', 'internship'].includes(type) ? `about.employment.${type}` : null
  return key ? t(key) : type
}

useSeoMeta({ title: () => t('about.seoTitle'), description: () => t('about.seoDescription') })
</script>

<template>
  <div class="container page-top">
    <div class="page-intro about-intro">
      <p class="eyebrow">{{ t('about.eyebrow') }}</p>
      <h1>{{ introSection?.title || t('about.fallbackTitle') }}</h1>
      <p>{{ introSection?.content || t('about.fallbackIntro', { name: content.profile.name, title: content.profile.title.toLocaleLowerCase(languageTag) }) }}</p>
    </div>

    <section v-for="section in detailSections" :key="section.id" class="profile-section managed-section">
      <p class="eyebrow">{{ section.key.toLocaleUpperCase(languageTag) }}</p>
      <h2 v-if="section.title">{{ section.title }}</h2>
      <p v-if="section.content" class="managed-copy">{{ section.content }}</p>
    </section>

    <section class="profile-section">
      <div class="section-heading"><div><p class="eyebrow">{{ t('about.expertiseEyebrow') }}</p><h2 class="section-title">{{ t('about.skillsTitle') }}</h2></div></div>
      <div v-if="content.skills.length" class="skill-grid">
        <article v-for="skill in content.skills" :key="skill.id" class="skill-card">
          <i v-if="skill.icon" :class="skill.icon" />
          <div><small>{{ skill.category || t('common.technical') }}</small><h3>{{ skill.name }}</h3><p>{{ skill.level }}<template v-if="skill.years !== null"> · {{ skill.years }} {{ t('common.year') }}</template></p></div>
          <span v-if="skill.description">{{ skill.description }}</span>
        </article>
      </div>
      <div v-else class="empty-state"><p>{{ t('about.noSkills') }}</p></div>
    </section>

    <section class="profile-section">
      <div class="section-heading"><div><p class="eyebrow">{{ t('about.careerEyebrow') }}</p><h2 class="section-title">{{ t('about.experienceTitle') }}</h2></div></div>
      <div v-if="content.experiences.length" class="timeline-list">
        <article v-for="experience in content.experiences" :key="experience.id" class="timeline-card">
          <div class="timeline-card__marker" aria-hidden="true" />
          <div class="timeline-card__content">
            <div class="timeline-card__heading"><div class="timeline-card__identity"><img v-if="experience.logoUrl" :src="experience.logoUrl" :alt="experience.logoAlt" loading="lazy"><div><p>{{ experience.company }}</p><h3>{{ experience.position }}</h3></div></div><time v-if="period(experience.startDate, experience.endDate, experience.isCurrent)">{{ period(experience.startDate, experience.endDate, experience.isCurrent) }}</time></div>
            <div v-if="experience.employmentType || experience.location" class="timeline-card__meta"><span v-if="experience.employmentType">{{ employmentLabel(experience.employmentType) }}</span><span v-if="experience.location">{{ experience.location }}</span></div>
            <p v-if="experience.summary" class="managed-copy">{{ experience.summary }}</p>
            <p v-if="experience.responsibilities" class="managed-copy muted">{{ experience.responsibilities }}</p>
            <a v-if="experience.companyUrl" :href="experience.companyUrl" target="_blank" rel="noopener noreferrer" class="text-link">{{ t('about.viewCompany') }} <i class="bi bi-arrow-up-right" /></a>
          </div>
        </article>
      </div>
      <div v-else class="empty-state"><i class="bi bi-briefcase" /><p>{{ t('about.noExperience') }}</p></div>
    </section>

    <section class="profile-section">
      <div class="section-heading"><div><p class="eyebrow">{{ t('about.educationEyebrow') }}</p><h2 class="section-title">{{ t('about.educationTitle') }}</h2></div></div>
      <div v-if="content.educations.length" class="timeline-list">
        <article v-for="education in content.educations" :key="education.id" class="timeline-card">
          <div class="timeline-card__marker" aria-hidden="true" />
          <div class="timeline-card__content">
            <div class="timeline-card__heading"><div class="timeline-card__identity"><img v-if="education.logoUrl" :src="education.logoUrl" :alt="education.logoAlt" loading="lazy"><div><p>{{ education.school }}</p><h3>{{ [education.degree, education.department].filter(Boolean).join(' · ') || education.school }}</h3></div></div><time v-if="period(education.startDate, education.endDate, education.isCurrent)">{{ period(education.startDate, education.endDate, education.isCurrent) }}</time></div>
            <p v-if="education.description" class="managed-copy">{{ education.description }}</p>
            <a v-if="education.url" :href="education.url" target="_blank" rel="noopener noreferrer" class="text-link">{{ t('about.viewSchool') }} <i class="bi bi-arrow-up-right" /></a>
          </div>
        </article>
      </div>
      <div v-else class="empty-state"><i class="bi bi-mortarboard" /><p>{{ t('about.noEducation') }}</p></div>
    </section>
  </div>
</template>

<style scoped>
.timeline-card__identity{display:flex;align-items:center;gap:.85rem;min-width:0}
.timeline-card__identity>img{width:48px;height:48px;flex:none;object-fit:contain;padding:.35rem;border:1px solid var(--line);border-radius:10px;background:var(--bg)}
.timeline-card__identity>div{min-width:0}
</style>
