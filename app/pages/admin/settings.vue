<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin', i18n: false })
await navigateTo('/admin/content/site-settings', { redirectCode: 302 })
</script>
