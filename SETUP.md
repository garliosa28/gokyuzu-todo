# Kurulum

Uygulama Supabase olmadan da çalışır; görevler yalnızca o cihazda kalır. Cihazlar arası senkron için aşağıdaki adımlar bir kez yapılır.

## 1. Yerelde çalıştırma

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # testler
npm run build      # üretim derlemesi (dist/)
```

Telefondan denemek için `npm run dev -- --host` ile başlatıp bilgisayarın yerel IP adresini (ör. `http://192.168.1.20:5173`) açabilirsin. Görev ekleme ve düzenleme orada da çalışır. Service worker (çevrimdışı açılış, "Ana Ekrana Ekle", yeni sürüm bandı) ise geliştirme sunucusunda hiç çalışmaz. Bunları denemek için derlenmiş sürümü kullan: `npm run build` ve ardından `npm run preview` ile `localhost` üzerinde ya da yayındaki **HTTPS** adresinde.

## 2. Supabase projesi

1. [supabase.com](https://supabase.com) → yeni proje (ücretsiz katman yeterli).
2. **SQL Editor** → [`supabase/schema.sql`](supabase/schema.sql) içeriğini yapıştırıp çalıştır.
3. **Authentication → Sign In / Providers**
   - **Email** açık kalsın.
   - **Allow new users to sign up** → **kapat** (uygulamayı yalnızca sen kullanacaksın).
4. **Authentication → Users → Add user → Create new user**: kendi e-postanı ekle, *Auto Confirm User* işaretli olsun. (Kayıt kapalı olduğu için hesabı burada elle açıyoruz.)
5. **Authentication → Emails → Magic Link** şablonunu kodu gösterecek şekilde değiştir, örneğin:

   ```html
   <h2>Giriş kodun</h2>
   <p style="font-size:28px;letter-spacing:4px"><strong>{{ .Token }}</strong></p>
   ```

   > Neden link değil de kod? iPhone'da ana ekrana eklenen uygulama Safari'den ayrı bir depolama kullanır. E-postadaki link Safari'de açılır ve oturum uygulamaya geçmez. Kodu uygulamanın içine yazınca bu sorun yaşanmaz.

6. **Project Settings → API**: `Project URL` ve `anon public` anahtarını kopyala.

## 3. Ortam değişkenleri

`.env.example` dosyasını `.env` olarak kopyala ve değerleri doldur:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

`anon` anahtarı tarayıcıya gömülür, bu normaldir. Verileri satır düzeyi güvenlik (RLS) korur. `service_role` anahtarını **asla** buraya koyma.

## 4. Yayına alma (Vercel örneği)

1. Projeyi bir GitHub reposuna gönder.
2. [vercel.com](https://vercel.com) → *Add New Project* → repoyu seç. Framework: Vite (otomatik algılanır).
3. *Environment Variables* bölümüne `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` ekle.
4. Deploy. Netlify ve Cloudflare Pages da aynı şekilde çalışır: build komutu `npm run build`, çıktı klasörü `dist`.

## 5. iPhone'a kurulum

1. Safari'de yayındaki adresi aç.
2. Paylaş → **Ana Ekrana Ekle**.
3. Ana ekrandaki uygulamayı aç → sağ üstteki rozete dokun → e-postanı yaz → gelen kodu gir.

Bilgisayarda aynı adresi tarayıcıda açıp aynı şekilde giriş yapman yeterli.

## Senkron nasıl çalışır?

- Her değişiklik önce cihazdaki veritabanına (IndexedDB) yazılır; uygulama internetsiz de tam çalışır.
- Bağlantı varken değişiklikler ~1,5 saniye içinde gönderilir. Uygulama açılınca, öne gelince, bağlantı geri gelince ve dakikada bir de senkron yapılır.
- Aynı görev iki cihazda değiştirilirse **en son yapılan değişiklik** kazanır.
- Silinen görevler sunucuda `deleted_at` ile işaretlenir, böylece silme de diğer cihaza geçer.
