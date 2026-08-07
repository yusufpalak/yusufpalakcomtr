<script setup lang="ts">
const { t } = useI18n()
useSeoMeta({ title: () => t('legal.cookiesTitle') })
</script>

<template><article class="container prose"><h1>{{ t('legal.cookiesTitle') }}</h1><p>{{ t('legal.cookiesText') }}</p></article></template>
