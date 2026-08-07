<script setup lang="ts">
const { locale, locales } = useI18n()

const options = computed(() => locales.value.map(item => ({
  code: item.code,
  name: item.name || item.code.toLocaleUpperCase(),
})))
</script>

<template>
  <div class="language-switcher" role="group" :aria-label="$t('a11y.languageSwitcher')">
    <SwitchLocalePathLink
      v-for="option in options"
      :key="option.code"
      :locale="option.code"
      :class="{ active: locale === option.code }"
      :aria-current="locale === option.code ? 'page' : undefined"
      :title="option.name"
    >
      {{ option.code.toLocaleUpperCase() }}
    </SwitchLocalePathLink>
  </div>
</template>
