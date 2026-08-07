<script setup lang="ts">
const { t } = useI18n()
useSeoMeta({ title: () => t('legal.termsTitle') })
</script>

<template><article class="container prose"><h1>{{ t('legal.termsTitle') }}</h1><p>{{ t('legal.termsText') }}</p></article></template>
