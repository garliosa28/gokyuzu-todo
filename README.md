# Gökyüzü Todo

Kendime özel, sade bir yapılacaklar uygulaması. Gün bir gökyüzü, görevler onun içinde yaşayan nesneler.

**Canlı:** https://garliosa28.github.io/gokyuzu-todo/

- **Bugün odaklı:** Uygulama Bugün ekranıyla açılır. Görevler sabah, öğle ve akşam olarak gruplanır.
- **Günün yayı:** Güneş (gece ay) gerçek saate göre ilerler. Biten her görev gökyüzünde bir yıldız bırakır, günün son görevi bitince yıldızlar takımyıldıza bağlanır.
- **Sabah destesi:** Dünden kalanlar kart destesi olarak gelir. Sağa kaydır: Bugün, sola: Ertele, aşağı: Sil.
- **Önce yerel:** İnternetsiz de tam çalışır. İsteğe bağlı olarak Supabase ile cihazlar arası senkronize olur.
- **iPhone'a kurulum:** Safari'de aç → Paylaş → Ana Ekrana Ekle.

Görevler yalnızca kendi cihazında saklanır. Senkron kurulmadıkça kimse kimsenin görevlerini görmez.

## Geliştirme

```bash
npm install
npm run dev
npm test
```

Senkron kurulumu: [SETUP.md](SETUP.md) · Tasarım sistemi: [DESIGN.md](DESIGN.md) · Ürün: [PRODUCT.md](PRODUCT.md)

React + TypeScript + Vite, Dexie (IndexedDB), Supabase, vite-plugin-pwa.
