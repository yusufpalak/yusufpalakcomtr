import 'dotenv/config'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'
import { and, eq, isNull } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import sharp from 'sharp'
import {
  certificates,
  educations,
  experiences,
  homepageSections,
  mediaFiles,
  projectCategories,
  projectImages,
  projects,
  projectTechnologies,
  technologies,
} from '../server/database/schema'

// Import only facts and original media from Yusuf's archived site. Template samples are excluded.
const sourceRoot = process.argv[2] ? resolve(process.argv[2]) : ''
if (!sourceRoot) throw new Error('Açılmış eski site klasörünü argüman olarak verin.')
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL zorunludur.')
if ((process.env.STORAGE_DRIVER || 'local') !== 'local') throw new Error('Bu içe aktarma yerel depolama içindir. STORAGE_DRIVER=local kullanın.')

const client = postgres(process.env.DATABASE_URL)
const db = drizzle(client)
const uploadRoot = resolve(process.cwd(), process.env.LOCAL_UPLOAD_DIR?.trim() || '.data/uploads')

function mediaUuid(data: Uint8Array, label: string) {
  const hex = createHash('sha256').update(data).update(label).digest('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`
}

async function importMedia(relativePath: string, altText: string) {
  const source = await readFile(join(sourceRoot, 'docs', 'img', relativePath))
  const isPdf = relativePath.toLowerCase().endsWith('.pdf')
  if (source.byteLength > (isPdf ? 12 : 8) * 1024 * 1024) throw new Error(`Dosya çok büyük: ${relativePath}`)
  if (isPdf && source.subarray(0, 5).toString('ascii') !== '%PDF-') throw new Error(`Geçersiz PDF: ${relativePath}`)
  const id = mediaUuid(source, relativePath)
  const extension = isPdf ? 'pdf' : 'webp'
  const storageKey = `uploads/${id}.${extension}`
  const output = isPdf ? source : await sharp(source, { failOn: 'error', limitInputPixels: 40_000_000 })
    .rotate().resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true }).webp({ quality: 86 }).toBuffer()
  const metadata = isPdf ? null : await sharp(output).metadata()
  await mkdir(uploadRoot, { recursive: true })
  await writeFile(join(uploadRoot, `${id}.${extension}`), output)
  await db.insert(mediaFiles).values({
    id,
    storageKey,
    filename: basename(relativePath).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180),
    mimeType: isPdf ? 'application/pdf' : 'image/webp',
    size: output.byteLength,
    altText,
    width: metadata?.width || null,
    height: metadata?.height || null,
  }).onConflictDoNothing({ target: mediaFiles.storageKey })
  return id
}

async function ensureCategory(name: string, slug: string) {
  const [inserted] = await db.insert(projectCategories).values({ name, slug }).onConflictDoNothing({ target: projectCategories.slug }).returning({ id: projectCategories.id })
  const [existing] = inserted ? [inserted] : await db.select({ id: projectCategories.id }).from(projectCategories).where(eq(projectCategories.slug, slug)).limit(1)
  if (!existing) throw new Error(`Kategori bulunamadı: ${slug}`)
  return existing.id
}

async function ensureTechnology(projectId: string, name: string, slug: string) {
  const [inserted] = await db.insert(technologies).values({ name, slug }).onConflictDoNothing({ target: technologies.slug }).returning({ id: technologies.id })
  const [existing] = inserted ? [inserted] : await db.select({ id: technologies.id }).from(technologies).where(eq(technologies.slug, slug)).limit(1)
  if (!existing) throw new Error(`Teknoloji bulunamadı: ${slug}`)
  await db.insert(projectTechnologies).values({ projectId, technologyId: existing.id }).onConflictDoNothing()
}

try {
  const careerSections = [
    { key: 'about:kariyer', title: 'Kariyer yolculuğum', content: '2019–2020 döneminde Enka İnşaat ve Sanayi A.Ş. bilgi işlem stajıyla iş hayatına adım attım. 2022 yılında ACME HOLDİNG A.Ş. bilgi sistemleri stajının ardından yazılım uzman yardımcısı olarak çalışmaya başladım; 2024–2026 döneminde yazılım uzmanı ve veritabanı yöneticisi görevini üstlendim.', sortOrder: 15 },
    { key: 'about:universite-projeleri', title: 'Eğitimden uygulamaya', content: 'İstanbul Arel Üniversitesi Bilgisayar Programcılığı eğitimimde hastane ve aile hekimliği randevu sistemleri, Chicol ticari otomasyon projesi ve Flutter ile bir kripto varlık takip uygulaması geliştirdim. Bu projeler web ve mobil geliştirme pratiğimin temelini oluşturdu.', sortOrder: 25 },
    { key: 'egitimden-urune', title: 'Eğitimden gerçek ürünlere', content: 'Bilgisayar Programcılığı eğitiminde ASP.NET MVC ve Flutter ile projeler geliştirdim. Sonrasında kurumsal yazılım, veritabanı yönetimi ve Kernela Soft çatısı altındaki ürün çalışmalarına odaklandım.', sortOrder: 15 },
  ] as const
  for (const section of careerSections) await db.insert(homepageSections).values(section).onConflictDoNothing({ target: homepageSections.key })

  const educationEntries = [
    { school: 'İstanbul Arel Üniversitesi', department: 'Bilgisayar Programcılığı', degree: 'Ön lisans', description: '2020–2022. Web Programlama I ve II, Mobil Programlama ve bitirme projesi kapsamında uygulamalar geliştirdim.', sortOrder: 5 },
    { school: 'Erhan Gedikbaşı Çok Programlı Anadolu Lisesi', department: 'Bilişim Teknolojileri', degree: null, description: '2016–2018 döneminde Bilişim Teknolojileri alanında eğitim.', sortOrder: 20 },
  ] as const
  for (const entry of educationEntries) {
    const [existing] = await db.select({ id: educations.id }).from(educations).where(eq(educations.school, entry.school)).limit(1)
    if (!existing) await db.insert(educations).values(entry)
  }
  const [anadolu] = await db.select({ id: educations.id, department: educations.department, degree: educations.degree, description: educations.description }).from(educations).where(eq(educations.school, 'Anadolu Üniversitesi')).limit(1)
  if (anadolu) await db.update(educations).set({
    department: anadolu.department || 'Yönetim Bilişim Sistemleri',
    degree: anadolu.degree || 'Lisans (Açıköğretim)',
    description: anadolu.description === '2023 yılından bu yana devam eden üniversite eğitimi.' ? '2023’ten bu yana DGS ile geçiş yaptığım Yönetim Bilişim Sistemleri programında öğrenimime devam ediyorum.' : anadolu.description,
  }).where(eq(educations.id, anadolu.id))
  const [meslek] = await db.select({ id: educations.id, department: educations.department, degree: educations.degree, description: educations.description }).from(educations).where(eq(educations.school, 'Mehmet Ali Büyükhanlı Mesleki ve Teknik Anadolu Lisesi')).limit(1)
  if (meslek) await db.update(educations).set({
    department: meslek.department || 'Bilişim Teknolojileri (Web Programcılığı)',
    degree: meslek.degree || 'Mesleki lise',
    description: meslek.description === 'Bilişim Teknolojileri alanında eğitim.' ? '2018–2020 döneminde Web Programcılığı alanında eğitim.' : meslek.description,
  }).where(eq(educations.id, meslek.id))

  const experienceEntries = [
    { company: 'ACME HOLDİNG A.Ş.', position: 'Yazılım Uzmanı / Database Administrator', employmentType: 'Tam zamanlı', summary: '2024–2026. Yazılım uzmanlığı ve şirket veritabanı sisteminin yönetimi. Önceki yazılım uzman yardımcılığı görevinden terfi ederek bu role geçtim.', sortOrder: 0 },
    { company: 'ACME HOLDİNG A.Ş.', position: 'Yazılım Uzman Yardımcısı', employmentType: 'Tam zamanlı', summary: '2022–2024. Üniversite stajımın ardından aynı şirkette yazılım uzman yardımcısı olarak çalıştım.', sortOrder: 5 },
    { company: 'ACME HOLDİNG A.Ş.', position: 'Bilgi Sistemleri Stajyeri', employmentType: 'Staj', summary: '2022. Üniversite zorunlu stajı kapsamında 30 iş günü bilgi sistemleri stajı.', sortOrder: 10 },
  ] as const
  for (const entry of experienceEntries) {
    const [existing] = await db.select({ id: experiences.id }).from(experiences).where(and(eq(experiences.company, entry.company), eq(experiences.position, entry.position), isNull(experiences.deletedAt))).limit(1)
    if (!existing) await db.insert(experiences).values(entry)
  }
  const [enka] = await db.select({ id: experiences.id, summary: experiences.summary }).from(experiences).where(and(eq(experiences.company, 'Enka İnşaat ve Sanayi A.Ş.'), isNull(experiences.deletedAt))).limit(1)
  if (enka && !enka.summary) await db.update(experiences).set({ summary: '2019–2020. Bilgi işlem stajında ağ, donanım ve yazılım süreçleriyle tanıştım.' }).where(eq(experiences.id, enka.id))

  const categoryId = await ensureCategory('Eğitim Projeleri', 'egitim-projeleri')
  const projectEntries = [
    { title: 'Hastane Randevu Sistemi', slug: 'hastane-randevu-sistemi', summary: 'ASP.NET MVC ile geliştirdiğim hastane randevu web uygulaması.', content: '<h2>Proje hakkında</h2><p>İstanbul Arel Üniversitesi Bilgisayar Programcılığı ikinci sınıf güz döneminde Web Programlama I dersi için geliştirdiğim hastane randevu sistemi.</p>', cover: 'projects/project-1.jpg', tech: [['ASP.NET MVC', 'asp-net-mvc']], sortOrder: 20 },
    { title: 'Chicol Ticari Otomasyon', slug: 'chicol-ticari-otomasyon', summary: 'Tişört satışına yönelik ASP.NET MVC tabanlı e-ticaret ve ticari otomasyon uygulaması.', content: '<h2>Proje hakkında</h2><p>Bilgisayar Programcılığı ikinci sınıf bahar döneminde Web Programlama II final projesi olarak hazırladığım uygulama. Kadın, erkek ve çocuk ürünleri için ayrı listeleme ekranları tasarladım.</p>', cover: 'projects/project-2.jpg', tech: [['ASP.NET MVC', 'asp-net-mvc']], sortOrder: 30 },
    { title: 'Crypto Wallet', slug: 'crypto-wallet', summary: 'Kripto varlıkları ve güncel değerlerini listeleyen Flutter mobil uygulaması.', content: '<h2>Proje hakkında</h2><p>Bilgisayar Programcılığı ikinci sınıf bahar döneminde Mobil Programlama dersi final projesi için Flutter ve Dart ile geliştirdiğim mobil uygulama.</p>', cover: 'projects/crypto_wallet.jpg', tech: [['Flutter', 'flutter'], ['Dart', 'dart']], sortOrder: 40 },
    { title: 'Aile Hekimliği Randevu Sistemi', slug: 'aile-hekimligi-randevu-sistemi', summary: 'Aile hekimi seçimi ve randevu oluşturma akışını içeren ASP.NET MVC bitirme projesi.', content: '<h2>Proje hakkında</h2><p>İstanbul Arel Üniversitesi Bilgisayar Programcılığı bitirme projesi olarak geliştirdiğim aile hekimliği randevu sistemi. Kullanıcıların aile hekimi seçip randevu oluşturmasını hedefledim.</p>', cover: 'projects/fmc.jpg', tech: [['ASP.NET MVC', 'asp-net-mvc']], sortOrder: 50 },
  ] as const
  for (const entry of projectEntries) {
    const coverMediaId = await importMedia(entry.cover, `${entry.title} ekran görüntüsü`)
    const [inserted] = await db.insert(projects).values({ title: entry.title, slug: entry.slug, summary: entry.summary, content: entry.content, categoryId, coverMediaId, role: 'Geliştirme', isFeatured: false, status: 'published', sortOrder: entry.sortOrder }).onConflictDoNothing({ target: projects.slug }).returning({ id: projects.id })
    const [existing] = inserted ? [inserted] : await db.select({ id: projects.id, coverMediaId: projects.coverMediaId }).from(projects).where(eq(projects.slug, entry.slug)).limit(1)
    if (!existing) throw new Error(`Proje bulunamadı: ${entry.slug}`)
    if ('coverMediaId' in existing && !existing.coverMediaId) await db.update(projects).set({ coverMediaId }).where(eq(projects.id, existing.id))
    for (const [name, slug] of entry.tech) await ensureTechnology(existing.id, name, slug)
  }

  const chicol = (await db.select({ id: projects.id }).from(projects).where(eq(projects.slug, 'chicol-ticari-otomasyon')).limit(1))[0]
  if (chicol) {
    const gallery = [
      ['projects/chicol/kadın-ürünleri-listeleme.png', 'Chicol kadın ürünleri listeleme ekranı'],
      ['projects/chicol/erkek-ürünleri-listeleme.png', 'Chicol erkek ürünleri listeleme ekranı'],
      ['projects/chicol/çocuk-ürünleri-listeleme.png', 'Chicol çocuk ürünleri listeleme ekranı'],
    ] as const
    for (const [index, [path, alt]] of gallery.entries()) {
      const mediaId = await importMedia(path, alt)
      const [existing] = await db.select({ id: projectImages.id }).from(projectImages).where(and(eq(projectImages.projectId, chicol.id), eq(projectImages.mediaId, mediaId))).limit(1)
      if (!existing) await db.insert(projectImages).values({ projectId: chicol.id, mediaId, sortOrder: index })
    }
  }

  const certEntries = [
    { name: 'Web Tasarımın Temelleri(HTML&CSS)', issuer: 'Bilgeİş', category: 'Web geliştirme', image: 'Web_Tasarımının_Temelleri__HTML_.jpg', pdf: 'Web_Tasarımının_Temelleri_(HTML_amp;_CSS)-Sertifika_201190.pdf', date: '2021-06-12' },
    { name: 'Bilgi Teknolojilerine Giriş', issuer: 'Bilgi Teknolojileri ve İletişim Kurumu - BTK - ICT', category: 'Bilişim', image: 'Bilgi_Teknolojilerine_Giri__Sert.jpg', pdf: 'Bilgi_Teknolojilerine_Giri__Sertifika.pdf', date: '2021-03-06' },
    { name: 'Dijital Okuryazarlık 101', issuer: 'Turkcell Geleceği Yazanlar', category: 'Dijital okuryazarlık', image: 'dijitalokuryazarlık101.jpg' },
    { name: 'Dijital Okuryazarlık 201', issuer: 'Turkcell Geleceği Yazanlar', category: 'Dijital okuryazarlık', image: 'dijitalokuryazarlık201.jpg' },
    { name: 'Dijital Okuryazarlık 301', issuer: 'Turkcell Geleceği Yazanlar', category: 'Dijital okuryazarlık', image: 'dijitalokuryazarlık301.jpg' },
    { name: 'Dijital Okuryazarlık 401', issuer: 'Turkcell Geleceği Yazanlar', category: 'Dijital okuryazarlık', image: 'dijitalokuryazarlık401.jpg' },
    { name: 'Microsoft Word Temelleri', issuer: 'Bilgi Teknolojileri ve İletişim Kurumu - BTK - ICT', category: 'Bilişim', image: 'Microsoft_Word_Temelleri_Sertifi.jpg', pdf: 'Microsoft_Word_Temelleri_Sertifika.pdf', date: '2021-03-07' },
    { name: 'Programlamanın Temelleri', issuer: 'Bilgeİş', category: 'Programlama', image: 'Programlamanın_Temelleri-Sertifi.jpg', pdf: 'Programlamanın_Temelleri-Sertifika_182645.pdf', date: '2021-03-18' },
    { name: 'Web Programlama 201', issuer: 'Turkcell Geleceği Yazanlar', category: 'Web geliştirme', image: 'webprogramlama201.jpg' },
    { name: 'Web Programlama 101', issuer: 'Turkcell Geleceği Yazanlar', category: 'Web geliştirme', image: 'webprogramlama101.jpg' },
    { name: 'HTML', issuer: 'Bilgeİş', category: 'Web geliştirme', image: 'HTML-Sertifika_201012.jpg', pdf: 'HTML-Sertifika_201012.pdf', date: '2021-06-10' },
    { name: 'CSS', issuer: 'Bilgeİş', category: 'Web geliştirme', image: 'CSS-Sertifika_201272.pdf_1 895x552.jpg', pdf: 'CSS-Sertifika_201272.pdf', date: '2021-06-12' },
    { name: 'C# ile Algoritma ve Programlama 101', issuer: 'Turkcell Geleceği Yazanlar', category: 'Programlama', image: 'csharpilealgoritmaveprogramlama.jpg', date: '2021-03-02' },
    { name: 'Flutter ile Uygulama Geliştirme', issuer: 'Google Dijital Atölye', category: 'Mobil geliştirme', image: 'flutter-ile-uygulama-gelistirme.jpg', pdf: 'Flutter ile Uygulama Geliştirin Sertifika.pdf', date: '2022-09-16' },
  ] as const
  for (const [index, entry] of certEntries.entries()) {
    const imageMediaId = await importMedia(`certificate/${entry.image}`, `${entry.name} sertifikası`)
    const pdfMediaId = 'pdf' in entry && entry.pdf ? await importMedia(`certificate/pdf/${entry.pdf}`, `${entry.name} sertifika PDF'i`) : null
    const [existing] = await db.select({ id: certificates.id, imageMediaId: certificates.imageMediaId, pdfMediaId: certificates.pdfMediaId, issuedAt: certificates.issuedAt }).from(certificates).where(and(eq(certificates.name, entry.name), eq(certificates.issuer, entry.issuer))).limit(1)
    const issuedAt = 'date' in entry && entry.date ? new Date(`${entry.date}T00:00:00.000Z`) : null
    if (!existing) await db.insert(certificates).values({ name: entry.name, issuer: entry.issuer, category: entry.category, imageMediaId, pdfMediaId, issuedAt, sortOrder: index })
    else await db.update(certificates).set({ imageMediaId: existing.imageMediaId || imageMediaId, pdfMediaId: existing.pdfMediaId || pdfMediaId, issuedAt: issuedAt || existing.issuedAt }).where(eq(certificates.id, existing.id))
  }

  console.log('Eski portföydeki doğrulanmış kariyer, eğitim, proje, görsel ve sertifika içerikleri içe aktarıldı.')
}
finally {
  await client.end()
}
