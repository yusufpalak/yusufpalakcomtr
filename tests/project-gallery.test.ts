import { describe, expect, it } from 'vitest'
import { normalizeContentInput } from '../server/utils/content-admin'

const project = {
  title: 'Galeri testi',
  slug: 'galeri-testi',
  summary: 'Proje özeti',
  content: '<p>Proje içeriği</p>',
  status: 'published',
}

const imageId = '25392d9a-4c25-4baf-86a1-b986dfe832c6'

describe('project gallery input', () => {
  it('retains selected gallery images and allows removing all of them', () => {
    expect(normalizeContentInput('projects', { ...project, galleryMediaIds: [imageId, imageId] }).galleryMediaIds).toEqual([imageId])
    expect(normalizeContentInput('projects', { ...project, galleryMediaIds: [] }).galleryMediaIds).toEqual([])
  })

  it('rejects invalid gallery identifiers', () => {
    expect(() => normalizeContentInput('projects', { ...project, galleryMediaIds: ['not-an-id'] })).toThrow()
  })
})
