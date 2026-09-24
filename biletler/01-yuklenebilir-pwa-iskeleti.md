# 01: Yüklenebilir PWA iskeleti

**Ne yapılacak:** Vite + React + TypeScript uygulaması. iPhone'da Safari'den "Ana Ekrana Ekle" ile kurulabiliyor, ikonları ve güvenli alan (çentik) boşlukları doğru, internetsiz de açılıyor.

**Önce bitmesi gereken:** Yok (hemen başlanabilir)

**Durum:** tamamlandı (commit `9c5f4ca`), yayına alma kullanıcıda

- [x] Vite + React + TS iskeleti; `npm run dev`, `npm run build`, `npm test` çalışıyor
- [x] Manifest ve ikonlar (192, 512, maskable, apple-touch-icon 180)
- [x] iOS meta etiketleri (`apple-mobile-web-app-capable`, `viewport-fit=cover`)
- [x] Güvenli alan boşlukları (`env(safe-area-inset-*)`)
- [x] Service worker ile çevrimdışı açılış (build'de 8 dosya önbelleğe alınıyor)
- [ ] Yayına alma (Vercel / Netlify / Cloudflare Pages): kullanıcı yapacak, bkz. [SETUP.md](../SETUP.md)
- [ ] Gerçek iPhone'da "Ana Ekrana Ekle" ile kurulum testi: kullanıcı yapacak
