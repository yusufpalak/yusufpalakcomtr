<script setup lang="ts">
const { locale, t } = useI18n()
const { data: contentResponse } = await usePublicContent()
const certificates = computed(() => contentResponse.value?.data.certificates || [])

function formatDate(value: string | null) {
  if (!value) return null
  return new Intl.DateTimeFormat(locale.value === 'tr' ? 'tr-TR' : 'en-US', { month: 'long', year: 'numeric' }).format(new Date(value))
}

useSeoMeta({ title: () => t('certificates.seoTitle'), description: () => t('certificates.seoDescription') })
</script>

<template>
  <div class="container page-top">
    <div class="page-intro"><p class="eyebrow">{{ t('certificates.eyebrow') }}</p><h1>{{ t('certificates.title') }}</h1><p>{{ t('certificates.intro') }}</p></div>
    <div v-if="certificates.length" class="certificate-grid">
      <article v-for="certificate in certificates" :key="certificate.id" class="certificate-card">
        <img v-if="certificate.imageUrl" :src="certificate.imageUrl" :alt="t('certificates.imageAlt', { name: certificate.name })">
        <div v-else class="certificate-card__icon"><i class="bi bi-award" /></div>
        <div class="certificate-card__body">
          <div><span v-if="certificate.category" class="tag">{{ certificate.category }}</span><span class="certificate-card__issuer">{{ certificate.issuer }}</span></div>
          <h2>{{ certificate.name }}</h2>
          <p v-if="certificate.description">{{ certificate.description }}</p>
          <dl>
            <template v-if="certificate.issuedAt"><dt>{{ t('certificates.issuedAt') }}</dt><dd>{{ formatDate(certificate.issuedAt) }}</dd></template>
            <template v-if="certificate.neverExpires || certificate.expiresAt"><dt>{{ t('certificates.validity') }}</dt><dd>{{ certificate.neverExpires ? t('certificates.neverExpires') : formatDate(certificate.expiresAt) }}</dd></template>
            <template v-if="certificate.credentialId"><dt>{{ t('certificates.credentialId') }}</dt><dd>{{ certificate.credentialId }}</dd></template>
          </dl>
          <a v-if="certificate.verifyUrl" :href="certificate.verifyUrl" target="_blank" rel="noopener noreferrer" class="text-link">{{ t('certificates.verify') }} <i class="bi bi-arrow-up-right" /></a>
        </div>
      </article>
    </div>
    <div v-else class="empty-state"><i class="bi bi-award" /><h2>{{ t('certificates.emptyTitle') }}</h2><p>{{ t('certificates.emptyText') }}</p></div>
  </div>
</template>
