<script setup lang="ts">
import { socialIcon } from '#shared/utils/social-icons'

definePageMeta({ layout: 'admin', middleware: 'admin', i18n: false })

type SocialLink = {
  id: string
  label: string
  platform: string | null
  url: string
  username: string | null
  iconOverride: string | null
  description: string | null
  isActive: boolean
  showHome: boolean
  showContact: boolean
  showFooter: boolean
  sortOrder: number
}

const emptyForm = () => ({
  label: '',
  platform: '',
  url: '',
  username: '',
  iconOverride: '',
  description: '',
  isActive: true,
  showHome: true,
  showContact: true,
  showFooter: true,
  sortOrder: 0,
})

const form = reactive(emptyForm())
const { data, refresh, status } = await useFetch('/api/admin/social-links')
const links = computed(() => (data.value?.data || []) as SocialLink[])
const query = ref('')
const filteredLinks = computed(() => {
  const needle = query.value.trim().toLocaleLowerCase('tr')
  if (!needle) return links.value
  return links.value.filter(link => `${link.label} ${link.platform || ''} ${link.username || ''} ${link.url}`.toLocaleLowerCase('tr').includes(needle))
})

const showForm = ref(false)
const editingId = ref<string | null>(null)
const deleteTarget = ref<SocialLink | null>(null)
const saving = ref(false)
const deleting = ref(false)
const feedback = ref<{ type: 'success' | 'error', text: string } | null>(null)

function resetForm() {
  Object.assign(form, emptyForm())
  editingId.value = null
  showForm.value = false
}

function openNew() {
  Object.assign(form, emptyForm())
  editingId.value = null
  feedback.value = null
  showForm.value = true
}

function editLink(link: SocialLink) {
  Object.assign(form, {
    label: link.label,
    platform: link.platform || '',
    url: link.url,
    username: link.username || '',
    iconOverride: link.iconOverride || '',
    description: link.description || '',
    isActive: link.isActive,
    showHome: link.showHome,
    showContact: link.showContact,
    showFooter: link.showFooter,
    sortOrder: link.sortOrder,
  })
  editingId.value = link.id
  feedback.value = null
  showForm.value = true
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function payload() {
  return {
    label: form.label,
    platform: form.platform.trim() || undefined,
    url: form.url,
    username: form.username.trim() || undefined,
    iconOverride: form.iconOverride.trim() || undefined,
    description: form.description.trim() || undefined,
    isActive: form.isActive,
    showHome: form.showHome,
    showContact: form.showContact,
    showFooter: form.showFooter,
    sortOrder: form.sortOrder,
  }
}

async function save() {
  saving.value = true
  feedback.value = null
  const wasEditing = Boolean(editingId.value)
  try {
    await $fetch(editingId.value ? `/api/admin/social-links/${editingId.value}` : '/api/admin/social-links', {
      method: editingId.value ? 'PUT' : 'POST',
      body: payload(),
    })
    resetForm()
    await refresh()
    feedback.value = { type: 'success', text: wasEditing ? 'Bağlantı güncellendi.' : 'Bağlantı eklendi.' }
  }
  catch {
    feedback.value = { type: 'error', text: 'Bağlantı kaydedilemedi. Alanları kontrol edip tekrar deneyin.' }
  }
  finally {
    saving.value = false
  }
}

async function deleteLink() {
  if (!deleteTarget.value) return
  deleting.value = true
  feedback.value = null
  try {
    await $fetch(`/api/admin/social-links/${deleteTarget.value.id}`, { method: 'DELETE' })
    if (editingId.value === deleteTarget.value.id) resetForm()
    deleteTarget.value = null
    await refresh()
    feedback.value = { type: 'success', text: 'Bağlantı silindi.' }
  }
  catch {
    feedback.value = { type: 'error', text: 'Bağlantı silinemedi. Lütfen tekrar deneyin.' }
  }
  finally {
    deleting.value = false
  }
}
</script>

<template>
  <div>
    <header class="admin-page-header">
      <div>
        <p class="admin-kicker">BAĞLANTILAR</p>
        <h1>Sosyal medya</h1>
        <p>Public sayfalarda gösterilen sosyal profilleri ve bağlantıları yönetin.</p>
      </div>
      <button class="admin-primary-button" @click="showForm ? resetForm() : openNew()">
        <i :class="showForm ? 'bi bi-x-lg' : 'bi bi-plus-lg'" />
        {{ showForm ? 'Formu kapat' : 'Yeni bağlantı' }}
      </button>
    </header>

    <p v-if="feedback" :class="['admin-feedback', `is-${feedback.type}`]" :role="feedback.type === 'error' ? 'alert' : 'status'">
      <i :class="feedback.type === 'error' ? 'bi bi-exclamation-circle' : 'bi bi-check-circle'" />
      {{ feedback.text }}
    </p>

    <form v-if="showForm" class="admin-panel admin-form-panel" @submit.prevent="save">
      <div class="admin-panel__heading">
        <div>
          <p class="admin-kicker">{{ editingId ? 'KAYDI DÜZENLE' : 'YENİ KAYIT' }}</p>
          <h2>{{ editingId ? 'Sosyal bağlantıyı güncelle' : 'Sosyal bağlantı ekle' }}</h2>
        </div>
        <span class="admin-icon-preview"><i :class="socialIcon(form.platform, form.url, form.iconOverride)" /></span>
      </div>
      <div class="admin-form-grid">
        <label>Görünen ad<input v-model="form.label" required minlength="2" placeholder="GitHub"></label>
        <label>Platform<input v-model="form.platform" placeholder="github"></label>
        <label class="admin-form-wide">Bağlantı adresi<input v-model="form.url" required placeholder="https://github.com/kullanici"></label>
        <label>Kullanıcı adı<input v-model="form.username" placeholder="@kullanici"></label>
        <label>Gösterim sırası<input v-model.number="form.sortOrder" type="number" min="0"></label>
        <label class="admin-form-wide">Kısa açıklama<textarea v-model="form.description" rows="3" maxlength="240" placeholder="Bu profil hakkında kısa bir açıklama…" /></label>
        <label class="admin-form-wide">Özel ikon sınıfı <small>İsteğe bağlı, örnek: bi bi-github</small><input v-model="form.iconOverride" placeholder="bi bi-github" pattern="bi bi-[a-z0-9-]+"></label>
        <div class="admin-check-grid admin-form-wide">
          <label><input v-model="form.showHome" type="checkbox"> Ana sayfa</label>
          <label><input v-model="form.showContact" type="checkbox"> İletişim</label>
          <label><input v-model="form.showFooter" type="checkbox"> Footer</label>
          <label><input v-model="form.isActive" type="checkbox"> Aktif</label>
        </div>
      </div>
      <div class="admin-form-actions">
        <button type="button" class="admin-secondary-button" @click="resetForm">Vazgeç</button>
        <button class="admin-primary-button" :disabled="saving">
          <i :class="saving ? 'bi bi-arrow-repeat admin-spin' : 'bi bi-check2'" />
          {{ saving ? 'Kaydediliyor…' : editingId ? 'Değişiklikleri kaydet' : 'Bağlantıyı kaydet' }}
        </button>
      </div>
    </form>

    <section class="admin-panel">
      <div class="admin-panel__toolbar">
        <label class="admin-search"><i class="bi bi-search" /><input v-model="query" aria-label="Sosyal bağlantılarda ara" placeholder="Bağlantılarda ara…"></label>
        <span class="admin-record-count">{{ filteredLinks.length }} bağlantı</span>
      </div>
      <div v-if="status === 'pending'" class="admin-empty"><i class="bi bi-arrow-repeat admin-spin" /><p>Bağlantılar yükleniyor…</p></div>
      <div v-else-if="filteredLinks.length" class="admin-table-wrap">
        <table class="admin-data-table admin-social-table">
          <thead><tr><th>Platform</th><th>Bağlantı</th><th>Durum</th><th>Gösterim</th><th><span class="sr-only">İşlemler</span></th></tr></thead>
          <tbody>
            <tr v-for="link in filteredLinks" :key="link.id">
              <td><span class="admin-row-icon"><i :class="socialIcon(link.platform || '', link.url, link.iconOverride || '')" /></span><div><strong>{{ link.label }}</strong><small>{{ link.username || link.platform || 'Bağlantı' }}</small></div></td>
              <td><a :href="link.url" target="_blank" rel="noopener noreferrer" class="admin-url">{{ link.url }}</a></td>
              <td><span :class="['admin-status', { 'is-passive': !link.isActive }]"><i />{{ link.isActive ? 'Aktif' : 'Pasif' }}</span></td>
              <td>{{ [link.showHome && 'Ana sayfa', link.showContact && 'İletişim', link.showFooter && 'Footer'].filter(Boolean).join(', ') || 'Gösterilmiyor' }}</td>
              <td><div class="admin-row-actions"><button type="button" :aria-label="`${link.label} bağlantısını düzenle`" title="Düzenle" @click="editLink(link)"><i class="bi bi-pencil" /></button><button type="button" class="is-danger" :aria-label="`${link.label} bağlantısını sil`" title="Sil" @click="deleteTarget = link"><i class="bi bi-trash3" /></button></div></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="admin-empty"><span class="admin-empty__icon"><i class="bi bi-share" /></span><h2>{{ query ? 'Aramanızla eşleşen bağlantı yok' : 'Henüz bağlantı eklenmedi' }}</h2><p>{{ query ? 'Farklı bir arama ifadesi deneyin.' : 'İlk sosyal medya bağlantınızı eklemek için yukarıdaki butonu kullanın.' }}</p></div>
    </section>

    <div v-if="deleteTarget" class="admin-dialog-backdrop" @click.self="deleteTarget = null">
      <section class="admin-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-social-title">
        <span class="admin-dialog__icon"><i class="bi bi-trash3" /></span>
        <h2 id="delete-social-title">Bağlantı silinsin mi?</h2>
        <p><strong>{{ deleteTarget.label }}</strong> kalıcı olarak silinecek ve public sayfalardan kaldırılacak.</p>
        <div><button class="admin-secondary-button" :disabled="deleting" @click="deleteTarget = null">Vazgeç</button><button class="admin-danger-button" :disabled="deleting" @click="deleteLink"><i :class="deleting ? 'bi bi-arrow-repeat admin-spin' : 'bi bi-trash3'" /> {{ deleting ? 'Siliniyor…' : 'Evet, sil' }}</button></div>
      </section>
    </div>
  </div>
</template>
