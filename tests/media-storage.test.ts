import { describe, expect, it } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createMediaStorageKey, deleteMediaObject, getMediaObject, parseMediaStorageKey, putMediaObject } from '../server/utils/media-storage'

const id = 'bc0b055f-2a2d-4a79-98cf-83b7ecdc64d5'

describe('media storage keys', () => {
  it('keeps existing local media readable after switching new uploads to S3', () => {
    expect(parseMediaStorageKey(createMediaStorageKey(id, 'webp', 'local'))).toEqual({
      driver: 'local', objectKey: `uploads/${id}.webp`, filename: `${id}.webp`,
    })
    expect(parseMediaStorageKey(createMediaStorageKey(id, 'pdf', 's3'))).toEqual({
      driver: 's3', objectKey: `yusufpalakcomtr/uploads/${id}.pdf`, filename: `${id}.pdf`,
    })
    expect(parseMediaStorageKey(`s3/uploads/${id}.pdf`)).toEqual({
      driver: 's3', objectKey: `uploads/${id}.pdf`, filename: `${id}.pdf`,
    })
  })

  it('rejects path traversal and unsupported extensions', () => {
    expect(() => parseMediaStorageKey('uploads/../../secret.txt')).toThrow()
    expect(() => parseMediaStorageKey(`uploads/${id}.svg`)).toThrow()
    expect(() => parseMediaStorageKey(`s3/other/uploads/${id}.webp`)).toThrow()
  })

  it('writes, reads, and removes a legacy local media object', async () => {
    const root = await mkdtemp(join(tmpdir(), 'portfolio-media-'))
    const previousRoot = process.env.LOCAL_UPLOAD_DIR
    process.env.LOCAL_UPLOAD_DIR = root
    const key = createMediaStorageKey(id, 'webp', 'local')
    try {
      await putMediaObject(key, new Uint8Array([1, 2, 3]), 'image/webp')
      expect([...await getMediaObject(key)]).toEqual([1, 2, 3])
      await deleteMediaObject(key)
      await expect(getMediaObject(key)).rejects.toMatchObject({ code: 'ENOENT' })
    }
    finally {
      if (previousRoot === undefined) delete process.env.LOCAL_UPLOAD_DIR
      else process.env.LOCAL_UPLOAD_DIR = previousRoot
      await rm(root, { recursive: true, force: true })
    }
  })
})
