# Brief: "Gökyüzü" hareket sistemi

> Durum: **onaylandı** (2026-09-24) · Kaynak: `/impeccable shape`
> Uygulama: **tamam** (2026-09-24). Veri tarafı: günün bölümü, Geri al. Hareket: `src/ui/DayArc.tsx`, `arc.ts`, `flight.ts`, `useFlipList.ts`, `taskActions.ts`, `MorningReview.tsx`, `motion.ts`.
> Mod: **Operate**. Hareket işi bitirmeye hizmet eder, bekletmez. "Gösterişli" = anlam taşıyan anlarda cesur, rutin anlarda hızlı.

## Tez

Gün bir gökyüzü; görevler onun içinde yaşayan nesneler.
- **Günün yayı:** Bugün ekranının tepesinde gerçek saate göre ilerleyen güneş; altında sabah / öğlen / akşam bölgeleri. Sahne.
- **Yerçekimi:** Dünyanın fiziği.
- **Mürekkep:** Elin bıraktığı iz.
- **Posta ayıklama:** Sabah ritüeli.

## Anlar

| An | Konsept | Davranış |
|---|---|---|
| Yakalama | Yerçekimi | Görev giriş alanından düşer, yayla yerine oturur; alttaki satırlar esneyip yer açar. |
| Tamamlama | Mürekkep, sonra Yay | Tik kalem darbesiyle çizilir; başlığın üstü elle çizilmiş dalgalı bir çizgiyle kapanır. Satır hafifleyip yükselir ve yayda küçük bir yıldız olur. Günün her biten görevi bir yıldız bırakır. |
| Günün son görevi | Kutlama | Açık görev kalmayınca yıldızlar bir takımyıldıza bağlanır, güneş batar. Günün tek büyük anı. |
| Sabah | Posta ayıklama | "Dünden kalanlar" bir deste kart. Sağa fırlatınca Bugün'e alınır, sola fırlatınca yarına ertelenir, aşağı atınca silinir. Düğmeler yedek olarak kalır. |
| Erteleme / tarih | Yay | Görev yay boyunca sağ kenara, "yarın"ın ufkuna kayıp kaybolur. |
| Silme | Yerçekimi | Görev ağırlaşıp ekranın altından düşer. |
| Listeye taşıma | Yerçekimi | Görev yana kayar; hedef listenin adı kısa bir süre görünür. |
| Gecikmiş | Yerçekimi (çok hafif) | Gün geçtikçe milimetrik sarkma; suçluluk değil, ağırlık hissi. |

## Kararlar

- **Günün bölümü alanı eklenecek.** Görevlere isteğe bağlı sabah / öğlen / akşam alanı gelecek: veri modeli, senkron, şema ve düzenleyici. Görev yakalama sırasında da bir bölgeye sürüklenebilecek. Alanı olmayan görevler "gün içinde" olarak gösterilecek.
- **"Geri al" bandı eklenecek.** Silme ve kaydırmayla verilen her kararda birkaç saniye görünecek. Yumuşak silme sayesinde maliyeti düşük.

## Kapsam ve sınırlar

- **Kapsam:** Bugün ekranı, liste ekranları, sabah kartı. Mevcut görünüm (tema, tipografi, düzen) korunur; yeni olan hareket, Günün yayı ve günün bölümü.
- **Kapsam dışı:** konfeti, ses, maskot.
- **Kaçınılacaklar:**
  - Kullanıcıyı bekleten animasyon.
  - Tekrar edince yoran hareket; tamamlama günde onlarca kez olur.

## Durumlar ve aralıklar

- Boş gün: yay ve güneş tek başına; sessiz ama canlı.
- 0–15 görev sorunsuz akmalı. 30'un üstünde yıldızlar "samanyolu"na dönüşür.
- Hızlı ardışık dokunuşlarda her animasyon anında kesilip bir sonrakine geçebilmeli.

## Kısıtlar

- Hareket yalnızca transform ve opacity ile; iPhone Safari'de 60 fps.
- `prefers-reduced-motion` açıksa kısa, sade geçişler; yay ve yıldızlar durağan.
- iOS Safari'de haptik yok; dokunsal his tamamen görsel.
- Kaydırma hareketleri dikey sayfa kaydırmasıyla çakışmamalı; eşik ve yön kilidi gerekli.
