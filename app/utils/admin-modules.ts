export type AdminModule = {
  slug: string
  label: string
  description: string
  icon: string
  group: 'Genel' | 'Profil' | 'Portfolyo' | 'Blog'
  color: string
}

export const adminModules: AdminModule[] = [
  { slug: 'site-settings', label: 'Site ayarları', description: 'Marka, iletişim ve genel site yapılandırması', icon: 'bi-sliders2', group: 'Genel', color: '#8b5cf6' },
  { slug: 'homepage', label: 'Anasayfa', description: 'Hero, çağrı alanları ve öne çıkan içerikler', icon: 'bi-house-door', group: 'Genel', color: '#6366f1' },
  { slug: 'about', label: 'Hakkımda', description: 'Biyografi, yaklaşım ve kariyer özeti', icon: 'bi-person', group: 'Profil', color: '#0ea5e9' },
  { slug: 'stats', label: 'İstatistikler', description: 'Proje, deneyim ve sertifika sayaçları', icon: 'bi-graph-up-arrow', group: 'Genel', color: '#14b8a6' },
  { slug: 'skills', label: 'Yetenekler', description: 'Teknik yetkinlikler ve seviyeleri', icon: 'bi-lightning-charge', group: 'Profil', color: '#f59e0b' },
  { slug: 'skill-categories', label: 'Yetenek kategorileri', description: 'Yetenek grupları ve gösterim sırası', icon: 'bi-collection', group: 'Profil', color: '#f97316' },
  { slug: 'experiences', label: 'İş deneyimleri', description: 'Kariyer zaman çizelgesi ve sorumluluklar', icon: 'bi-briefcase', group: 'Profil', color: '#06b6d4' },
  { slug: 'educations', label: 'Eğitimler', description: 'Okul, bölüm ve eğitim geçmişi', icon: 'bi-mortarboard', group: 'Profil', color: '#3b82f6' },
  { slug: 'projects', label: 'Projeler', description: 'Portfolyo projeleri ve yayın durumları', icon: 'bi-window-stack', group: 'Portfolyo', color: '#7c3aed' },
  { slug: 'project-categories', label: 'Proje kategorileri', description: 'Proje filtreleri ve kategoriler', icon: 'bi-grid', group: 'Portfolyo', color: '#8b5cf6' },
  { slug: 'technologies', label: 'Teknolojiler', description: 'Projelerde kullanılan teknoloji kataloğu', icon: 'bi-code-slash', group: 'Portfolyo', color: '#10b981' },
  { slug: 'blog-posts', label: 'Blog yazıları', description: 'Taslak, zamanlanmış ve yayındaki yazılar', icon: 'bi-file-earmark-text', group: 'Blog', color: '#6366f1' },
  { slug: 'blog-categories', label: 'Blog kategorileri', description: 'Yazıların konu kategorileri', icon: 'bi-folder2-open', group: 'Blog', color: '#0ea5e9' },
  { slug: 'blog-tags', label: 'Blog etiketleri', description: 'İçerik etiketleri ve ilişkileri', icon: 'bi-tags', group: 'Blog', color: '#14b8a6' },
  { slug: 'certificates', label: 'Sertifikalar', description: 'Sertifika, doğrulama ve dosyalar', icon: 'bi-award', group: 'Profil', color: '#eab308' }
]

export const getAdminModule = (slug: string) => adminModules.find(item => item.slug === slug)
