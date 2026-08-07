<script setup lang="ts">
const { t } = useI18n()
useSeoMeta({ title: () => t('legal.privacyTitle') })
</script>

<template><article class="container prose"><h1>{{ t('legal.privacyTitle') }}</h1><p>{{ t('legal.privacyText') }}</p></article></template>
