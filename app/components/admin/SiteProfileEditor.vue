<script setup lang="ts">
type SettingRecord = { id: string, data: Record<string, unknown> }

const props = defineProps<{ record: SettingRecord | null, loading: boolean }>()
const emit = defineEmits<{ saved: [] }>()

const draft = reactive({ name: '', title: '', focus: [] as string[] })
const saving = ref(false)
const feedback = ref<{ type: 'success' | 'error', text: string } | null>(null)

watch(() => props.record, (record) => {
  const value = record?.data.value
  const profile = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
  draft.name = typeof profile.name === 'string' ? profile.name : ''
  draft.title = typeof profile.title === 'string' ? profile.title : ''
  draft.focus = Array.isArray(profile.focus) ? profile.focus.filter((item): item is string => typeof item === 'string') : []
}, { immediate: true })

function errorText(error: unknown) {
  if (!error || typeof error !== 'object' || !('data' in error)) return 'Kaydedilemedi. Alanları kontrol edip tekrar deneyin.'
  const body = (error as { data?: { statusMessage?: string, error?: { message?: string, fields?: Record<string, string[]> } } }).data
  return Object.values(body?.error?.fields || {}).flat().find(Boolean) || body?.error?.message || body?.statusMessage || 'Kaydedilemedi. Alanları kontrol edip tekrar deneyin.'
}

async function save() {
  saving.value = true
  feedback.value = null
  const body = {
    key: 'profile',
    value: JSON.stringify({
      name: draft.name.trim(),
      title: draft.title.trim(),
      focus: draft.focus.map(item => item.trim()).filter(Boolean),
    }),
  }
  try {
    if (props.record) await $fetch(`/api/admin/content/site-settings/${props.record.id}`, { method: 'PUT', body })
    else await $fetch('/api/admin/content/site-settings', { method: 'POST', body })
    clearNuxtData(key => key.startsWith('public-'))
    emit('saved')
    feedback.value = { type: 'success', text: 'Profil bilgileri kaydedildi. Değişiklikler sitede görünecek.' }
  }
  catch (error) {
    feedback.value = { type: 'error', text: errorText(error) }
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="admin-panel site-profile-card" aria-labelledby="site-profile-title">
    <div class="admin-panel__heading">
      <div><p class="admin-kicker">GÖRÜNEN KİMLİK</p><h2 id="site-profile-title">Profil bilgileri</h2></div>
      <span class="site-profile-card__badge"><i class="bi bi-eye" /> Sitede görünür</span>
    </div>
    <form class="site-profile-form" @submit.prevent="save">
      <p class="site-profile-form__intro">Adınız ve unvanınız ana sayfa ile hakkımda sayfasında kullanılır. Çalışma alanları da profil özetinde görünür.</p>
      <p v-if="feedback" :class="['admin-feedback', `is-${feedback.type}`]" :role="feedback.type === 'error' ? 'alert' : 'status'"><i :class="feedback.type === 'error' ? 'bi bi-exclamation-circle' : 'bi bi-check-circle'" />{{ feedback.text }}</p>
      <div class="site-profile-form__fields">
        <label for="site-profile-name"><strong>Görünen ad</strong><small>Sitede adınızın nasıl yazılacağını belirler.</small><input id="site-profile-name" v-model="draft.name" required maxlength="120" autocomplete="name" placeholder="Adınız ve soyadınız"></label>
        <label for="site-profile-title-input"><strong>Mesleki unvan</strong><small>Adınızın yanında görünen kısa tanım.</small><input id="site-profile-title-input" v-model="draft.title" required maxlength="160" placeholder="Örn. Full-Stack Developer"></label>
      </div>
      <div class="site-focus-editor">
        <div class="site-focus-editor__heading"><div><strong>Çalışma alanları</strong><small>En fazla 12 kısa başlık ekleyin; boş satırlar kaydedilmez.</small></div><button type="button" class="admin-secondary-button" :disabled="draft.focus.length >= 12" @click="draft.focus.push('')"><i class="bi bi-plus-lg" /> Alan ekle</button></div>
        <div v-if="draft.focus.length" class="site-focus-editor__list"><div v-for="(_, index) in draft.focus" :key="index" class="site-focus-editor__row"><span>{{ index + 1 }}</span><input v-model="draft.focus[index]" :aria-label="`${index + 1}. çalışma alanı`" maxlength="100" placeholder="Örn. Web geliştirme"><button type="button" :aria-label="`${index + 1}. çalışma alanını kaldır`" @click="draft.focus.splice(index, 1)"><i class="bi bi-x-lg" /></button></div></div>
        <p v-else class="site-focus-editor__empty">Henüz çalışma alanı yok. İsterseniz “Alan ekle” ile başlayın.</p>
      </div>
      <div class="site-profile-form__footer"><span>Değişiklikler yalnızca kaydettikten sonra yayınlanır.</span><button class="admin-primary-button" :disabled="loading || saving"><i :class="saving ? 'bi bi-arrow-repeat admin-spin' : 'bi bi-check2'" />{{ saving ? 'Kaydediliyor…' : 'Profil bilgilerini kaydet' }}</button></div>
    </form>
  </section>
</template>
