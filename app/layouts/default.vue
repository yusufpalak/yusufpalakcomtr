<script setup lang="ts">
const colorMode = useColorMode()
const { t } = useI18n()
const localePath = useLocalePath()
const open = ref(false)
const links = computed(() => [
  { to: localePath('index'), label: t('nav.home') },
  { to: localePath('about'), label: t('nav.about') },
  { to: localePath('portfolio'), label: t('nav.portfolio') },
  { to: localePath('blog'), label: t('nav.blog') },
  { to: localePath('certificates'), label: t('nav.certificates') },
  { to: localePath('contact'), label: t('nav.contact') },
])
const i18nHead = useLocaleHead({ seo: true })

useSeoMeta({ description: () => t('site.description') })
</script>

<template>
  <div>
    <Html :lang="i18nHead.htmlAttrs?.lang" :dir="i18nHead.htmlAttrs?.dir" />
    <Head>
      <Link v-for="link in i18nHead.link" :id="link.key" :key="link.key" :rel="link.rel" :href="link.href" :hreflang="link.hreflang" />
      <Meta v-for="meta in i18nHead.meta" :id="meta.key" :key="meta.key" :property="meta.property" :content="meta.content" />
    </Head>
    <header class="header">
      <NuxtLink :to="localePath('index')" class="brand">YP<span>.</span></NuxtLink>
      <button class="menu" :aria-label="t('a11y.openMenu')" @click="open = !open"><i class="bi bi-list" /></button>
      <nav :class="{ open }" :aria-label="t('a11y.mainMenu')">
        <NuxtLink v-for="link in links" :key="link.to" :to="link.to" @click="open = false">{{ link.label }}</NuxtLink>
      </nav>
      <LanguageSwitcher />
      <button class="theme" :aria-label="colorMode.value === 'dark' ? t('a11y.lightTheme') : t('a11y.darkTheme')" @click="colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'"><i :class="colorMode.value === 'dark' ? 'bi bi-sun' : 'bi bi-moon-stars'" /></button>
    </header>
    <main id="main"><slot /></main>
    <footer>
      <div>
        <b>Yusuf Palak</b>
        <p>{{ t('footer.tagline') }}</p>
        <div class="footer-socials"><SocialLinks location="footer" compact /></div>
      </div>
      <div><NuxtLink :to="localePath('privacy')">{{ t('footer.privacy') }}</NuxtLink> · <NuxtLink :to="localePath('cookies')">{{ t('footer.cookies') }}</NuxtLink> · <NuxtLink :to="localePath('terms')">{{ t('footer.terms') }}</NuxtLink></div>
      <small>© {{ new Date().getFullYear() }} Yusuf Palak</small>
    </footer>
  </div>
</template>
