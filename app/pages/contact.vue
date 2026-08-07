<script setup lang="ts">
type ContactField = 'name' | 'email' | 'subject' | 'message' | 'privacy'

const { t } = useI18n()
const localePath = useLocalePath()
const emptyForm = () => ({ name: '', email: '', subject: '', message: '', privacy: false, website: '' })
const form = reactive(emptyForm())
const errors = reactive<Partial<Record<ContactField, string>>>({})
const state = ref<'idle' | 'ok' | 'error'>('idle')
const submitting = ref(false)
const hasErrors = computed(() => Object.values(errors).some(Boolean))

function clearErrors() {
  Object.assign(errors, { name: undefined, email: undefined, subject: undefined, message: undefined, privacy: undefined })
}

function clearField(field: ContactField) {
  errors[field] = undefined
}

function validate() {
  clearErrors()
  if (form.name.trim().length < 2) errors.name = t('contact.validation.name')
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = t('contact.validation.email')
  if (form.subject.trim().length < 2) errors.subject = t('contact.validation.subject')
  if (form.message.trim().length < 10) errors.message = t('contact.validation.message')
  if (!form.privacy) errors.privacy = t('contact.validation.privacy')
  return !hasErrors.value
}

function serverFields(error: unknown) {
  if (!error || typeof error !== 'object' || !('data' in error)) return undefined
  const response = (error as { data?: { data?: { error?: { fields?: Record<string, string[]> } } } }).data
  return response?.data?.error?.fields
}

async function submit() {
  state.value = 'idle'
  if (!validate()) {
    state.value = 'error'
    return
  }

  submitting.value = true
  try {
    await $fetch('/api/public/contact', {
      method: 'POST',
      body: {
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
        privacy: form.privacy,
        website: form.website,
      },
    })
    state.value = 'ok'
    Object.assign(form, emptyForm())
    clearErrors()
  }
  catch (error) {
    const fields = serverFields(error)
    if (fields) {
      for (const [key, messages] of Object.entries(fields)) {
        if (['name', 'email', 'subject', 'message', 'privacy'].includes(key) && messages?.[0]) {
          errors[key as ContactField] = t(`contact.validation.${key}`)
        }
      }
    }
    state.value = 'error'
  }
  finally {
    submitting.value = false
  }
}

useSeoMeta({ title: () => t('contact.seoTitle'), description: () => t('contact.seoDescription') })
</script>

<template>
  <div class="container contact-shell">
    <div class="contact-grid">
      <section class="contact-intro">
        <p class="eyebrow">{{ t('contact.eyebrow') }}</p>
        <h1 class="section-title">{{ t('contact.title') }}</h1>
        <p>{{ t('contact.intro') }}</p>
        <div class="contact-socials">
          <h2>{{ t('contact.socialTitle') }}</h2>
          <SocialLinks location="contact" />
        </div>
      </section>

      <form class="form contact-form" novalidate @submit.prevent="submit">
        <div class="contact-field">
          <label for="name">{{ t('contact.form.name') }}</label>
          <input id="name" v-model="form.name" autocomplete="name" :aria-invalid="Boolean(errors.name)" :aria-describedby="errors.name ? 'name-error' : undefined" @input="clearField('name')">
          <small v-if="errors.name" id="name-error" class="contact-error">{{ errors.name }}</small>
        </div>
        <div class="contact-field">
          <label for="email">{{ t('contact.form.email') }}</label>
          <input id="email" v-model="form.email" type="email" autocomplete="email" :aria-invalid="Boolean(errors.email)" :aria-describedby="errors.email ? 'email-error' : undefined" @input="clearField('email')">
          <small v-if="errors.email" id="email-error" class="contact-error">{{ errors.email }}</small>
        </div>
        <div class="contact-field">
          <label for="subject">{{ t('contact.form.subject') }}</label>
          <input id="subject" v-model="form.subject" :aria-invalid="Boolean(errors.subject)" :aria-describedby="errors.subject ? 'subject-error' : undefined" @input="clearField('subject')">
          <small v-if="errors.subject" id="subject-error" class="contact-error">{{ errors.subject }}</small>
        </div>
        <div class="contact-field">
          <label for="message">{{ t('contact.form.message') }}</label>
          <textarea id="message" v-model="form.message" rows="7" :aria-invalid="Boolean(errors.message)" :aria-describedby="errors.message ? 'message-error' : undefined" @input="clearField('message')" />
          <small v-if="errors.message" id="message-error" class="contact-error">{{ errors.message }}</small>
        </div>
        <input v-model="form.website" tabindex="-1" autocomplete="off" class="hidden" aria-hidden="true">
        <div class="contact-privacy">
          <div class="contact-privacy__row">
            <input id="privacy" v-model="form.privacy" type="checkbox" :aria-invalid="Boolean(errors.privacy)" :aria-describedby="errors.privacy ? 'privacy-error' : undefined" @change="clearField('privacy')">
            <label for="privacy">
              <I18nT keypath="contact.form.privacyConsent" tag="span">
                <template #privacy><NuxtLink :to="localePath('privacy')">{{ t('contact.form.privacyPolicy') }}</NuxtLink></template>
              </I18nT>
            </label>
          </div>
          <small v-if="errors.privacy" id="privacy-error" class="contact-error">{{ errors.privacy }}</small>
        </div>
        <button type="submit" :disabled="submitting"><i :class="submitting ? 'bi bi-arrow-repeat contact-spin' : 'bi bi-send'" /> {{ submitting ? t('contact.form.sending') : t('contact.form.submit') }}</button>
        <p v-if="state === 'ok'" class="contact-feedback is-success" role="status"><i class="bi bi-check-circle" /> {{ t('contact.form.success') }}</p>
        <p v-if="state === 'error' && !hasErrors" class="contact-feedback is-error" role="alert"><i class="bi bi-exclamation-circle" /> {{ t('contact.form.failure') }}</p>
      </form>
    </div>
  </div>
</template>
