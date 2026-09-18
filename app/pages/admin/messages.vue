<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin', i18n: false })

type MessageStatus = 'new' | 'read' | 'archived'
type MessageFilter = 'all' | MessageStatus
type MessageItem = { id: string, name: string, email: string, subject: string, status: string, createdAt: string }
type MessageDetail = MessageItem & { message: string }
type MessageList = { items: MessageItem[], total: number, newCount: number, page: number, pageSize: number }
const tabs: MessageFilter[] = ['all', 'new', 'read', 'archived']

const search = ref('')
const filter = ref<MessageFilter>('all')
const page = ref(1)
const selected = ref<MessageDetail | null>(null)
const opening = ref(false)
const saving = ref(false)
const feedback = ref('')
const { data, error, status, refresh } = await useFetch<{ success: true, data: MessageList }>('/api/admin/messages', {
  query: computed(() => ({ status: filter.value, q: search.value, page: page.value })),
})
const list = computed(() => data.value?.data)
const items = computed(() => list.value?.items || [])
const pageCount = computed(() => Math.max(1, Math.ceil((list.value?.total || 0) / (list.value?.pageSize || 20))))

watch([search, filter], () => { page.value = 1; selected.value = null })
watch(page, () => { selected.value = null })

function formatDate(value: string) {
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function statusLabel(value: string) {
  return value === 'new' ? 'Yeni' : value === 'read' ? 'Okundu' : value === 'archived' ? 'Arşiv' : value
}

async function openMessage(id: string) {
  opening.value = true
  feedback.value = ''
  try {
    const response = await $fetch<{ success: true, data: MessageDetail }>(`/api/admin/messages/${id}`)
    selected.value = response.data
    if (response.data.status === 'new') {
      await $fetch(`/api/admin/messages/${id}`, { method: 'PATCH', body: { status: 'read' } })
      selected.value = { ...response.data, status: 'read' }
      await refresh()
    }
  }
  catch { feedback.value = 'Mesaj açılamadı. Lütfen tekrar deneyin.' }
  finally { opening.value = false }
}

async function changeStatus(next: MessageStatus) {
  if (!selected.value) return
  saving.value = true
  feedback.value = ''
  try {
    await $fetch(`/api/admin/messages/${selected.value.id}`, { method: 'PATCH', body: { status: next } })
    selected.value = { ...selected.value, status: next }
    await refresh()
  }
  catch { feedback.value = 'Mesaj durumu güncellenemedi.' }
  finally { saving.value = false }
}
</script>

<template>
  <div>
    <header class="admin-page-header">
      <div><p class="admin-kicker">İLETİŞİM</p><h1>Gelen kutusu</h1><p>İletişim formundan gelen mesajları burada okuyup arşivleyebilirsiniz.</p></div>
      <div class="admin-date"><i class="bi bi-inbox" /> {{ list?.newCount || 0 }} yeni mesaj</div>
    </header>
    <section class="admin-panel admin-inbox" aria-label="Gelen mesajlar">
      <div class="admin-panel__toolbar">
        <label class="admin-search"><i class="bi bi-search" /><input v-model="search" aria-label="Mesajlarda ara" placeholder="İsim, e-posta veya konuda ara…"></label>
        <div class="admin-message-tabs" role="group" aria-label="Mesaj durumu">
          <button v-for="tab in tabs" :key="tab" type="button" :class="{ active: filter === tab }" :aria-pressed="filter === tab" @click="filter = tab">{{ tab === 'all' ? 'Tümü' : statusLabel(tab) }}</button>
        </div>
      </div>
      <p v-if="feedback" class="admin-inbox__feedback" role="alert">{{ feedback }}</p>
      <div v-if="status === 'pending' && !list" class="admin-empty"><i class="bi bi-arrow-repeat admin-spin" /><p>Mesajlar yükleniyor…</p></div>
      <div v-else-if="error" class="admin-empty"><span class="admin-empty__icon"><i class="bi bi-exclamation-circle" /></span><h2>Mesajlar yüklenemedi</h2><button class="admin-secondary-button" type="button" @click="refresh()">Tekrar dene</button></div>
      <div v-else-if="items.length || selected" class="admin-inbox__body">
        <div class="admin-inbox__list" aria-label="Mesaj listesi">
          <button v-for="item in items" :key="item.id" type="button" class="admin-inbox__item" :class="{ 'is-selected': selected?.id === item.id, 'is-new': item.status === 'new' }" @click="openMessage(item.id)">
            <span class="admin-inbox__item-top"><strong>{{ item.name }}</strong><time :datetime="item.createdAt">{{ formatDate(item.createdAt) }}</time></span>
            <span class="admin-inbox__item-subject">{{ item.subject }}</span>
            <span class="admin-inbox__item-bottom"><span>{{ item.email }}</span><span class="admin-inbox__badge" :class="`is-${item.status}`">{{ statusLabel(item.status) }}</span></span>
          </button>
          <p v-if="!items.length" class="admin-inbox__list-empty">Bu filtrede başka mesaj yok.</p>
          <div v-if="items.length" class="admin-inbox__pagination"><button type="button" :disabled="page <= 1" @click="page--">Önceki</button><span>{{ page }} / {{ pageCount }}</span><button type="button" :disabled="page >= pageCount" @click="page++">Sonraki</button></div>
        </div>
        <div class="admin-inbox__detail">
          <div v-if="opening" class="admin-empty"><i class="bi bi-arrow-repeat admin-spin" /><p>Mesaj açılıyor…</p></div>
          <article v-else-if="selected">
            <div class="admin-inbox__detail-head"><span class="admin-inbox__badge" :class="`is-${selected.status}`">{{ statusLabel(selected.status) }}</span><time :datetime="selected.createdAt">{{ formatDate(selected.createdAt) }}</time></div>
            <h2>{{ selected.subject }}</h2>
            <p class="admin-inbox__sender"><strong>{{ selected.name }}</strong><a :href="`mailto:${selected.email}`">{{ selected.email }}</a></p>
            <p class="admin-inbox__message">{{ selected.message }}</p>
            <div class="admin-inbox__actions"><button v-if="selected.status !== 'new'" class="admin-secondary-button" type="button" :disabled="saving" @click="changeStatus('new')">Yeni olarak işaretle</button><button v-if="selected.status === 'archived'" class="admin-secondary-button" type="button" :disabled="saving" @click="changeStatus('read')">Arşivden çıkar</button><button v-else class="admin-secondary-button" type="button" :disabled="saving" @click="changeStatus('archived')">Arşivle</button></div>
          </article>
          <div v-else class="admin-empty"><span class="admin-empty__icon"><i class="bi bi-envelope-open" /></span><h2>Bir mesaj seçin</h2><p>İçeriğini okumak için soldaki listeden bir mesaja tıklayın.</p></div>
        </div>
      </div>
      <div v-else class="admin-empty"><span class="admin-empty__icon"><i class="bi bi-inbox" /></span><h2>{{ search || filter !== 'all' ? 'Eşleşen mesaj yok' : 'Gelen kutunuz temiz' }}</h2><p>{{ search || filter !== 'all' ? 'Aramayı veya filtreyi değiştirmeyi deneyin.' : 'Yeni iletişim mesajları geldiğinde burada görüntülenecek.' }}</p></div>
    </section>
  </div>
</template>

<style scoped>
.admin-inbox .admin-search{width:min(100%,420px)}
.admin-inbox__feedback{margin:0;padding:11px 20px;color:#b63a4b;background:#b63a4b12;font-size:.75rem}
.admin-inbox__body{display:grid;grid-template-columns:minmax(290px,390px) minmax(0,1fr);min-height:480px}
.admin-inbox__list{display:flex;flex-direction:column;border-right:1px solid var(--admin-line)}
.admin-inbox__item{display:grid;gap:5px;width:100%;padding:17px 20px;border:0;border-bottom:1px solid var(--admin-line);border-radius:0;background:transparent;color:var(--admin-text);text-align:left}
.admin-inbox__item:hover,.admin-inbox__item.is-selected{background:var(--admin-bg)}
.admin-inbox__item.is-new{box-shadow:inset 3px 0 var(--admin-purple)}
.admin-inbox__item-top,.admin-inbox__item-bottom,.admin-inbox__detail-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
.admin-inbox__item-top strong{font-size:.79rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.admin-inbox__item-top time,.admin-inbox__detail-head time{flex:none;color:var(--admin-muted);font-size:.64rem}
.admin-inbox__item-subject{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.74rem;font-weight:700}
.admin-inbox__item-bottom{min-width:0;color:var(--admin-muted);font-size:.68rem}
.admin-inbox__item-bottom>span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.admin-inbox__badge{flex:none;padding:3px 8px;border-radius:999px;background:var(--admin-bg);color:var(--admin-muted);font-size:.64rem;font-weight:750}
.admin-inbox__badge.is-new{background:#6d5dfc19;color:var(--admin-purple)}
.admin-inbox__badge.is-archived{background:#9aa0b020}
.admin-inbox__list-empty{padding:20px;color:var(--admin-muted);font-size:.74rem}
.admin-inbox__pagination{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:auto;padding:13px 18px;color:var(--admin-muted);font-size:.7rem}
.admin-inbox__pagination button{padding:5px 8px;border:1px solid var(--admin-line);background:var(--admin-panel);color:var(--admin-text);font-size:.68rem}
.admin-inbox__pagination button:disabled{opacity:.45;cursor:not-allowed}
.admin-inbox__detail{min-width:0;padding:26px 30px}
.admin-inbox__detail article h2{margin:18px 0 12px;font-size:1.35rem;line-height:1.3;overflow-wrap:anywhere}
.admin-inbox__sender{display:flex;gap:8px;flex-wrap:wrap;padding-bottom:20px;border-bottom:1px solid var(--admin-line);font-size:.75rem}
.admin-inbox__sender a{color:var(--admin-purple)}
.admin-inbox__message{margin:25px 0 35px;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.7;font-size:.84rem}
.admin-inbox__actions{display:flex;gap:8px;flex-wrap:wrap}
@media(max-width:950px){.admin-inbox__body{grid-template-columns:1fr}.admin-inbox__list{border-right:0;border-bottom:1px solid var(--admin-line)}.admin-inbox__detail{padding:24px 20px}}
@media(max-width:600px){.admin-inbox .admin-panel__toolbar{align-items:stretch;flex-direction:column}.admin-inbox__detail-head{align-items:flex-start;flex-direction:column}}
</style>
