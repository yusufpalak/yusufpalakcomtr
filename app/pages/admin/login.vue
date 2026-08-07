<script setup lang="ts">
definePageMeta({ layout: false, i18n: false })
useSeoMeta({ title: 'Yönetici Girişi', robots: 'noindex,nofollow' })
const form = reactive({ email: '', password: '' })
const error = ref('')
const pending = ref(false)
const showPassword = ref(false)
async function login() {
  error.value = ''
  pending.value = true
  try { await $fetch('/api/auth/login', { method: 'POST', body: form }); await navigateTo('/admin') }
  catch { error.value = 'E-posta veya parola hatalı. Lütfen tekrar deneyin.' }
  finally { pending.value = false }
}
</script>
<template><main class="admin-login"><section class="admin-login__story"><NuxtLink to="/" class="admin-login__brand"><span>YP</span> Yusuf Palak</NuxtLink><div class="admin-login__story-copy"><p class="admin-kicker">İÇERİK MERKEZİ</p><h1>Dijital vitrininizin kontrolü sizde.</h1><p>Projeleri, yazıları ve profil içeriklerini tek bir güvenli merkezden yönetin.</p><div class="admin-login__features"><span><i class="bi bi-shield-check"/> Güvenli oturum</span><span><i class="bi bi-lightning-charge"/> Hızlı içerik yönetimi</span><span><i class="bi bi-bar-chart"/> Anlık genel bakış</span></div></div><small>© {{ new Date().getFullYear() }} Yusuf Palak</small></section><section class="admin-login__panel"><form class="admin-login__form" @submit.prevent="login"><div class="admin-login__mobile-brand"><span>YP</span><strong>Yusuf Palak</strong></div><div class="admin-login__heading"><p class="admin-kicker">TEKRAR HOŞ GELDİNİZ</p><h2>Yönetici girişi</h2><p>İçeriklerinizi yönetmek için hesabınıza giriş yapın.</p></div><div class="admin-field"><label for="email">E-posta adresi</label><div><i class="bi bi-envelope"/><input id="email" v-model="form.email" type="email" autocomplete="username" placeholder="admin@yusufpalak.com.tr" required autofocus></div></div><div class="admin-field"><label for="password">Parola</label><div><i class="bi bi-lock"/><input id="password" v-model="form.password" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" placeholder="Parolanızı girin" required minlength="8"><button type="button" :aria-label="showPassword ? 'Parolayı gizle' : 'Parolayı göster'" @click="showPassword=!showPassword"><i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"/></button></div></div><p v-if="error" class="admin-login__error" role="alert"><i class="bi bi-exclamation-circle"/> {{ error }}</p><button class="admin-login__submit" :disabled="pending"><span>{{ pending ? 'Giriş yapılıyor…' : 'Giriş yap' }}</span><i :class="pending ? 'bi bi-arrow-repeat' : 'bi bi-arrow-right'"/></button><p class="admin-login__secure"><i class="bi bi-shield-lock"/> Bağlantınız ve oturumunuz güvenli biçimde korunur.</p></form></section></main></template>
