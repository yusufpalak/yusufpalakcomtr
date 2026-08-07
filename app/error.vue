<script setup lang="ts">
defineProps<{ error: { statusCode: number, statusMessage?: string } }>()
const localePath = useLocalePath()
</script>

<template>
  <div class="container">
    <p class="eyebrow">{{ error.statusCode }}</p>
    <h1 class="section-title">{{ error.statusCode === 404 ? $t('error.notFound') : $t('error.generic') }}</h1>
    <NuxtLink class="btn" :to="localePath('index')">{{ $t('error.home') }}</NuxtLink>
  </div>
</template>
