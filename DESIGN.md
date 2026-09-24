---
name: Todo
description: Kendime özel yapılacaklar; gün bir gökyüzü, görevler onun içinde yaşayan nesneler.
colors:
  night-coal: "#1c1c1b"
  night-surface: "#262624"
  bone-white: "#f0efea"
  night-muted: "#9a978f"
  night-line: "#3a3936"
  twilight-amber: "#f2b35a"
  starlight: "#f6e3a4"
  deep-night: "#0e1426"
  moonlight: "#ece6d2"
  night-danger: "#e0826c"
  night-warm: "#3a3226"
  paper: "#f6f5f2"
  paper-surface: "#ffffff"
  ink: "#262624"
  paper-muted: "#8a8780"
  paper-line: "#e4e2dc"
  morning-amber: "#e0902e"
  day-star: "#c48a1c"
  dusk-blue: "#2b3450"
  pale-moon: "#8f97ab"
  paper-danger: "#b4452f"
  paper-warm: "#fbf3e4"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.2
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.3
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    letterSpacing: "0.04em"
  meta:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "13px"
    fontWeight: 400
  code:
    fontFamily: "ui-monospace, Menlo, Consolas, monospace"
    fontSize: "0.9em"
rounded:
  sm: "8px"
  md: "12px"
  pill: "999px"
spacing:
  xs: "6px"
  sm: "8px"
  md: "16px"
  lg: "20px"
components:
  button-primary:
    backgroundColor: "{colors.bone-white}"
    textColor: "{colors.night-coal}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  button-secondary:
    backgroundColor: "{colors.night-coal}"
    textColor: "{colors.bone-white}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  chip:
    backgroundColor: "{colors.night-surface}"
    textColor: "{colors.bone-white}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  chip-selected:
    backgroundColor: "{colors.bone-white}"
    textColor: "{colors.night-coal}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  input:
    backgroundColor: "{colors.night-surface}"
    textColor: "{colors.bone-white}"
    rounded: "{rounded.md}"
    padding: "12px 14px"
  card:
    backgroundColor: "{colors.night-surface}"
    textColor: "{colors.bone-white}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "84px"
  review-panel:
    backgroundColor: "{colors.night-warm}"
    textColor: "{colors.bone-white}"
    rounded: "{rounded.md}"
    padding: "12px 14px"
  tabbar:
    backgroundColor: "{colors.night-surface}"
    textColor: "{colors.night-muted}"
    padding: "14px 0"
---

# Design System: Todo

## Overview

**Creative North Star: "Cep Gökyüzü"**

Gün bir gökyüzü, görevler onun içinde yaşayan nesneler. Zemin sakin ve kâğıt gibi. Renk neredeyse yok; sıcaklık yalnızca göğün kendisinden geliyor: güneş, yıldızlar, alacakaranlık. Arayüz tek elle, kısa anlarda kullanılan bir araç (Operate). Bu yüzden karakter büyük yüzeylerde değil, küçük ve kesin ayrıntılarda yaşıyor: kalem darbesiyle çizilen bir tik, başlığın üstünden geçen mürekkep, yerine yaylanarak oturan bir satır.

Yoğunluk düşük, satırlar nefes alıyor, tek sütun ve en fazla 640px genişlik. Hiyerarşi renkle değil ağırlık ve boyutla kuruluyor: tek bir kalın ekran başlığı, sakin görev başlıkları, küçük büyük harfli bölüm etiketleri. Açık ve koyu tema eşit vatandaş; sistem cihazın tercihini izliyor. Koyu tema, uygulamanın asıl kullanıldığı akşam ve gece sahnesi için birincil kabul ediliyor.

Hareket bir dekorasyon değil, dünyanın fiziği: yerçekimi (düşme, oturma, sarkma), mürekkep (çizilen izler) ve gökyüzü (yay, yıldız, gece). Rutin anlar hızlı; günün tek büyük anı son görevin bitişi.

**Key Characteristics:**
- Kâğıt gibi düz zemin, sıcak nötr tonlar, ince çizgiler
- Tek sıcak vurgu ailesi: güneş ve yıldız amberi, yalnızca gökyüzünde
- Sistem yazı tipi; hiyerarşi ağırlık, boyut ve büyük harfli etiketlerle
- Yumuşak köşeler (8–12px) ve hap biçimli çipler
- Anlam taşıyan hareket: tik ve mürekkep çizimi, yerçekimi, günün yayı

## Colors

Sıcak nötrlerden oluşan sessiz bir palet; tek renk olayı gökyüzünde gerçekleşiyor.

### Primary
- **Alacakaranlık Amberi / Sabah Amberi** (twilight-amber koyu, morning-amber açık): Güneş diski, yayın geçen gün kısmı. Yalnızca Günün yayında kullanılır.
- **Yıldız Işığı / Gün Yıldızı** (starlight koyu, day-star açık): Biten görevlerin yıldızları, takımyıldız çizgileri ve yıldıza uçan ışık.
- **Ay Işığı / Soluk Ay** (moonlight koyu, pale-moon açık): Gece saatlerinde (21.00–06.00) yayda ilerleyen hilal ve ışıması.

### Neutral
- **Gece Kömürü / Kâğıt** (night-coal, paper): Sayfa zemini.
- **Gece Yüzeyi / Kâğıt Yüzeyi** (night-surface, paper-surface): Giriş alanları, kartlar, çipler, sekme çubuğu, bantlar.
- **Kemik Beyazı / Mürekkep** (bone-white, ink): Metin ve birincil eylem rengi (vurgu, `--accent`). Tamamlanan tikin dolgusu, birincil düğme zemini.
- **Soluk** (night-muted, paper-muted): İkincil metin, alt bilgiler, pasif sekmeler, mürekkep çizgisi.
- **Çizgi** (night-line, paper-line): Satır ayraçları ve kenarlıklar (1px).
- **Sıcak Zemin** (night-warm, paper-warm): Sabah gözden geçirmesi panelinin ve "sonra" tonlarının zemini.
- **Derin Gece / Alacakaranlık Mavisi** (deep-night, dusk-blue): Günün son görevi bitince yayın kubbesine inen gece.
- **Uyarı** (night-danger, paper-danger): Gecikmiş başlığı ve tarihi, silme düğmesinin çerçevesi.

### Named Rules
**Gökyüzü Kuralı.** Amber, yıldız ve ay renkleri yalnızca gökyüzünde (yay, güneş, ay, yıldızlar, uçan ışık) yaşar. Düğmeler, bağlantılar ya da vurgu metni amber kullanmaz.

**İki Tema Kuralı.** Her renk bir çift olarak tanımlanır (koyu / açık); yeni bir renk eklemek iki değer eklemek demektir. Değerler `:root` üzerinde CSS değişkeni olarak durur ve `prefers-color-scheme` ile değişir.

## Typography

**Display Font:** Sistem yazı tipi (-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif)
**Body Font:** Aynı sistem yazı tipi
**Label/Mono Font:** Platformun eş aralıklı yazı tipi (ui-monospace, Menlo, Consolas); yalnızca dosya adı ve ayar gibi kod parçaları için

**Character:** iPhone'da San Francisco, bilgisayarda platformun kendi yazı tipi: cihazın parçası gibi hissettiren, okunaklı ve iddiasız bir ses. Kişilik yazı tipinden değil, mürekkep ve gökyüzünden geliyor.

### Hierarchy
- **Display** (700, 28px): Ekran başlığı (Bugün, Gelen Kutusu, Listeler). Ekran başına bir tane.
- **Title** (400, 17px): Görev başlığı ve liste adları; dokunulan her şeyin okunduğu boyut.
- **Body** (400, 16px, 1.5): Senkronizasyon ekranı gibi açıklama metinleri.
- **Label** (600, 13px, 0.04em, büyük harf): Bölüm başlıkları (Sabah, Öğle, Akşam, Gecikmiş, Tamamlanan). Şu anki bölüm metin rengine yükselir.
- **Meta** (400, 13px): Görev alt bilgisi (tarih · liste · bölüm), soluk renkte; gecikmişse uyarı renginde.
- **Code** (eş aralıklı, çevre metnin %90'ı): Metin içindeki dosya adları ve ayarlar (`.env`, `SETUP.md`). Yalnız "monospace" yazılmaz; tarayıcı o durumda 13px temel boyuta düşer.

### Named Rules
**Ağırlıkla Vurgu Kuralı.** Vurgu renkle değil ağırlık ve boyutla yapılır; renkli metin yalnızca durum bildirir (gecikmiş).

## Layout

Tek sütun, en fazla 640px, ortalanmış; yan boşluk 16px. Dikey ritim: bölüm başlığından önce 20px, satır içi 10px dikey dolgu, satırlar arasında 1px çizgi. Üstte güvenli alan boşluğu (`env(safe-area-inset-top)`), altta sabit sekme çubuğu ve güvenli alan kadar boşluk. Alt bantlar (Geri al, yeni sürüm) sekme çubuğunun hemen üstünde tek bir yığında durur; açıkken sayfanın alt boşluğu büyür.

Bugün ekranının sırası sabittir: başlık, Günün yayı (112px yükseklik; genişlik artsa da yay uzamaz), hızlı ekleme, sabah kartı, bölümler.

## Elevation & Depth

Sistem düz ve tonal: sayfa ile yüzey arasındaki fark bir ton ve 1px çizgiyle kurulur. Gölge yalnızca diğer her şeyin üstünde yüzen nesnelerde vardır.

### Shadow Vocabulary
- **Yüzen bant** (`box-shadow: 0 6px 20px rgb(0 0 0 / .18)`): Geri al ve yeni sürüm bantları.
- **Deste kartı** (`box-shadow: 0 4px 14px rgb(0 0 0 / .12)`): Sabah destesindeki kartlar.
- **Yıldız ışığı** (yıldız renginde yumuşak parıltı): Tamamlanan görevden yıldıza uçan ışık.

### Named Rules
**Düz-Varsayılan Kuralı.** Satırlar, giriş alanları ve paneller düzdür. Gölge, "bu şey diğerlerinin üstünde ve elle tutulabilir" demektir; başka bir anlamda kullanılmaz.

## Shapes

Yumuşak ama gevşek olmayan köşeler: giriş alanları, kartlar, paneller ve birincil düğmeler 12px; düzenleyici alanları ve küçük düğmeler 8px; çipler ve durum rozeti tam yuvarlak hap. İşaret kutusu bir halka (1.8px çizgi) ve içine kalem darbesiyle çizilen bir tik. Günün yayı bir yarım elips; yıldızlar dört köşeli ince yıldızlar. Mürekkep çizgisi elle çizilmiş gibi hafif dalgalıdır, hiçbir zaman düz bir üstü çizili değildir.

## Components

### Buttons
Dokunsal ve sakin; basıldığında cevap verir, beklerken sessizdir.
- **Shape:** Yumuşak köşeli (12px); küçük düğmeler 8px.
- **Primary:** Vurgu zemini (kemik beyazı / mürekkep), zemin renginde metin, 12px 16px dolgu. Hızlı eklemedeki "+" düğmesi 48px kare; boşken %30 opaklıkta pasif.
- **Secondary:** Saydam zemin, 1px çizgi.
- **Link:** Soluk, altı çizili metin düğmesi (Sonra bakarım, Sonra).
- **Danger:** Saydam zemin, uyarı renginde 1px çerçeve ve metin (Sil).

### Chips
- **Style:** Yüzey zemini, 1px çizgi, hap biçimi, 14px metin (Bugün, Yarın, tarih, bölüm seçimi).
- **State:** Seçili çip vurgu zeminine ve zemin renginde metne döner (günün bölümü).

### Cards / Containers
- **Sabah paneli:** Sıcak zemin, 12px köşe, 12px 14px dolgu; içinde kart destesi.
- **Deste kartı:** Yüzey zemini, 12px köşe, 84px yükseklik, deste kartı gölgesi. Arkadaki kartlar 8px aşağıda, %96 ve %92 ölçekte.
- **Border:** 1px çizgi.

### Inputs / Fields
- **Style:** Yüzey zemini, 1px çizgi, 12px köşe, 17px metin (iOS'ta yakınlaştırmayı önler).
- **Error:** Alanın altında uyarı renginde tek satır ("Eklenemedi: …").

### Navigation
- **Sekme çubuğu:** Sabit altta, yüzey zemini, üstte 1px çizgi; üç eşit sekme (Bugün, Gelen Kutusu, Listeler), 14px. Etkin sekme metin renginde ve 600 ağırlıkta, diğerleri soluk.
- **Senkron rozeti:** Sağ üstte hap; renkli nokta durumu söyler (yeşil güncel, amber senkronize ediliyor, uyarı rengi hata/çevrimdışı).

### Görev satırı (imza bileşen)
Halka işaret kutusu, başlık ve altında soluk meta satırı. Tamamlanınca tik kalem darbesiyle çizilir (220ms), halka vurguyla dolar, başlığın üstünden dalgalı bir mürekkep çizgisi geçer (360ms) ve Bugün ekranındaysa kutudan yıldıza bir ışık uçar (520ms). Gecikmiş satır gün başına milimetrik sarkar (en fazla 6 gün).

### Günün yayı (imza bileşen)
Başlığın altında yarım elips. Gerçek saate göre ilerleyen güneş (06.00–21.00), gece ise aynı yayda ilerleyen hilal biçimli ay (21.00–06.00; kubbeye hafif gece tonu iner), yayın geçen kısmı amber, 12.00 ve 17.00'de bölüm noktaları, ufkun altında Sabah / Öğle / Akşam etiketleri. Biten her görev kendi bölümünde kararlı bir yere yıldız bırakır. Bugünün bütün görevleri bitince yıldızlar takımyıldıza bağlanır, kubbeye gece iner, güneş ufkun arkasına batar. 30 yıldızın üstünde samanyolu bandı belirir.

### Sabah destesi (imza bileşen)
Dünden kalanlar üst üste kartlar. Üstteki kart sürüklenir: sağa Bugün, sola Ertele, aşağı Sil (88px eşik); yön ipucu kartın köşesinde belirir. Yetersiz sürüklenen kart yayla yerine döner. Düğmeler aynı uçuşu yapar.

## Do's and Don'ts

### Do:
- **Do** hareketi dünyanın fiziğiyle anlat: düşme ve oturma için yerçekimi, izler için mürekkep, gün için gökyüzü.
- **Do** rutin geri bildirimi 300ms'nin altında tut; tek uzun an günün son görevinin kutlamasıdır.
- **Do** her hareketin `prefers-reduced-motion` karşılığını yaz: uzamsal hareket kalkar, kısa soluklaşma ve renk değişimi kalır.
- **Do** her yeni rengi hem koyu hem açık tema için bir çift olarak ekle.
- **Do** kararları (silme, erteleme, taşıma) Geri al bandıyla geri alınabilir yap.

### Don't:
- **Don't** amber ve yıldız renklerini gökyüzü dışında kullanma.
- **Don't** düz üstü çizili metin kullanma; tamamlama her zaman mürekkep çizgisidir.
- **Don't** satırlara, girişlere ya da panellere dinlenme hâlinde gölge verme.
- **Don't** kullanıcıyı bekleten ya da tekrarlandıkça yoran hareket ekleme; tamamlama günde onlarca kez olur.
- **Don't** konfeti, ses ya da maskot ekleme.
