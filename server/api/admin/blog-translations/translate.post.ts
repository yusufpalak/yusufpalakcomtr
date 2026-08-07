import { blogTranslationRequestSchema } from '../../../../shared/schemas'
import { LibreTranslateError, translateBlogDraft } from '../../../utils/libre-translate'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  rateLimit(`blog-translation:${admin.id}`, 10, 60 * 1000)

  try {
    const request = blogTranslationRequestSchema.parse(await readBody(event))
    const config = useRuntimeConfig(event).libreTranslate
    const translation = await translateBlogDraft({
      url: config.url,
      apiKey: config.apiKey,
      timeoutMs: config.timeoutMs,
      ...request,
    })
    return ok(translation)
  }
  catch (error) {
    if (error instanceof LibreTranslateError) {
      throw createError({ statusCode: error.statusCode, message: error.message })
    }
    validationError(error)
  }
})
