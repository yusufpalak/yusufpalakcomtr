# yusufpalak.com.tr

Kişisel portfolyo ve içerik yönetim platformum.

Bu projeyi yalnızca özgeçmişimi sergileyen statik bir web sitesi olarak değil; projelerimi, deneyimlerimi, teknik içeriklerimi ve geliştirdiğim ürünleri tek bir yerden yönetebileceğim gerçek bir web uygulaması olarak geliştirdim.

🌐 **Canlı:** [yusufpalak.com.tr](https://yusufpalak.com.tr)  
💼 **LinkedIn:** [linkedin.com/in/yusufpalak](https://www.linkedin.com/in/yusufpalak/)

---

## Hakkımda

Ben **Yusuf Palak**, web tabanlı uygulamalar, SaaS ürünleri, kurumsal yazılımlar ve veritabanı ağırlıklı sistemler geliştiren bir yazılım geliştiriciyim.

Backend, frontend ve veritabanı taraflarında çalışıyor; bir ürünün fikir aşamasından canlı ortama alınmasına kadar olan sürecin farklı noktalarında aktif rol alıyorum.

Aynı zamanda **Kernela Soft** bünyesinde ürün geliştirme çalışmalarımı sürdürüyorum. Burada özellikle restoran ve kafe işletmelerine yönelik geliştirdiğimiz **DineX** başta olmak üzere farklı yazılım projeleri üzerinde çalışıyorum.

Bu site de hem çalışmalarımı sergilediğim hem de kullandığım teknolojileri gerçek bir ürün üzerinde uyguladığım projelerden biri.

---

## Proje hakkında

İlk hedef basit bir kişisel portfolyo oluşturmaktı. Ancak proje zaman içerisinde kendi yönetim paneli, içerik sistemi ve medya altyapısı bulunan daha kapsamlı bir uygulamaya dönüştü.

Site içerisindeki içeriklerin büyük bölümü kaynak kod değiştirilmeden yönetim paneli üzerinden düzenlenebiliyor.

Başlıca özellikler:

- Kişisel portfolyo ve özgeçmiş
- Proje yönetimi
- İş deneyimi ve eğitim yönetimi
- Sertifika yönetimi
- Blog altyapısı
- Yönetim paneli
- Medya kütüphanesi
- İletişim formu ve admin gelen kutusu
- Türkçe ve İngilizce içerik yönetimi
- Blog içerikleri için çeviri desteği
- SEO alanlarının içerik bazlı yönetimi
- Local ve S3 uyumlu dosya depolama
- Responsive tasarım
- Docker ile production deployment

---

## Yönetim paneli

Projenin önemli parçalarından biri kendi geliştirdiğim yönetim paneli.

Portfolyo sitesinde görünen içerikleri doğrudan veritabanından değiştirmek yerine `/admin` üzerinden yönetebiliyorum.

Panel üzerinden:

- projeler,
- blog yazıları,
- deneyimler,
- eğitimler,
- sertifikalar,
- medya dosyaları,
- site içerikleri,
- iletişim mesajları

yönetilebiliyor.

Bu yapı sayesinde site yalnızca kişisel bir landing page olmaktan çıkıp küçük ölçekli bir **CMS** mantığında çalışıyor.

---

## Blog sistemi

Site içerisinde kendi blog altyapım bulunuyor.

Her blog yazısı için ayrı olarak:

- başlık,
- slug,
- özet,
- içerik,
- kapak görseli,
- okuma süresi,
- SEO başlığı,
- SEO açıklaması

yönetilebiliyor.

Blog yapısı çoklu dil desteğiyle birlikte çalışıyor.

Türkçe içerikler ana içerik olarak tutulurken İngilizce karşılıkları ayrıca yönetilebiliyor.

Bir yazının İngilizce versiyonu bulunmuyorsa İngilizce blog içerisinde yayınlanmıyor.

---

## Çoklu dil desteği

Public site Türkçe ve İngilizce olarak çalışıyor.

Türkçe site standart URL yapısını kullanırken İngilizce içerikler:

```text
/en/...
```

altında yayınlanıyor.

Blog içeriklerinde sadece arayüz değil, içeriğin kendisi de dile göre ayrı yönetiliyor.

Örneğin aynı blog yazısının:

- başlığı,
- slug'ı,
- özeti,
- içeriği,
- SEO alanları

Türkçe ve İngilizce için farklı olabiliyor.

---

## LibreTranslate entegrasyonu

Blog içeriklerini İngilizceye aktarırken süreci hızlandırmak için **LibreTranslate** entegrasyonu ekledim.

Yönetim panelinde Türkçe içerik tamamlandıktan sonra İngilizce sekmesinden otomatik çeviri yapılabiliyor.

Sistem:

- başlığı,
- özeti,
- içeriği,
- SEO alanlarını

çeviriyor ve hedef dile uygun slug ile okuma süresini yeniden oluşturuyor.

Otomatik çeviri doğrudan yayınlanmıyor. Önce editöre aktarılıyor ve gerekli kontroller yapıldıktan sonra kaydediliyor.

Böylece otomasyonu kullanırken içerik üzerindeki manuel kontrolü koruyorum.

---

## Medya kütüphanesi

Yönetim panelinde merkezi bir medya kütüphanesi bulunuyor.

Desteklenen dosyalar:

- JPG
- PNG
- WebP
- AVIF
- PDF

Yüklenen görseller otomatik olarak **WebP** formatına dönüştürülüyor.

Medya kütüphanesindeki dosyalar proje, blog ve sertifika içeriklerinde tekrar kullanılabiliyor.

Ayrıca kullanımda olan bir dosyanın yanlışlıkla silinmesini engelleyen kontroller bulunuyor.

---

## Dosya depolama

Dosya sistemi geliştirme ve production ortamlarına göre farklı depolama yöntemlerini destekliyor.

### Local Storage

Yerel geliştirme sırasında dosyalar uygulamanın kendi storage alanında tutulabiliyor.

### S3 Storage

Production ortamında ise AWS S3 veya S3 uyumlu object storage servisleri kullanılabiliyor.

Uygulama aynı zamanda daha önce local storage üzerinde oluşturulan dosyaları kullanmaya devam edebilecek şekilde tasarlandı.

Bu sayede storage altyapısı değiştirildiğinde mevcut içeriklerin tamamen taşınması zorunlu değil.

---

## İletişim sistemi

Sitedeki iletişim formundan gönderilen mesajlar veritabanına kaydediliyor.

Mesajlar yönetim panelindeki gelen kutusu üzerinden görüntülenebiliyor.

Bu sayede iletişim formu harici bir form servisine bağımlı olmadan uygulamanın kendi altyapısı içerisinde çalışıyor.

---

## Eski portfolyo verilerinin taşınması

Bu projeden önce kullandığım statik portfolyo sitesindeki gerçek içerikleri yeni sisteme taşımak için ayrıca bir migration/import script'i geliştirdim.

Script eski portfolyo arşivinden:

- eğitim kayıtlarını,
- kariyer bilgilerini,
- okul projelerini,
- proje görsellerini,
- sertifikaları,
- sertifika belgelerini

tespit ederek yeni sisteme aktarabiliyor.

Eski tema içerisindeki demo içerikler aktarılmıyor.

Ayrıca mevcut yönetim paneli kayıtlarının veya daha önce yüklenmiş medyaların üzerine yazılmıyor.

Bu araç özellikle eski statik yapıyı yeni veritabanı tabanlı sisteme geçirirken manuel veri girişini azaltmak için geliştirildi.

---

## Portfolyo seed sistemi

Projede başlangıç verilerini oluşturmak için ayrı bir seed yapısı bulunuyor.

```bash
pnpm db:seed:content
```

Seed işlemi portfolyonun başlangıç verilerini oluşturuyor.

Bunlar arasında:

- hakkımda içeriği,
- eğitimler,
- deneyimler,
- sertifikalar,
- projeler,
- DineX,
- Kernela Soft,
- site istatistikleri

yer alıyor.

Seed işlemi tekrar çalıştırılabilecek şekilde tasarlandı ve mevcut kullanıcı verilerini gereksiz yere ezmiyor.

---

## Öne çıkan teknik detaylar

Bu projede özellikle içerik yönetimi ve sürdürülebilirlik tarafına önem verdim.

### Dinamik içerik yapısı

Portfolyo içeriğinin önemli bölümü frontend içerisine hard-code edilmek yerine veritabanından yönetiliyor.

### Çoklu dil mimarisi

Dil desteği yalnızca arayüz çevirisinden oluşmuyor. Blog gibi içeriklerin de locale bazlı karşılıkları bulunuyor.

### Storage abstraction

Medya sistemi local filesystem veya S3 üzerinde çalışabilecek şekilde tasarlandı.

### Görsel optimizasyonu

Yüklenen görseller WebP'ye dönüştürülerek depolama alanı ve web performansı açısından optimize ediliyor.

### Güvenli medya silme

Başka bir içerik tarafından kullanılan medya dosyasının doğrudan silinmesi engelleniyor.

### İçerik migration araçları

Eski sistemden yeni sisteme geçiş için proje özelinde import araçları bulunuyor.

### Container deployment

Uygulama Docker üzerinde production ortamına alınabilecek şekilde hazırlanmış durumda.

---

## Proje yapısı

Uygulama genel olarak üç ana parçadan oluşuyor:

```text
Public Site
    │
    ├── Portfolio
    ├── Projects
    ├── Blog
    ├── Certificates
    └── Contact
           │
           ▼
     Application / API
           │
    ┌──────┴──────┐
    │             │
PostgreSQL      Storage
               Local / S3
    │
    ▼
Admin Panel
```

Public site ziyaretçilere içerikleri sunarken yönetim paneli aynı verilerin yönetilmesini sağlıyor.

---

## Kurulum

Bağımlılıkları yüklemek için:

```bash
pnpm install
```

Geliştirme ortamını başlatmak için:

```bash
pnpm dev
```

Veritabanı başlangıç içeriğini oluşturmak için:

```bash
pnpm db:seed:content
```

Docker image oluşturmak için:

```bash
docker build -t yusuf-palak .
```

Gerekli ortam değişkenlerinin örnekleri proje içerisindeki `.env.example` dosyasında bulunuyor.

---

## DineX

Portfolyoda yer verdiğim ana projelerden biri **DineX**.

DineX'i restoran ve kafelerin dijital operasyonlarını tek bir sistem altında toplamaya yönelik bir SaaS ürünü olarak geliştiriyorum.

Proje başlangıçta QR menü yönetimi üzerine kurulurken zaman içerisinde farklı işletme ihtiyaçlarına yönelik modüllerle genişlemeye başladı.

DineX geliştirme sürecinde ürün tasarımı, frontend, backend, veritabanı mimarisi, deployment ve production altyapısı gibi farklı alanlarla doğrudan ilgileniyorum.

Bu nedenle DineX benim için yalnızca portfolyoya eklenmiş bir proje değil, aktif olarak geliştirdiğim bir ürün.

---

## Kernela Soft

**Kernela Soft**, yazılım ürünleri ve işletmelere özel dijital çözümler geliştirdiğimiz yapı.

Burada hem müşteri projeleri hem de kendi SaaS ürünlerimiz üzerinde çalışıyoruz.

Web uygulamaları, yönetim sistemleri, dijital dönüşüm projeleri ve sektörel yazılım çözümleri geliştirdiğimiz başlıca alanlar arasında.

Portfolyo sitesinde de zaman içerisinde Kernela Soft bünyesinde geliştirdiğim ve katkı sağladığım projeleri paylaşmaya devam ediyorum.

---

## Neden bu projeyi geliştirdim?

Bir geliştiricinin portfolyosunun yalnızca kullandığı teknolojileri listelemek yerine bunları gerçekten kullandığı bir proje olması gerektiğini düşünüyorum.

Bu nedenle kendi portfolyo sitemi hazır bir tema üzerinde birkaç metin değiştirerek oluşturmak yerine;

- veritabanı,
- admin paneli,
- authentication,
- medya yönetimi,
- çoklu dil,
- içerik yönetimi,
- object storage,
- çeviri servisi,
- Docker deployment

gibi gerçek bir web uygulamasında ihtiyaç duyabileceğim parçaları kullanarak geliştirdim.

Ortaya çıkan proje hem yaptığım işleri sergilediğim kişisel web sitem hem de geliştirme yaklaşımımı gösteren projelerden biri haline geldi.

---

## Yusuf Palak

**Software Developer · Kernela Soft**

🌐 [yusufpalak.com.tr](https://yusufpalak.com.tr)  
💼 [LinkedIn](https://www.linkedin.com/in/yusufpalak/)
