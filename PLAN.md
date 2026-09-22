# Kişisel Todo Uygulaması — Plan

> Durum: **Planlama.** Henüz kod yok.
> Tarih: 2026-09-22

## 1. Amaç

Sadece benim kullanacağım, iPhone'da ve bilgisayarda çalışan, senkronize ve çevrimdışı çalışabilen sade bir todo uygulaması. Kodu kendim okuyup değiştirebileceğim.

## 2. Alınan kararlar

| # | Konu | Karar | Gerekçe |
|---|------|-------|---------|
| Q1 | Platform | Mobil öncelikli **PWA** | Kurulumsuz, mağaza/Apple ücreti yok, bilgisayarda da çalışır |
| Q2 | Senkronizasyon | **Evet**, cihazlar arası | Telefon + bilgisayar |
| Q3 | Görev alanları (MVP) | Başlık, tamamlandı, son tarih, liste | Küçük başla, kullandıkça büyüt |
| Q4 | Geliştirici | Kodu ben okuyup değiştireceğim | Sade, anlaşılır stack |
| Q6 | Stack | **TypeScript + React + Vite** | Yaygın, öğrenmesi faydalı |
| Q7 | Telefon | **iPhone** | PWA "Ana Ekrana Ekle" ile kurulacak |
| Q8 | Cihazlar | **Telefon + bilgisayar (tarayıcı)** | |
| Q9 | Çevrimdışı | **Evet, tam çalışsın** ("e" = evet varsayıldı) | Aklıma geleni anında yazabilmeliyim |
| Q10 | Backend | **Supabase (ücretsiz katman)** | Auth + Postgres hazır, sunucu yönetimi yok |

## 3. Mimari

```
[iPhone PWA]  ─┐
               ├─ React UI ─ yerel DB (IndexedDB / Dexie) ─ senkron katmanı ─ Supabase (Postgres + Auth)
[Masaüstü tarayıcı] ─┘
```

- **Local-first:** UI her zaman yerel veritabanından (IndexedDB) okur ve oraya yazar. Uygulama internet olmadan da tamamen çalışır.
- **Senkron katmanı:** Yerel değişiklikleri bir kuyrukta biriktirir. İnternet olduğunda Supabase'e gönderir, sonra `updated_at > son_senkron` olan kayıtları çeker. Tetikleyiciler: uygulama açılışı, `online` olayı, sekmeye geri dönüş ve periyodik kontrol.
- **Çakışma çözümü:** Kayıt bazında **son yazan kazanır**, `updated_at`'e göre. Tek kullanıcı için yeterli.
- **Silme:** Doğrudan silme yok, **soft delete** (`deleted_at`). Böylece silme işlemi de diğer cihaza senkronize olur.
- **ID'ler:** İstemcide üretilen UUID. Çevrimdışıyken de kayıt oluşturulabilir.

## 4. Teknoloji seçimleri

| Katman | Seçim |
|--------|-------|
| Dil | TypeScript |
| UI | React |
| Build | Vite |
| PWA | `vite-plugin-pwa` (service worker, manifest, offline önbellek) |
| Yerel DB | Dexie (IndexedDB sarmalayıcı) |
| Backend | Supabase (`@supabase/supabase-js`) |
| Stil | Sade CSS (gerekirse sonra Tailwind) |
| Hosting | Vercel / Netlify / Cloudflare Pages (ücretsiz, HTTPS; PWA için gerekli) |

## 5. Veri modeli

**lists**
| alan | tip |
|------|-----|
| id | uuid (PK) |
| user_id | uuid (auth.users) |
| name | text |
| sort_order | int |
| created_at / updated_at | timestamptz |
| deleted_at | timestamptz, null |

**tasks**
| alan | tip |
|------|-----|
| id | uuid (PK) |
| user_id | uuid |
| list_id | uuid (lists) |
| title | text |
| done | boolean |
| due_date | date, null |
| sort_order | int |
| created_at / updated_at | timestamptz |
| deleted_at | timestamptz, null |

- Supabase'de **Row Level Security** açık olacak, kural: `user_id = auth.uid()`.
- Yerel Dexie şeması aynı alanları kullanacak, bekleyen değişiklikler için ayrıca bir `outbox` tablosu olacak.

## 6. Kimlik doğrulama

- Supabase Auth ile **e-posta magic link** (şifre yok).
- Supabase panelinden **yeni kayıtlar kapatılacak**, yani sadece benim hesabım olacak.
- Oturum cihazda kalıcı olacak, her açılışta giriş yapmak gerekmeyecek.

## 7. MVP ekranları

1. **Giriş:** e-posta ile magic link.
2. **Liste seçici:** listeleri göster, ekle, yeniden adlandır, sil.
3. **Görev listesi:** seçili listedeki görevler. Hızlı ekleme alanı, tamamla/geri al, son tarih, silme.
4. **Bugün / Gecikmiş görünümü:** tüm listelerden bugün veya geçmiş tarihli görevler.
5. Senkron durumu göstergesi (çevrimdışı / senkronize ediliyor / güncel).

## 8. iPhone'a özel notlar

- Kurulum Safari'den yapılacak: Paylaş → **Ana Ekrana Ekle**.
- `apple-touch-icon`, `apple-mobile-web-app-capable` ve güvenli alan (safe-area / notch) boşlukları ayarlanacak.
- iOS, uzun süre açılmayan PWA'ların verilerini temizleyebiliyor. Supabase senkronu bu durumda yedek görevi görüyor.
- Push bildirimleri (iOS 16.4+ ve sadece kurulu PWA'da) **MVP dışında**.

## 9. Kapsam dışı (sonraya)

- Öncelik, etiketler, notlar, alt görevler
- Tekrarlayan görevler
- Hatırlatma / push bildirimleri
- Sürükle-bırak ile sıralama (ilk sürümde basit sıralama)
- Dışa aktarma (JSON)

## 10. Uygulama adımları (kodlamaya başlandığında)

1. Vite + React + TS projesi, `vite-plugin-pwa` ile manifest ve ikonlar
2. Supabase projesi: tablolar, RLS, auth ayarları (kayıt kapalı)
3. Dexie şeması ve yerel CRUD (önce internetsiz çalışan uygulama)
4. UI: listeler, görevler, Bugün görünümü
5. Senkron katmanı: outbox push, pull, son yazan kazanır
6. Giriş akışı
7. Deploy (Vercel vb.) ve iPhone'a kurulum testi
8. Çevrimdışı senaryo testleri (uçak modu → ekle → çevrimiçi → diğer cihazda gör)

## 11. Açık sorular

- **Q11: "Kendime özel" ne demek?** Henüz cevaplanmadı. Günlük akışım, özel görünümler veya iş/ev ayrımı gibi ihtiyaçlar MVP ekranlarını değiştirebilir.
- Uygulamanın adı ve görsel teması
- Hosting sağlayıcısının kesin seçimi (Vercel / Netlify / Cloudflare Pages)
