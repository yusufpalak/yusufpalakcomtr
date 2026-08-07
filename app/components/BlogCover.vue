<script setup lang="ts">
defineProps<{ position: 'left' | 'center' | 'right', alt: string, imageUrl?: string | null, large?: boolean }>()
</script>

<template>
  <div class="blog-cover" :class="[`blog-cover--${position}`, { 'blog-cover--large': large, 'blog-cover--image': imageUrl }]" role="img" :aria-label="alt" :style="imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined" />
</template>
