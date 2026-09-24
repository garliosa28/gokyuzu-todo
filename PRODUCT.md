# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Tek kullanıcı: uygulamayı yapan kişi, kendisi için. Başka kullanıcı, ekip ya da paylaşım yok. Supabase'de yeni kayıtlar kapalı.

Görevleri iki farklı anda ele alıyor:
- **Gün içinde:** Aklına geldiği anda, dağınık anlarda (yolda, işte, yatarken) telefondan hızlıca yakalıyor.
- **Planlama anında:** Sonra bir ara bu görevleri düzenliyor, yani bir listeye, bugüne ya da ileri bir tarihe dağıtıyor.

## Product Purpose

Kişisel, sade bir yapılacaklar uygulaması. iPhone'da ve bilgisayarda aynı veriyle çalışıyor, internet olmadan da tam kullanılabiliyor. Mevcut todo uygulamalarının yerine, sahibinin kendi günlük akışına uyan bir araç olması amaçlanıyor ("kendime özel").

Başarı: gün içinde aklına gelen hiçbir şeyin kaybolmaması ve her sabah günün net görünmesi.

## Positioning

Genel amaçlı bir todo ürünü değil, tek bir kişinin gününe göre biçimlenmiş bir araç. Ayırt edici mekanizmalar:
- Bugün odaklı açılış
- Önceki günlerden kalanlar için sabah gözden geçirmesi (Bugün / Ertele / Sil)
- Yerel öncelikli (local-first) çalışma

Özellik sayısı bilerek düşük tutuluyor.

## Operating Context

- **Birincil cihaz:** iPhone. Uygulama Safari'den "Ana Ekrana Ekle" ile kurulan bir PWA. Tek elle, kısa anlarda, bazen internetsiz kullanılıyor.
- **İkincil cihaz:** Bilgisayarda tarayıcı. Planlama ve düzenleme için.
- **Senkron:** İki cihaz Supabase üzerinden senkronize oluyor. Giriş, e-postaya gelen kodla yapılıyor. iPhone'da ana ekrana eklenen uygulama Safari'den ayrı bir depolama kullandığı için link yerine kod seçildi.
- **Günün ritmi:** Uygulama Bugün ekranıyla açılıyor. Günün ilk açılışında önceki günlerden kalan görevler bir kartta soruluyor.

## Capabilities and Constraints

**Mevcut özellikler:**
- Görev ekleme, tamamlama, silme ve başlık düzenleme
- Son tarih
- Bağlam listeleri: Gelen Kutusu silinemez, iş, ev gibi listeler eklenebilir
- Bugün görünümü (gecikmiş + bugün)
- Sabah gözden geçirmesi
- Cihazlar arası senkron ("son yazan kazanır")
- Çevrimdışı çalışma

**Terimler:** Gelen Kutusu, Bugün, Gecikmiş, Dünden kalanlar, Ertele, Sonra bakarım.

**Teknik kısıtlar:**
- React + TypeScript + Vite, Dexie (IndexedDB), Supabase (ücretsiz katman)
- vite-plugin-pwa
- Service worker ve kurulum HTTPS gerektiriyor

**Günün düzeni:** Kullanıcının günü hem bağlamla (iş, ev, alışveriş…) hem zaman dilimiyle (sabah, öğlen, akşam) şekilleniyor. Bağlam listeleri mevcut. Görevlere isteğe bağlı bir "günün bölümü" (sabah / öğlen / akşam) alanı eklendi (2026-09-24); Bugün ekranı görevleri bu bölümlere göre gruplar. Bkz. [briefs/gokyuzu-hareket.md](briefs/gokyuzu-hareket.md).

**Kapsam dışı (şimdilik):**
- Öncelik, etiket, not, alt görev
- Tekrarlayan görevler ve rutinler
- Hatırlatma ve push bildirimi
- Sürükle-bırak sıralama
- Dışa aktarma

## Brand Commitments

- **Ad:** Henüz yok. Manifest ve sayfa başlığında geçici olarak "Todo" kullanılıyor.
- **Dil:** Arayüz metinleri Türkçe.

## Evidence on Hand

- Planlama ve kararlar: [PLAN.md](PLAN.md)
- Kurulum: [SETUP.md](SETUP.md)
- Biletler: [biletler/](biletler/)
- İnceleme raporları: [INCELEME-kod.md](INCELEME-kod.md), [INCELEME-standart-ve-spec.md](INCELEME-standart-ve-spec.md)
- İkon: `public/icon-*.png`, `scripts/make-icons.mjs` ile üretiliyor

Tek kullanıcılı kişisel bir araç olduğu için kullanıcı sayısı, yorum ya da vaka çalışması yok ve uydurulmamalı.

## Product Principles

1. **Hiçbir şey kaybolmaz.** Yakalama anında sürtünme olmamalı. Yazılan metin; bağlantı yokken, sayfa yenilenirken ya da iki cihazda çakışma olduğunda da korunmalı.
2. **Bugün önce gelir.** Uygulama "şimdi ne yapmalıyım"ı yanıtlayarak açılır. Geçmiş, suçluluk yaratan bir liste değil, tek dokunuşla karar verilen bir sorudur.
3. **Az ama yerinde.** Yeni özellik ancak sahibinin gerçek günlük akışında karşılığı varsa eklenir.
4. **Önce yerel.** Uygulama internetsiz de tam çalışır; senkron arka planda ve görünür bir durumla işler.
