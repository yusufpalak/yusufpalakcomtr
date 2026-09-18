import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { z } from 'zod'

const s3UploadPrefix = 'yusufpalakcomtr'
const storageKeySchema = z.string().regex(/^(?:s3\/(?:yusufpalakcomtr\/)?)?uploads\/[0-9a-f-]{36}\.(?:webp|pdf)$/i)
const driverSchema = z.enum(['local', 's3'])

function configuredDriver() {
  const result = driverSchema.safeParse(process.env.STORAGE_DRIVER || 'local')
  if (!result.success) throw createError({ statusCode: 503, statusMessage: 'STORAGE_DRIVER local veya s3 olmalıdır.' })
  return result.data
}

export function parseMediaStorageKey(value: string) {
  const key = storageKeySchema.parse(value)
  return { driver: key.toLowerCase().startsWith('s3/') ? 's3' as const : 'local' as const, objectKey: key.replace(/^s3\//i, ''), filename: key.split('/').at(-1)! }
}

export function createMediaStorageKey(id: string, extension: 'webp' | 'pdf', driver: 'local' | 's3' = configuredDriver()) {
  const mediaId = z.uuid().parse(id)
  return `${driver === 's3' ? `s3/${s3UploadPrefix}/` : ''}uploads/${mediaId}.${extension}`
}

function localRoot() {
  return resolve(process.cwd(), process.env.LOCAL_UPLOAD_DIR?.trim() || '.data/uploads')
}

function s3Config() {
  const region = process.env.S3_REGION?.trim() || process.env.AWS_REGION?.trim()
  const bucket = process.env.S3_BUCKET?.trim() || process.env.AWS_S3_BUCKET_NAME?.trim()
  const accessKey = process.env.S3_ACCESS_KEY?.trim()
  const secretKey = process.env.S3_SECRET_KEY?.trim()
  const endpoint = process.env.S3_ENDPOINT?.trim()
  if (!region || !bucket) throw createError({ statusCode: 503, statusMessage: 'S3 için bölge ve bucket yapılandırılmalıdır.' })
  if (Boolean(accessKey) !== Boolean(secretKey)) throw createError({ statusCode: 503, statusMessage: 'S3 erişim anahtarı ve gizli anahtarı birlikte tanımlanmalıdır.' })
  if (endpoint && (!z.url().safeParse(endpoint).success || !['http:', 'https:'].includes(new URL(endpoint).protocol))) throw createError({ statusCode: 503, statusMessage: 'S3_ENDPOINT geçerli bir HTTP veya HTTPS adresi olmalıdır.' })
  return {
    bucket,
    client: new S3Client({
      region,
      endpoint: endpoint || undefined,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
      credentials: accessKey && secretKey ? { accessKeyId: accessKey, secretAccessKey: secretKey } : undefined,
    }),
  }
}

export async function putMediaObject(storageKey: string, data: Uint8Array, contentType: string) {
  const parsed = parseMediaStorageKey(storageKey)
  if (parsed.driver === 'local') {
    const root = localRoot()
    await mkdir(root, { recursive: true })
    await writeFile(resolve(root, parsed.filename), data)
    return
  }
  const { bucket, client } = s3Config()
  try {
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: parsed.objectKey, Body: data, ContentType: contentType }))
  }
  catch { throw createError({ statusCode: 502, statusMessage: 'S3 yüklemesi başarısız. Bucket, bölge ve IAM izinlerini kontrol edin.' }) }
  finally { client.destroy() }
}

export async function getMediaObject(storageKey: string) {
  const parsed = parseMediaStorageKey(storageKey)
  if (parsed.driver === 'local') return readFile(resolve(localRoot(), parsed.filename))
  const { bucket, client } = s3Config()
  try {
    const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: parsed.objectKey }))
    if (!result.Body) throw createError({ statusCode: 404, statusMessage: 'Dosya bulunamadı.' })
    return Buffer.from(await result.Body.transformToByteArray())
  }
  catch (error) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'NoSuchKey') throw createError({ statusCode: 404, statusMessage: 'Dosya bulunamadı.' })
    throw error
  }
  finally { client.destroy() }
}

export async function deleteMediaObject(storageKey: string) {
  const parsed = parseMediaStorageKey(storageKey)
  if (parsed.driver === 'local') {
    await rm(resolve(localRoot(), parsed.filename), { force: true })
    return
  }
  const { bucket, client } = s3Config()
  try {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: parsed.objectKey }))
  }
  catch { throw createError({ statusCode: 502, statusMessage: 'S3 silme işlemi başarısız. IAM izinlerini kontrol edin.' }) }
  finally { client.destroy() }
}
