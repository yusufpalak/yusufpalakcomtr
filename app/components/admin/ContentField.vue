<script setup lang="ts">
import type { AdminContentField } from '#shared/admin-content'

const props = defineProps<{ field: AdminContentField }>()
const model = defineModel<string | string[] | number | boolean | null>()
const textValue = computed({ get: () => model.value === null || model.value === undefined || Array.isArray(model.value) ? '' : String(model.value), set: value => { model.value = value } })
const numberValue = computed({ get: () => typeof model.value === 'number' ? model.value : null, set: value => { model.value = value } })
const checkedValue = computed({ get: () => model.value === true, set: value => { model.value = value } })
const multipleValue = computed({ get: () => Array.isArray(model.value) ? model.value : [], set: value => { model.value = value } })
const inputType = computed(() => {
  if (props.field.type === 'date') return 'date'
  if (props.field.type === 'datetime') return 'datetime-local'
  if (props.field.type === 'url') return 'url'
  return 'text'
})
</script>

<template>
  <label :class="{ 'admin-form-wide': field.wide || field.type === 'textarea' || field.type === 'json' || field.type === 'relation-multiple' }">
    <template v-if="field.type === 'checkbox'"><span class="admin-checkbox-field"><input v-model="checkedValue" type="checkbox"> {{ field.label }}</span></template>
    <template v-else>
      {{ field.label }}
      <small v-if="field.help">{{ field.help }}</small>
      <textarea v-if="field.type === 'textarea' || field.type === 'json'" v-model="textValue" :rows="field.type === 'json' ? 7 : 5" :required="field.required" :placeholder="field.placeholder" />
      <select v-else-if="field.type === 'relation-multiple'" v-model="multipleValue" multiple :size="Math.min(Math.max(field.options?.length || 3, 3), 7)"><option v-for="option in field.options" :key="option.value" :value="option.value">{{ option.label }}</option></select>
      <select v-else-if="field.type === 'select' || field.type === 'relation'" v-model="textValue" :required="field.required"><option v-if="!field.required" value="">Seçiniz</option><option v-for="option in field.options" :key="option.value" :value="option.value">{{ option.label }}</option></select>
      <input v-else-if="field.type === 'number'" v-model="numberValue" type="number" :required="field.required" :placeholder="field.placeholder" :min="field.min" :max="field.max">
      <input v-else v-model="textValue" :type="inputType" :required="field.required" :placeholder="field.placeholder">
    </template>
  </label>
</template>
