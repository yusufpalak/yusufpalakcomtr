export type AdminFieldType = 'text' | 'textarea' | 'slug' | 'url' | 'number' | 'checkbox' | 'select' | 'relation' | 'relation-multiple' | 'media' | 'date' | 'datetime' | 'json'

export type AdminFieldOption = { label: string, value: string }
export type AdminContentField = {
  key: string
  label: string
  type: AdminFieldType
  required?: boolean
  placeholder?: string
  help?: string
  default?: string | number | boolean
  min?: number
  max?: number
  options?: AdminFieldOption[]
  relationModule?: string
  mediaKind?: 'image' | 'pdf'
  wide?: boolean
}

export type AdminContentForm = {
  singular: string
  fields: AdminContentField[]
}

const activeField: AdminContentField = { key: 'isActive', label: 'Aktif', type: 'checkbox', default: true }
const sortField: AdminContentField = { key: 'sortOrder', label: 'Gösterim sırası', type: 'number', default: 0, min: 0 }
const slugField: AdminContentField = { key: 'slug', label: 'Slug', type: 'slug', required: true, placeholder: 'ornek-icerik', help: 'Küçük harf, rakam ve tire kullanın.' }
const statusOptions: AdminFieldOption[] = [
  { label: 'Taslak', value: 'draft' },
  { label: 'Yayında', value: 'published' },
  { label: 'Zamanlanmış', value: 'scheduled' },
  { label: 'Arşiv', value: 'archived' },
]

export const blogLocalizedFields: AdminContentField[] = [
  { key: 'title', label: 'Yazı başlığı', type: 'text', required: true },
  slugField,
  { key: 'excerpt', label: 'Kısa özet', type: 'textarea', required: true, wide: true },
  { key: 'content', label: 'Yazı içeriği', type: 'textarea', required: true, wide: true, help: 'Başlıklar için h2/h3, bağlantılar ve temel HTML biçimlendirmesi kullanabilirsiniz.' },
  { key: 'readingMinutes', label: 'Okuma süresi', type: 'number', default: 1, min: 1, max: 999 },
  { key: 'seoTitle', label: 'SEO başlığı', type: 'text' },
  { key: 'seoDescription', label: 'SEO açıklaması', type: 'textarea', wide: true },
  { key: 'canonicalUrl', label: 'Canonical URL', type: 'url' },
]

export const blogLocalizedFieldKeys = blogLocalizedFields.map(field => field.key)

export const adminContentForms: Record<string, AdminContentForm> = {
  'site-settings': {
    singular: 'site ayarı',
    fields: [
      { key: 'key', label: 'Teknik ayar anahtarı', type: 'text', required: true, placeholder: 'ornek.ayar', help: 'Yalnızca uygulamanın tanıdığı anahtarlar sitede etki gösterir.' },
      { key: 'value', label: 'Ayar değeri', type: 'json', required: true, wide: true, help: 'Metin veya geçerli JSON yazın. JSON nesneleri için süslü parantez kullanın.' },
    ],
  },
  homepage: {
    singular: 'anasayfa bölümü',
    fields: [
      { key: 'key', label: 'Bölüm anahtarı', type: 'text', required: true, placeholder: 'hero-intro' },
      { key: 'title', label: 'Başlık', type: 'text', placeholder: 'Bölüm başlığı' },
      { key: 'content', label: 'İçerik', type: 'textarea', wide: true, placeholder: 'Bölüm metni' },
      sortField, activeField,
    ],
  },
  about: {
    singular: 'hakkımda bölümü',
    fields: [
      { key: 'key', label: 'Bölüm anahtarı', type: 'text', required: true, placeholder: 'biyografi' },
      { key: 'title', label: 'Başlık', type: 'text', placeholder: 'Biyografi' },
      { key: 'content', label: 'İçerik', type: 'textarea', wide: true, placeholder: 'Hakkınızda içerik' },
      sortField, activeField,
    ],
  },
  stats: {
    singular: 'istatistik',
    fields: [
      { key: 'key', label: 'Anahtar', type: 'text', required: true, placeholder: 'projects' },
      { key: 'label', label: 'Etiket', type: 'text', required: true, placeholder: 'Tamamlanan proje' },
      { key: 'value', label: 'Değer', type: 'number', min: 0 },
      { key: 'mode', label: 'Hesaplama', type: 'select', default: 'manual', options: [{ label: 'Manuel', value: 'manual' }, { label: 'Otomatik', value: 'automatic' }] },
      sortField,
    ],
  },
  skills: {
    singular: 'yetenek',
    fields: [
      { key: 'name', label: 'Yetenek adı', type: 'text', required: true, placeholder: 'TypeScript' },
      { key: 'categoryId', label: 'Kategori', type: 'relation', relationModule: 'skill-categories' },
      { key: 'level', label: 'Seviye', type: 'select', required: true, default: 'advanced', options: [{ label: 'Başlangıç', value: 'beginner' }, { label: 'Orta', value: 'intermediate' }, { label: 'İleri', value: 'advanced' }, { label: 'Uzman', value: 'expert' }] },
      { key: 'years', label: 'Deneyim yılı', type: 'number', min: 0, max: 80 },
      { key: 'icon', label: 'İkon sınıfı', type: 'text', placeholder: 'bi bi-code-slash' },
      { key: 'description', label: 'Açıklama', type: 'textarea', wide: true },
      sortField, activeField,
    ],
  },
  'skill-categories': {
    singular: 'yetenek kategorisi',
    fields: [{ key: 'name', label: 'Kategori adı', type: 'text', required: true }, slugField, sortField],
  },
  experiences: {
    singular: 'iş deneyimi',
    fields: [
      { key: 'company', label: 'Şirket', type: 'text', required: true },
      { key: 'position', label: 'Pozisyon', type: 'text', required: true },
      { key: 'employmentType', label: 'Çalışma türü', type: 'select', options: [{ label: 'Tam zamanlı', value: 'full-time' }, { label: 'Yarı zamanlı', value: 'part-time' }, { label: 'Serbest', value: 'freelance' }, { label: 'Staj', value: 'internship' }] },
      { key: 'location', label: 'Konum', type: 'text' },
      { key: 'startDate', label: 'Başlangıç', type: 'date' },
      { key: 'endDate', label: 'Bitiş', type: 'date' },
      { key: 'isCurrent', label: 'Halen çalışıyorum', type: 'checkbox', default: false },
      { key: 'summary', label: 'Özet', type: 'textarea', wide: true },
      { key: 'responsibilities', label: 'Sorumluluklar', type: 'textarea', wide: true },
      { key: 'companyUrl', label: 'Şirket bağlantısı', type: 'url' },
      { key: 'logoMediaId', label: 'Şirket görseli / logosu', type: 'media', mediaKind: 'image', wide: true, help: 'Medya kütüphanesine yüklediğiniz görseli seçin.' },
      sortField, activeField,
    ],
  },
  educations: {
    singular: 'eğitim',
    fields: [
      { key: 'school', label: 'Okul', type: 'text', required: true },
      { key: 'department', label: 'Bölüm', type: 'text' },
      { key: 'degree', label: 'Derece', type: 'text' },
      { key: 'startDate', label: 'Başlangıç', type: 'date' },
      { key: 'endDate', label: 'Bitiş', type: 'date' },
      { key: 'isCurrent', label: 'Devam ediyor', type: 'checkbox', default: false },
      { key: 'description', label: 'Açıklama', type: 'textarea', wide: true },
      { key: 'url', label: 'Okul bağlantısı', type: 'url' },
      { key: 'logoMediaId', label: 'Okul görseli / logosu', type: 'media', mediaKind: 'image', wide: true, help: 'Medya kütüphanesine yüklediğiniz görseli seçin.' },
      sortField, activeField,
    ],
  },
  projects: {
    singular: 'proje',
    fields: [
      { key: 'title', label: 'Proje başlığı', type: 'text', required: true }, slugField,
      { key: 'summary', label: 'Kısa özet', type: 'textarea', required: true, wide: true },
      { key: 'content', label: 'Proje içeriği', type: 'textarea', required: true, wide: true },
      { key: 'coverMediaId', label: 'Kapak görseli', type: 'media', mediaKind: 'image', wide: true, help: 'Önce Medya kütüphanesine yükleyin; ardından burada seçin.' },
      { key: 'categoryId', label: 'Kategori', type: 'relation', relationModule: 'project-categories' },
      { key: 'technologyIds', label: 'Teknolojiler', type: 'relation-multiple', relationModule: 'technologies', wide: true, help: 'Birden fazla seçim için Ctrl (Windows) veya Command (macOS) tuşunu kullanın.' },
      { key: 'liveUrl', label: 'Canlı bağlantı', type: 'url' },
      { key: 'repoUrl', label: 'Kod deposu', type: 'url' },
      { key: 'clientName', label: 'Müşteri', type: 'text' },
      { key: 'role', label: 'Rol', type: 'text' },
      { key: 'startDate', label: 'Başlangıç', type: 'date' },
      { key: 'endDate', label: 'Bitiş', type: 'date' },
      { key: 'isCurrent', label: 'Devam ediyor', type: 'checkbox', default: false },
      { key: 'isFeatured', label: 'Öne çıkar', type: 'checkbox', default: false },
      { key: 'status', label: 'Durum', type: 'select', required: true, default: 'draft', options: statusOptions },
      sortField,
      { key: 'seoTitle', label: 'SEO başlığı', type: 'text' },
      { key: 'seoDescription', label: 'SEO açıklaması', type: 'textarea', wide: true },
    ],
  },
  'project-categories': { singular: 'proje kategorisi', fields: [{ key: 'name', label: 'Kategori adı', type: 'text', required: true }, slugField] },
  technologies: { singular: 'teknoloji', fields: [{ key: 'name', label: 'Teknoloji adı', type: 'text', required: true }, slugField, { key: 'icon', label: 'İkon sınıfı', type: 'text', placeholder: 'bi bi-code-slash' }] },
  'blog-posts': {
    singular: 'blog yazısı',
    fields: [
      ...blogLocalizedFields,
      { key: 'coverMediaId', label: 'Kapak görseli', type: 'media', mediaKind: 'image', wide: true, help: 'Önce Medya kütüphanesine yükleyin; ardından burada seçin.' },
      { key: 'categoryId', label: 'Kategori', type: 'relation', relationModule: 'blog-categories' },
      { key: 'tagIds', label: 'Etiketler', type: 'relation-multiple', relationModule: 'blog-tags', wide: true, help: 'Birden fazla seçim için Ctrl (Windows) veya Command (macOS) tuşunu kullanın.' },
      { key: 'status', label: 'Durum', type: 'select', required: true, default: 'draft', options: statusOptions },
      { key: 'publishedAt', label: 'Yayın zamanı', type: 'datetime' },
      { key: 'isFeatured', label: 'Öne çıkar', type: 'checkbox', default: false },
    ],
  },
  'blog-categories': { singular: 'blog kategorisi', fields: [{ key: 'name', label: 'Kategori adı', type: 'text', required: true }, slugField] },
  'blog-tags': { singular: 'blog etiketi', fields: [{ key: 'name', label: 'Etiket adı', type: 'text', required: true }, slugField] },
  certificates: {
    singular: 'sertifika',
    fields: [
      { key: 'name', label: 'Sertifika adı', type: 'text', required: true },
      { key: 'issuer', label: 'Veren kurum', type: 'text', required: true },
      { key: 'issuedAt', label: 'Alınma tarihi', type: 'date' },
      { key: 'expiresAt', label: 'Bitiş tarihi', type: 'date' },
      { key: 'neverExpires', label: 'Süresiz', type: 'checkbox', default: false },
      { key: 'credentialId', label: 'Sertifika numarası', type: 'text' },
      { key: 'verifyUrl', label: 'Doğrulama bağlantısı', type: 'url' },
      { key: 'category', label: 'Kategori', type: 'text' },
      { key: 'description', label: 'Açıklama', type: 'textarea', wide: true },
      { key: 'imageMediaId', label: 'Sertifika görseli', type: 'media', mediaKind: 'image', wide: true, help: 'Önce Medya kütüphanesine yükleyin; ardından burada seçin.' },
      { key: 'pdfMediaId', label: 'Sertifika PDF dosyası', type: 'media', mediaKind: 'pdf', wide: true, help: 'PDF dosyasını Medya kütüphanesine yükleyin; ardından burada seçin.' },
      sortField, activeField,
    ],
  },
}

export const getAdminContentForm = (slug: string) => adminContentForms[slug]
