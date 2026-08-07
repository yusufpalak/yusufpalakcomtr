<script setup lang="ts">
import { blogLocalizedFieldKeys, blogLocalizedFields, getAdminContentForm, type AdminContentField } from '#shared/admin-content'
import { defaultLocale, supportedLocales, type SupportedLocale } from '#shared/i18n/locales'
import type { BlogTranslation } from '#shared/types/blog-translations'
import { getAdminModule } from '~/utils/admin-modules'

definePageMeta({ layout: 'admin', middleware: 'admin', i18n: false })

type AdminRecord = {
  id: string
  title: string
  subtitle: string
  status: string
  updatedAt: string
  data: Record<string, unknown>
  publicUrl?: string
}

type AdminFormValue = string | string[] | number | boolean | null
type BlogTranslationForm = Record<string, AdminFormValue>

const route = useRoute()
const moduleSlug = String(route.params.module)
const resolvedModuleInfo = getAdminModule(moduleSlug)
const resolvedFormConfig = getAdminContentForm(moduleSlug)
if (!resolvedModuleInfo || !resolvedFormConfig) throw createError({ statusCode: 404, statusMessage: 'İçerik modülü bulunamadı' })
const moduleInfo = resolvedModuleInfo
const formConfig = resolvedFormConfig
const hasRelationFields = formConfig.fields.some(field => field.type === 'relation' || field.type === 'relation-multiple')
const { data: relationResponse } = await useFetch(`/api/admin/content-options/${moduleSlug}`, { immediate: hasRelationFields })
const relationOptions = computed(() => (relationResponse.value?.data || {}) as Record<string, Array<{ label: string, value: string }>>)
const formFields = computed(() => formConfig.fields.map(field => (field.type === 'relation' || field.type === 'relation-multiple') ? { ...field, options: relationOptions.value[field.key] || [] } : field))
const isBlogModule = moduleSlug === 'blog-posts'
const blogCommonFields = computed(() => formFields.value.filter(field => !blogLocalizedFieldKeys.includes(field.key)))

const { data, refresh, status } = await useFetch(`/api/admin/content/${moduleSlug}`)
const records = computed(() => (data.value?.data || []) as AdminRecord[])
const query = ref('')
const filteredRecords = computed(() => {
  const needle = query.value.trim().toLocaleLowerCase('tr')
  if (!needle) return records.value
  return records.value.filter(record => `${record.title} ${record.subtitle} ${record.status}`.toLocaleLowerCase('tr').includes(needle))
})

const form = reactive<Record<string, AdminFormValue>>({})
const activeBlogLocale = ref<SupportedLocale>(defaultLocale)
const initialBlogTranslations = supportedLocales.reduce<Record<SupportedLocale, BlogTranslationForm>>((translations, locale) => {
  translations[locale.code] = { enabled: locale.code === defaultLocale }
  return translations
}, {} as Record<SupportedLocale, BlogTranslationForm>)
const blogTranslations = reactive(initialBlogTranslations)
const editingId = ref<string | null>(null)
const showForm = ref(false)
const saving = ref(false)
const translatingLocale = ref<SupportedLocale | null>(null)
const deleteTarget = ref<AdminRecord | null>(null)
const deleting = ref(false)
const feedback = ref<{ type: 'success' | 'error', text: string } | null>(null)

function fieldDefault(field: AdminContentField) {
  if (field.default !== undefined) return field.default
  if (field.type === 'relation-multiple') return []
  if (field.type === 'checkbox') return false
  if (field.type === 'number') return null
  return ''
}

function editValue(field: AdminContentField, value: unknown) {
  if (value === null || value === undefined) return fieldDefault(field)
  if (field.type === 'relation-multiple') return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
  if (field.type === 'json' && typeof value !== 'string') return JSON.stringify(value, null, 2)
  if (field.type === 'date' && typeof value === 'string') return value.slice(0, 10)
  if (field.type === 'datetime' && typeof value === 'string') return value.slice(0, 16)
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value
  return String(value)
}

function freshBlogTranslation(locale: SupportedLocale): BlogTranslationForm {
  const draft: BlogTranslationForm = { enabled: locale === defaultLocale }
  for (const field of blogLocalizedFields) draft[field.key] = fieldDefault(field)
  return draft
}

function resetBlogTranslations() {
  for (const locale of supportedLocales) blogTranslations[locale.code] = freshBlogTranslation(locale.code)
  activeBlogLocale.value = defaultLocale
}

function resetFormValues() {
  for (const field of formFields.value) form[field.key] = fieldDefault(field)
  if (isBlogModule) resetBlogTranslations()
}

function openNew() {
  resetFormValues()
  editingId.value = null
  feedback.value = null
  showForm.value = true
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function openEdit(record: AdminRecord) {
  for (const field of formFields.value) form[field.key] = editValue(field, record.data[field.key])
  if (isBlogModule) {
    const translations = record.data.translations && typeof record.data.translations === 'object' && !Array.isArray(record.data.translations)
      ? record.data.translations as Record<string, unknown>
      : {}
    for (const locale of supportedLocales) {
      const source = translations[locale.code] && typeof translations[locale.code] === 'object' && !Array.isArray(translations[locale.code])
        ? translations[locale.code] as Record<string, unknown>
        : {}
      const draft = freshBlogTranslation(locale.code)
      draft.enabled = locale.code === defaultLocale || source.enabled === true
      for (const field of blogLocalizedFields) draft[field.key] = editValue(field, source[field.key])
      blogTranslations[locale.code] = draft
    }
    activeBlogLocale.value = defaultLocale
  }
  editingId.value = record.id
  feedback.value = null
  showForm.value = true
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function closeForm() {
  showForm.value = false
  editingId.value = null
  resetFormValues()
}

function apiErrorText(error: unknown) {
  if (!error || typeof error !== 'object' || !('data' in error)) return 'İşlem tamamlanamadı. Alanları kontrol edip tekrar deneyin.'
  const body = (error as { data?: { statusMessage?: string, message?: string, error?: { message?: string, fields?: Record<string, string[]> } } }).data
  const fieldError = body?.error?.fields && Object.values(body.error.fields).flat().find(Boolean)
  return fieldError || body?.error?.message || body?.statusMessage || body?.message || 'İşlem tamamlanamadı. Alanları kontrol edip tekrar deneyin.'
}

async function save() {
  if (isBlogModule) {
    const invalidLocale = supportedLocales.find(locale => blogTranslations[locale.code].enabled === true && blogLocalizedFields.some(field => field.required && !String(blogTranslations[locale.code][field.key] ?? '').trim()))
    if (invalidLocale) {
      activeBlogLocale.value = invalidLocale.code
      feedback.value = { type: 'error', text: `${invalidLocale.name} sürümündeki zorunlu alanları doldurun.` }
      return
    }
  }
  saving.value = true
  feedback.value = null
  const wasEditing = Boolean(editingId.value)
  try {
    const body: Record<string, unknown> = { ...form }
    if (isBlogModule) {
      for (const field of blogLocalizedFields) body[field.key] = blogTranslations[defaultLocale][field.key]
      body.translations = Object.fromEntries(supportedLocales.map(locale => [locale.code, { ...blogTranslations[locale.code] }]))
    }
    if (editingId.value) await $fetch(`/api/admin/content/${moduleSlug}/${editingId.value}`, { method: 'PUT', body })
    else await $fetch(`/api/admin/content/${moduleSlug}`, { method: 'POST', body })
    closeForm()
    await refresh()
    clearNuxtData(key => key.startsWith('public-'))
    feedback.value = { type: 'success', text: wasEditing ? `${formConfig.singular} güncellendi.` : `${formConfig.singular} eklendi.` }
  }
  catch (error) {
    feedback.value = { type: 'error', text: apiErrorText(error) }
  }
  finally {
    saving.value = false
  }
}

async function deleteRecord() {
  if (!deleteTarget.value) return
  deleting.value = true
  feedback.value = null
  try {
    await $fetch(`/api/admin/content/${moduleSlug}/${deleteTarget.value.id}`, { method: 'DELETE' })
    if (editingId.value === deleteTarget.value.id) closeForm()
    deleteTarget.value = null
    await refresh()
    clearNuxtData(key => key.startsWith('public-'))
    feedback.value = { type: 'success', text: `${formConfig.singular} silindi.` }
  }
  catch (error) {
    feedback.value = { type: 'error', text: apiErrorText(error) }
  }
  finally {
    deleting.value = false
  }
}

const formatDate = (value: string) => new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
const detailHref = (record: AdminRecord) => `/admin/content/${moduleSlug}/${record.id}`

function translatedLocales(record: AdminRecord) {
  if (!isBlogModule || !record.data.translations || typeof record.data.translations !== 'object' || Array.isArray(record.data.translations)) return []
  const translations = record.data.translations as Record<string, unknown>
  return supportedLocales.filter((locale) => {
    const value = translations[locale.code]
    return value && typeof value === 'object' && !Array.isArray(value) && (value as Record<string, unknown>).enabled === true
  })
}

function translationState(locale: SupportedLocale) {
  const translation = blogTranslations[locale]
  if (translation.enabled !== true) return 'Kapalı'
  return blogLocalizedFields.some(field => field.required && !String(translation[field.key] ?? '').trim()) ? 'Eksik' : 'Hazır'
}

function defaultTranslationReady() {
  return !blogLocalizedFields.some(field => field.required && !String(blogTranslations[defaultLocale][field.key] ?? '').trim())
}

function targetHasWrittenContent(locale: SupportedLocale) {
  return ['title', 'slug', 'excerpt', 'content', 'seoTitle', 'seoDescription'].some(key => String(blogTranslations[locale][key] ?? '').trim())
}

async function translateBlogLocale(targetLocale: SupportedLocale) {
  if (targetLocale === defaultLocale || translatingLocale.value) return
  if (!defaultTranslationReady()) {
    activeBlogLocale.value = defaultLocale
    feedback.value = { type: 'error', text: 'Önce Türkçe sürümdeki zorunlu alanları doldurun.' }
    return
  }
  if (targetHasWrittenContent(targetLocale) && !window.confirm('Bu dildeki mevcut alanlar LibreTranslate sonucu ile değiştirilecek. Devam edilsin mi?')) return

  translatingLocale.value = targetLocale
  feedback.value = null
  try {
    const response = await $fetch<{ success: true, data: BlogTranslation }>('/api/admin/blog-translations/translate', {
      method: 'POST',
      body: {
        sourceLocale: defaultLocale,
        targetLocale,
        source: Object.fromEntries(blogLocalizedFields.map(field => [field.key, blogTranslations[defaultLocale][field.key]])),
      },
    })
    blogTranslations[targetLocale].enabled = true
    for (const field of blogLocalizedFields) blogTranslations[targetLocale][field.key] = editValue(field, response.data[field.key as keyof BlogTranslation])
    activeBlogLocale.value = targetLocale
    const localeName = supportedLocales.find(locale => locale.code === targetLocale)?.name || targetLocale.toLocaleUpperCase('tr-TR')
    feedback.value = { type: 'success', text: `${localeName} çevirisi hazırlandı. Kontrol edip kaydetmeyi unutmayın.` }
  }
  catch (error) {
    feedback.value = { type: 'error', text: apiErrorText(error) }
  }
  finally {
    translatingLocale.value = null
  }
}

const { data: heroResponse, refresh: refreshHero } = await useFetch('/api/admin/hero-image', { immediate: moduleSlug === 'homepage' })
const hero = computed(() => heroResponse.value?.data || null)
const heroFile = ref<File | null>(null)
const heroPreview = ref('')
const heroAlt = ref('Yusuf Palak portre görseli')
const heroUploading = ref(false)
const heroRemoving = ref(false)

function chooseHero(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (heroPreview.value) URL.revokeObjectURL(heroPreview.value)
  heroFile.value = file
  heroPreview.value = URL.createObjectURL(file)
}

async function uploadHero() {
  if (!heroFile.value) return
  heroUploading.value = true
  feedback.value = null
  try {
    const body = new FormData()
    body.append('file', heroFile.value)
    body.append('altText', heroAlt.value)
    await $fetch('/api/admin/hero-image', { method: 'POST', body })
    await refreshHero()
    clearNuxtData(key => key.startsWith('public-'))
    if (heroPreview.value) URL.revokeObjectURL(heroPreview.value)
    heroPreview.value = ''
    heroFile.value = null
    feedback.value = { type: 'success', text: 'Hero görseli güncellendi.' }
  }
  catch (error) {
    feedback.value = { type: 'error', text: apiErrorText(error) }
  }
  finally {
    heroUploading.value = false
  }
}

async function removeHero() {
  heroRemoving.value = true
  feedback.value = null
  try {
    await $fetch('/api/admin/hero-image', { method: 'DELETE' })
    await refreshHero()
    clearNuxtData(key => key.startsWith('public-'))
    feedback.value = { type: 'success', text: 'Hero görseli kaldırıldı; YP monogramı yeniden gösteriliyor.' }
  }
  catch (error) {
    feedback.value = { type: 'error', text: apiErrorText(error) }
  }
  finally {
    heroRemoving.value = false
  }
}

onMounted(() => {
  resetFormValues()
  const editId = typeof route.query.edit === 'string' ? route.query.edit : undefined
  const record = records.value.find(item => item.id === editId)
  if (record) openEdit(record)
})
onBeforeUnmount(() => { if (heroPreview.value) URL.revokeObjectURL(heroPreview.value) })
</script>

<template>
  <div>
    <nav class="admin-breadcrumb" aria-label="Sayfa yolu"><NuxtLink to="/admin/content">İçerik yönetimi</NuxtLink><i class="bi bi-chevron-right" /><span>{{ moduleInfo!.label }}</span></nav>
    <header class="admin-page-header admin-page-header--compact">
      <div class="admin-module-heading"><span class="admin-module-card__icon" :style="{ '--module-color': moduleInfo!.color }"><i :class="`bi ${moduleInfo!.icon}`" /></span><div><p class="admin-kicker">{{ moduleInfo!.group }}</p><h1>{{ moduleInfo!.label }}</h1><p>{{ moduleInfo!.description }}</p></div></div>
      <div class="admin-header-actions"><NuxtLink v-if="moduleSlug === 'site-settings'" to="/admin/settings" class="admin-secondary-button"><i class="bi bi-sliders2" /> Genel ayarlar</NuxtLink><button class="admin-primary-button" @click="showForm ? closeForm() : openNew()"><i :class="showForm ? 'bi bi-x-lg' : 'bi bi-plus-lg'" />{{ showForm ? 'Formu kapat' : `${formConfig.singular} ekle` }}</button></div>
    </header>

    <p v-if="feedback" :class="['admin-feedback', `is-${feedback.type}`]" :role="feedback.type === 'error' ? 'alert' : 'status'"><i :class="feedback.type === 'error' ? 'bi bi-exclamation-circle' : 'bi bi-check-circle'" />{{ feedback.text }}</p>

    <section v-if="moduleSlug === 'homepage'" class="admin-panel admin-hero-manager">
      <div class="admin-panel__heading"><div><p class="admin-kicker">HERO GÖRSELİ</p><h2>Anasayfa portresi</h2></div><span class="admin-record-count">JPG, PNG, WebP veya AVIF · en fazla 8 MB</span></div>
      <div class="admin-hero-manager__body">
        <div class="admin-hero-preview"><img v-if="heroPreview || hero?.url" :src="heroPreview || hero?.url" :alt="heroAlt"><span v-else>YP</span></div>
        <div class="admin-hero-controls">
          <h3>{{ hero ? 'Görseli değiştir' : 'Hero görseli yükle' }}</h3>
          <p>Portre oranlı görseller en iyi sonucu verir. Yüklenen dosya güvenli WebP biçimine dönüştürülür.</p>
          <label>Alternatif metin<input v-model="heroAlt" maxlength="240" placeholder="Yusuf Palak portre görseli"></label>
          <label class="admin-file-picker"><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" @change="chooseHero"><i class="bi bi-image" /> {{ heroFile?.name || 'Görsel seç' }}</label>
          <div><button class="admin-primary-button" :disabled="!heroFile || heroUploading" @click="uploadHero"><i :class="heroUploading ? 'bi bi-arrow-repeat admin-spin' : 'bi bi-cloud-arrow-up'" />{{ heroUploading ? 'Yükleniyor…' : 'Yükle ve kullan' }}</button><button v-if="hero" class="admin-secondary-button is-danger-text" :disabled="heroRemoving" @click="removeHero"><i class="bi bi-trash3" />{{ heroRemoving ? 'Kaldırılıyor…' : 'Görseli kaldır' }}</button></div>
        </div>
      </div>
    </section>

    <form v-if="showForm" class="admin-panel admin-form-panel" @submit.prevent="save">
      <div class="admin-panel__heading"><div><p class="admin-kicker">{{ editingId ? 'KAYDI DÜZENLE' : 'YENİ KAYIT' }}</p><h2>{{ editingId ? `${formConfig.singular} düzenle` : `${formConfig.singular} ekle` }}</h2></div></div>
      <template v-if="isBlogModule">
        <div class="admin-language-editor">
          <div class="admin-language-editor__intro"><div><p class="admin-kicker">DİL SÜRÜMLERİ</p><h3>Blog içeriği</h3><p>Her dilin başlık, slug, içerik ve SEO alanlarını ayrı yönetin.</p></div><span>{{ supportedLocales.length }} dil</span></div>
          <div class="admin-language-tabs" role="tablist" aria-label="Blog dilleri">
            <button v-for="locale in supportedLocales" :key="locale.code" type="button" role="tab" :aria-selected="activeBlogLocale === locale.code" :class="{ active: activeBlogLocale === locale.code }" @click="activeBlogLocale = locale.code">
              <strong>{{ locale.code.toLocaleUpperCase('tr-TR') }}</strong><span>{{ locale.name }}</span><small :class="`is-${translationState(locale.code).toLocaleLowerCase('tr-TR')}`">{{ translationState(locale.code) }}</small>
            </button>
          </div>
          <div class="admin-language-panel" role="tabpanel">
            <div class="admin-language-panel__heading">
              <div><strong>{{ supportedLocales.find(locale => locale.code === activeBlogLocale)?.name }}</strong><small>{{ activeBlogLocale === defaultLocale ? 'Ana içerik dili · kaldırılamaz' : 'Bu dil sürümünü dilediğiniz zaman açıp kapatabilirsiniz.' }}</small></div>
              <div v-if="activeBlogLocale !== defaultLocale" class="admin-language-panel__actions">
                <button type="button" class="admin-translate-button" :disabled="Boolean(translatingLocale) || !defaultTranslationReady()" :title="defaultTranslationReady() ? 'Türkçe sürümdeki alanları bu dile çevir' : 'Önce Türkçe zorunlu alanları doldurun'" @click="translateBlogLocale(activeBlogLocale)"><i :class="translatingLocale === activeBlogLocale ? 'bi bi-arrow-repeat admin-spin' : 'bi bi-stars'" />{{ translatingLocale === activeBlogLocale ? 'Çevriliyor…' : 'LibreTranslate ile çevir' }}</button>
                <label class="admin-translation-toggle"><input v-model="blogTranslations[activeBlogLocale].enabled" type="checkbox"><span>Bu dilde yayınla</span></label>
              </div>
              <span v-else class="admin-primary-locale"><i class="bi bi-check-circle" /> Ana dil</span>
            </div>
            <div v-if="blogTranslations[activeBlogLocale].enabled" class="admin-form-grid admin-form-grid--localized">
              <AdminContentField v-for="field in blogLocalizedFields" :key="`${activeBlogLocale}-${field.key}`" v-model="blogTranslations[activeBlogLocale][field.key]" :field="field" />
            </div>
            <div v-else class="admin-translation-empty"><i class="bi bi-translate" /><h4>{{ supportedLocales.find(locale => locale.code === activeBlogLocale)?.name }} sürümü kapalı</h4><p>“Bu dilde yayınla” seçeneğini açarak çeviriyi ekleyebilirsiniz.</p></div>
          </div>
        </div>
        <div class="admin-form-section-heading"><div><p class="admin-kicker">ORTAK AYARLAR</p><h3>Yayın ve sınıflandırma</h3></div><p>Bu alanlar bütün dil sürümlerinde ortaktır.</p></div>
        <div class="admin-form-grid admin-form-grid--common">
          <AdminContentField v-for="field in blogCommonFields" :key="field.key" v-model="form[field.key]" :field="field" />
        </div>
      </template>
      <div v-else class="admin-form-grid">
        <AdminContentField v-for="field in formFields" :key="field.key" v-model="form[field.key]" :field="field" />
      </div>
      <div class="admin-form-actions"><button type="button" class="admin-secondary-button" @click="closeForm">Vazgeç</button><button class="admin-primary-button" :disabled="saving"><i :class="saving ? 'bi bi-arrow-repeat admin-spin' : 'bi bi-check2'" />{{ saving ? 'Kaydediliyor…' : editingId ? 'Değişiklikleri kaydet' : 'Kaydı ekle' }}</button></div>
    </form>

    <section class="admin-panel">
      <div class="admin-panel__toolbar"><label class="admin-search"><i class="bi bi-search" /><input v-model="query" :aria-label="`${moduleInfo!.label} içinde ara`" placeholder="İçeriklerde ara…"></label><div class="admin-toolbar-info"><span><i class="bi bi-collection" /> {{ filteredRecords.length }} kayıt</span></div></div>
      <div v-if="status === 'pending'" class="admin-empty"><i class="bi bi-arrow-repeat admin-spin" /><p>Kayıtlar yükleniyor…</p></div>
      <div v-else-if="filteredRecords.length" class="admin-table-wrap"><table class="admin-data-table"><thead><tr><th>İçerik</th><th>Durum</th><th>Son güncelleme</th><th><span class="sr-only">İşlemler</span></th></tr></thead><tbody><tr v-for="record in filteredRecords" :key="record.id"><td><span class="admin-row-icon"><i :class="`bi ${moduleInfo!.icon}`" /></span><div><a :href="detailHref(record)" class="admin-content-title">{{ record.title }}</a><small>{{ record.subtitle || formConfig.singular }}</small><span v-if="isBlogModule" class="admin-record-locales"><b v-for="locale in translatedLocales(record)" :key="locale.code">{{ locale.code.toLocaleUpperCase('tr-TR') }}</b></span></div></td><td><span class="admin-status"><i />{{ record.status }}</span></td><td>{{ formatDate(record.updatedAt) }}</td><td><div class="admin-row-actions"><button type="button" :aria-label="`${record.title} kaydını düzenle`" title="Düzenle" @click="openEdit(record)"><i class="bi bi-pencil" /></button><a :href="detailHref(record)" :aria-label="`${record.title} detayına git`" title="Detay"><i class="bi bi-arrow-right" /></a><button type="button" class="is-danger" :aria-label="`${record.title} kaydını sil`" title="Sil" @click="deleteTarget = record"><i class="bi bi-trash3" /></button></div></td></tr></tbody></table></div>
      <div v-else class="admin-empty"><span class="admin-empty__icon"><i :class="`bi ${moduleInfo!.icon}`" /></span><h2>{{ query ? 'Aramanızla eşleşen kayıt yok' : `Henüz ${formConfig.singular} eklenmedi` }}</h2><p>{{ query ? 'Farklı bir arama ifadesi deneyin.' : 'İlk kaydı eklemek için üstteki ekle butonunu kullanın.' }}</p><button v-if="!query" class="admin-primary-button" @click="openNew"><i class="bi bi-plus-lg" /> İlk kaydı ekle</button></div>
    </section>

    <div v-if="deleteTarget" class="admin-dialog-backdrop" @click.self="deleteTarget = null"><section class="admin-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-content-title"><span class="admin-dialog__icon"><i class="bi bi-trash3" /></span><h2 id="delete-content-title">Kayıt silinsin mi?</h2><p><strong>{{ deleteTarget.title }}</strong> kalıcı olarak silinecek.</p><div><button class="admin-secondary-button" :disabled="deleting" @click="deleteTarget = null">Vazgeç</button><button class="admin-danger-button" :disabled="deleting" @click="deleteRecord"><i :class="deleting ? 'bi bi-arrow-repeat admin-spin' : 'bi bi-trash3'" />{{ deleting ? 'Siliniyor…' : 'Evet, sil' }}</button></div></section></div>
  </div>
</template>
