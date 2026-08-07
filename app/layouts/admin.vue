<script setup lang="ts">
const route = useRoute()
const mobileOpen = ref(false)
const navGroups = [
  { label: 'Genel', items: [{ label: 'Dashboard', to: '/admin', icon: 'bi-grid-1x2' }, { label: 'İçerik yönetimi', to: '/admin/content', icon: 'bi-layers' }] },
  { label: 'Yönetim', items: [{ label: 'Sosyal bağlantılar', to: '/admin/social-links', icon: 'bi-share' }, { label: 'Mesajlar', to: '/admin/messages', icon: 'bi-inbox' }, { label: 'Medya', to: '/admin/media', icon: 'bi-images' }] },
  { label: 'Sistem', items: [{ label: 'Ayarlar & SEO', to: '/admin/settings', icon: 'bi-gear' }] }
]
const pageTitle = computed(() => {
  const path = route.path
  if (path === '/admin') return 'Dashboard'
  if (path.startsWith('/admin/content/')) return 'İçerik modülü'
  return navGroups.flatMap(group => group.items).find(item => item.to === path)?.label || 'Yönetim paneli'
})
watch(() => route.fullPath, () => { mobileOpen.value = false })
async function logout() { await $fetch('/api/auth/logout', { method: 'POST' }); await navigateTo('/admin/login') }
</script>
<template><div class="admin-app"><button v-if="mobileOpen" class="admin-overlay" aria-label="Menüyü kapat" @click="mobileOpen=false"/><aside class="admin-sidebar" :class="{ 'is-open': mobileOpen }"><div class="admin-brand"><span class="admin-brand__mark">YP</span><div><strong>Yusuf Palak</strong><small>Yönetim paneli</small></div></div><nav class="admin-sidebar__nav" aria-label="Yönetim menüsü"><div v-for="group in navGroups" :key="group.label" class="admin-nav-group"><span>{{ group.label }}</span><NuxtLink v-for="item in group.items" :key="item.to" :to="item.to" :class="{ active: route.path === item.to || (item.to === '/admin/content' && route.path.startsWith('/admin/content/')) }"><i :class="`bi ${item.icon}`"/><span>{{ item.label }}</span></NuxtLink></div></nav><div class="admin-sidebar__footer"><NuxtLink to="/" target="_blank"><i class="bi bi-box-arrow-up-right"/> Siteyi görüntüle</NuxtLink><button @click="logout"><i class="bi bi-box-arrow-left"/> Çıkış yap</button></div></aside><div class="admin-workspace"><header class="admin-topbar"><div class="admin-topbar__title"><button class="admin-mobile-menu" aria-label="Yönetim menüsünü aç" @click="mobileOpen=true"><i class="bi bi-list"/></button><div><small>Yönetim /</small><strong>{{ pageTitle }}</strong></div></div><div class="admin-profile"><span class="admin-status-dot"/><div><strong>Yusuf Palak</strong><small>Yönetici</small></div><span class="admin-avatar">YP</span></div></header><main class="admin-content"><slot/></main></div></div></template>
