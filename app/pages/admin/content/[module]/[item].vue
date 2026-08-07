<script setup lang="ts">
import { getAdminContentForm } from '#shared/admin-content'
import { getAdminModule } from '~/utils/admin-modules'

definePageMeta({ layout: 'admin', middleware: 'admin', i18n: false })

const route = useRoute()
const moduleSlug = String(route.params.module)
const itemId = String(route.params.item)
const moduleInfo = getAdminModule(moduleSlug)
const formConfig = getAdminContentForm(moduleSlug)
if (!moduleInfo || !formConfig) throw createError({ statusCode: 404, statusMessage: 'İçerik modülü bulunamadı' })

const { data } = await useFetch(`/api/admin/content/${moduleSlug}/${itemId}`)
const record = computed(() => data.value?.data)
if (!record.value) throw createError({ statusCode: 404, statusMessage: 'İçerik kaydı bulunamadı' })

function displayValue(value: unknown) {
  if (value === true) return 'Evet'
  if (value === false) return 'Hayır'
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long' }).format(new Date(value))
  return String(value)
}
</script>

<template>
  <div v-if="record">
    <nav class="admin-breadcrumb" aria-label="Sayfa yolu"><NuxtLink to="/admin/content">İçerik yönetimi</NuxtLink><i class="bi bi-chevron-right" /><NuxtLink :to="`/admin/content/${moduleSlug}`">{{ moduleInfo!.label }}</NuxtLink><i class="bi bi-chevron-right" /><span>{{ record.title }}</span></nav>
    <header class="admin-page-header admin-page-header--compact"><div class="admin-module-heading"><span class="admin-module-card__icon" :style="{ '--module-color': moduleInfo!.color }"><i :class="`bi ${moduleInfo!.icon}`" /></span><div><p class="admin-kicker">{{ moduleInfo!.label }}</p><h1>{{ record.title }}</h1><p>{{ record.subtitle || formConfig.singular }}</p></div></div><div class="admin-header-actions"><a v-if="record.publicUrl" :href="record.publicUrl" target="_blank" rel="noopener" class="admin-secondary-button"><i class="bi bi-box-arrow-up-right" /> Public sayfada görüntüle</a><NuxtLink :to="`/admin/content/${moduleSlug}?edit=${record.id}`" class="admin-primary-button"><i class="bi bi-pencil" /> Düzenle</NuxtLink></div></header>
    <div class="admin-detail-grid"><section class="admin-panel admin-detail-main"><div class="admin-panel__heading"><div><p class="admin-kicker">İÇERİK DETAYI</p><h2>Kayıt bilgileri</h2></div><span class="admin-status"><i />{{ record.status }}</span></div><div class="admin-content-preview"><dl class="admin-record-details"><template v-for="field in formConfig.fields" :key="field.key"><dt>{{ field.label }}</dt><dd><pre v-if="field.type === 'json' || field.type === 'textarea'">{{ displayValue(record.data[field.key]) }}</pre><template v-else>{{ displayValue(record.data[field.key]) }}</template></dd></template></dl></div></section><aside class="admin-panel admin-detail-meta"><div class="admin-panel__heading"><div><p class="admin-kicker">ÖZET</p><h2>Kayıt durumu</h2></div></div><dl><dt>Durum</dt><dd>{{ record.status }}</dd><dt>Son güncelleme</dt><dd>{{ new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(record.updatedAt)) }}</dd><dt>Kayıt kimliği</dt><dd>{{ record.id }}</dd></dl></aside></div>
  </div>
</template>
