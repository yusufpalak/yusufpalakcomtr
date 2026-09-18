<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin', i18n: false })

type MediaRecord = {
  id: string
  filename: string
  mimeType: string
  size: number
  altText: string | null
  width: number | null
  height: number | null
  createdAt: string
  url: string
}

const { data, refresh, status, error } = await useFetch<{ success: true, data: MediaRecord[] }>('/api/admin/media')
const records = computed(() => data.value?.data || [])
const search = ref('')
const filtered = computed(() => records.value.filter(item => `${item.filename} ${item.altText || ''}`.toLocaleLowerCase('tr').includes(search.value.trim().toLocaleLowerCase('tr'))))
const selectedFile = ref<File | null>(null)
const altText = ref('')
const uploading = ref(false)
const deleting = ref(false)
const deleteTarget = ref<MediaRecord | null>(null)
const feedback = ref<{ type: 'success' | 'error', text: string } | null>(null)

function chooseFile(event: Event) {
  selectedFile.value = (event.target as HTMLInputElement).files?.[0] || null
}

function dropFile(event: DragEvent) {
  selectedFile.value = event.dataTransfer?.files?.[0] || null
}

function errorText(value: unknown) {
  if (!value || typeof value !== 'object' || !('data' in value)) return 'İşlem tamamlanamadı. Tekrar deneyin.'
  const body = (value as { data?: { statusMessage?: string, error?: { message?: string, fields?: Record<string, string[]> } } }).data
  return Object.values(body?.error?.fields || {}).flat().find(Boolean) || body?.error?.message || body?.statusMessage || 'İşlem tamamlanamadı. Tekrar deneyin.'
}

async function upload() {
  if (!selectedFile.value) return
  uploading.value = true
  feedback.value = null
  try {
    const body = new FormData()
    body.append('file', selectedFile.value)
    body.append('altText', altText.value)
    await $fetch('/api/admin/media', { method: 'POST', body })
    selectedFile.value = null
    altText.value = ''
    await refresh()
    feedback.value = { type: 'success', text: 'Dosya yüklendi. İçerik düzenleme ekranındaki medya alanından seçebilirsiniz.' }
  }
  catch (uploadError) { feedback.value = { type: 'error', text: errorText(uploadError) } }
  finally { uploading.value = false }
}

async function remove() {
  if (!deleteTarget.value) return
  deleting.value = true
  feedback.value = null
  try {
    await $fetch(`/api/admin/media/${deleteTarget.value.id}`, { method: 'DELETE' })
    deleteTarget.value = null
    await refresh()
    feedback.value = { type: 'success', text: 'Dosya silindi.' }
  }
  catch (deleteError) { feedback.value = { type: 'error', text: errorText(deleteError) }; deleteTarget.value = null }
  finally { deleting.value = false }
}

function fileSize(size: number) { return `${(size / 1024 / 1024).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} MB` }
</script>

<template>
  <div>
    <header class="admin-page-header"><div><p class="admin-kicker">DOSYA YÖNETİMİ</p><h1>Medya kütüphanesi</h1><p>Görsel ve PDF yükleyin; ardından proje, blog veya sertifika düzenleme ekranında seçin.</p></div></header>
    <p v-if="feedback" :class="['admin-feedback', `is-${feedback.type}`]" :role="feedback.type === 'error' ? 'alert' : 'status'"><i :class="feedback.type === 'error' ? 'bi bi-exclamation-circle' : 'bi bi-check-circle'" />{{ feedback.text }}</p>
    <section class="admin-panel admin-media-upload" aria-labelledby="media-upload-heading">
      <div class="admin-panel__heading"><div><p class="admin-kicker">YENİ DOSYA</p><h2 id="media-upload-heading">Dosya yükle</h2></div><span class="admin-record-count">Görsel en fazla 8 MB · PDF en fazla 12 MB</span></div>
      <form @submit.prevent="upload">
        <div class="admin-upload-zone" @dragover.prevent @drop.prevent="dropFile"><span><i class="bi bi-cloud-arrow-up" /></span><h3>{{ selectedFile?.name || 'Dosyayı buraya bırakın' }}</h3><p>JPG, PNG, WebP veya AVIF güvenli WebP biçimine dönüştürülür. PDF indirme olarak sunulur.</p><label class="admin-secondary-button" for="media-file">Dosya seç</label><input id="media-file" type="file" accept="image/jpeg,image/png,image/webp,image/avif,application/pdf" class="sr-only" @change="chooseFile"></div>
        <div class="admin-media-upload__footer"><label>Alternatif metin <small>Görselin ne gösterdiğini kısaca anlatın.</small><input v-model="altText" maxlength="240" placeholder="Örn. Artemis Halı proje ekranı"></label><button class="admin-primary-button" :disabled="!selectedFile || uploading"><i :class="uploading ? 'bi bi-arrow-repeat admin-spin' : 'bi bi-cloud-arrow-up'" />{{ uploading ? 'Yükleniyor…' : 'Dosyayı yükle' }}</button></div>
      </form>
    </section>
    <section class="admin-panel admin-media-library" aria-labelledby="media-library-heading"><div class="admin-panel__toolbar"><div><h2 id="media-library-heading">Yüklenen dosyalar</h2><small>Dosyalar herkese açık bağlantı üzerinden erişilebilir.</small></div><label class="admin-search"><i class="bi bi-search" /><input v-model="search" aria-label="Medya dosyalarında ara" placeholder="Dosyalarda ara…"></label></div>
      <div v-if="status === 'pending'" class="admin-empty"><i class="bi bi-arrow-repeat admin-spin" /><p>Dosyalar yükleniyor…</p></div>
      <div v-else-if="error" class="admin-empty"><i class="bi bi-exclamation-circle" /><h3>Dosyalar yüklenemedi</h3><button class="admin-secondary-button" @click="refresh()">Tekrar dene</button></div>
      <div v-else-if="filtered.length" class="admin-media-grid"><article v-for="item in filtered" :key="item.id" class="admin-media-card"><div class="admin-media-card__preview"><img v-if="item.mimeType.startsWith('image/')" :src="item.url" :alt="item.altText || item.filename" loading="lazy"><i v-else class="bi bi-file-earmark-pdf" /></div><div class="admin-media-card__body"><strong :title="item.filename">{{ item.filename }}</strong><small>{{ item.mimeType === 'application/pdf' ? 'PDF' : `${item.width || '—'} × ${item.height || '—'}` }} · {{ fileSize(item.size) }}</small><div><a :href="item.url" target="_blank" rel="noopener noreferrer" class="admin-secondary-button"><i class="bi bi-box-arrow-up-right" /> Aç</a><button class="admin-secondary-button is-danger-text" :aria-label="`${item.filename} dosyasını sil`" @click="deleteTarget = item"><i class="bi bi-trash3" /> Sil</button></div></div></article></div>
      <div v-else class="admin-empty"><span class="admin-empty__icon"><i class="bi bi-images" /></span><h3>{{ search ? 'Eşleşen dosya yok' : 'Henüz dosya yüklenmedi' }}</h3><p>{{ search ? 'Başka bir dosya adı deneyin.' : 'İlk görselinizi veya PDF dosyanızı üstteki alandan yükleyin.' }}</p></div>
    </section>
    <div v-if="deleteTarget" class="admin-dialog-backdrop" @click.self="deleteTarget = null"><section class="admin-dialog" role="alertdialog" aria-modal="true" aria-labelledby="media-delete-title"><span class="admin-dialog__icon"><i class="bi bi-trash3" /></span><h2 id="media-delete-title">Dosya silinsin mi?</h2><p><strong>{{ deleteTarget.filename }}</strong> silinecek. Bir içerikte kullanılıyorsa silme işlemi engellenir.</p><div><button class="admin-secondary-button" :disabled="deleting" @click="deleteTarget = null">Vazgeç</button><button class="admin-danger-button" :disabled="deleting" @click="remove"><i :class="deleting ? 'bi bi-arrow-repeat admin-spin' : 'bi bi-trash3'" />{{ deleting ? 'Siliniyor…' : 'Evet, sil' }}</button></div></section></div>
  </div>
</template>
