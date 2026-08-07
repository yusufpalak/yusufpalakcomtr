<script setup lang="ts">
import { socialIcon } from '#shared/utils/social-icons'

const props = withDefaults(defineProps<{
  location: 'home' | 'contact' | 'footer'
  compact?: boolean
}>(), { compact: false })

const { data } = await useFetch('/api/public/social-links')
const visibilityField = { home: 'showHome', contact: 'showContact', footer: 'showFooter' } as const
const links = computed(() => (data.value?.data || []).filter(link => link[visibilityField[props.location]]))
const isWebUrl = (url: string) => /^https?:\/\//i.test(url)
</script>

<template>
  <ul v-if="links.length" :class="['social-links', { 'social-links--compact': compact }]" :aria-label="location === 'footer' ? $t('a11y.socialLinks') : undefined">
    <li v-for="link in links" :key="link.id">
      <a :href="link.url" :target="isWebUrl(link.url) ? '_blank' : undefined" :rel="isWebUrl(link.url) ? 'noopener noreferrer' : undefined" :aria-label="compact ? link.label : undefined">
        <i :class="socialIcon(link.platform || '', link.url, link.iconOverride || '')" />
        <span v-if="!compact">{{ link.label }}</span>
      </a>
      <small v-if="!compact && (link.username || link.description)">{{ link.description || link.username }}</small>
    </li>
  </ul>
</template>
