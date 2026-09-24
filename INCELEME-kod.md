# Kod incelemesi (xhigh)

> Tarih: 2026-09-22 · Kapsam: projenin tamamı (boş repodan `c53ec20`'ye, 6 commit)
> Durum: **15 bulgunun hepsi düzeltildi** (2026-09-24). Düzeltmeler, her bulgu grubunu bağımsız olarak çürütmeye çalışan doğrulama ajanlarıyla kontrol edildi. Bkz. en alttaki "Düzeltmeler" bölümü.
>
> Bulgular en ciddiden en hafife sıralı. 1-10 doğruluk hataları, 11-15 temizlik ve test eksikleri.
> Repoda CLAUDE.md olmadığı için yazılı kurallara uygunluk bulgusu yok.

## Doğruluk hataları

### 1. Silinen listenin görevleri diğer cihazda sahipsiz kalıyor
`src/data/store.ts:92` · correctness

`deleteList` yalnızca silme anında o cihazda bulunan görevleri siliyor. `allTasks`, `todayView` ve `tasksInList` görevin listesinin silinip silinmediğine bakmıyor.

**Senaryo:** Bilgisayar çevrimdışıyken "İş" listesine "Rapor" görevi eklenir. Telefon "İş"i silip senkronlar. Bilgisayar çevrimiçi olunca "Rapor"u gönderir, liste ise silinmiş olarak gelir.
- **Sonuç:** "Rapor" Bugün ekranında görünmeye devam eder ama hiçbir listede yoktur.
- **Ek etki:** Düzenleyicideki liste seçimi bu görev için yanlış olarak Gelen Kutusu'nu gösterir.
- **Aynı sorunun başka yolu:** Silmeden sonra diğer cihazda düzenlenen görevler de "son yazan kazanır" kuralıyla geri gelir.

### 2. `updated_at` her zaman artmıyor; saat farkı kalıcı ayrışmaya yol açıyor
`src/data/store.ts:11` · correctness

`stamp()` yeni zaman damgasının satırın önceki `updated_at` değerinden büyük olmasını garanti etmiyor. Saati geri kalmış cihazın düzenlemesini sunucu sessizce reddediyor, cihaz ise bunu gönderilmiş sayıyor.

**Senaryo:** Bilgisayarın saati telefondan 5 sn geride.
1. Telefon, kendi saatiyle 12:00:03'te "Süt al"ı "Yarım litre süt" yapar. Bilgisayar bu değişikliği çeker.
2. Bilgisayar, kendi saatiyle 12:00:01 damgasıyla başlığı "Süt" yapar.
3. Sunucu tetikleyicisi damga daha eski olduğu için güncellemeyi atlar. Bilgisayar ise gönderimi başarılı sayar.
4. Pull imleci telefonun satırını çoktan geçtiği için doğru sürüm bilgisayara bir daha gelmez.

**Sonuç:** Bilgisayar kalıcı olarak "Süt", telefon ve sunucu "Yarım litre süt" gösterir.

**Çözüm:** Güncellemelerde `updated_at = max(şimdi, önceki updated_at + 1 ms)`.

### 3. Çıkış yapınca tüm cihazlardan çıkılıyor
`src/ui/AccountScreen.tsx:41` · correctness

`supabase.auth.signOut()` varsayılan olarak tüm oturumları kapatıyor (`scope: 'global'`). Dönen hata da kontrol edilmiyor.

**Senaryo:** Bilgisayarda "Çıkış yap"a basılır. Telefondaki oturumun yenileme anahtarı da iptal olur. Yaklaşık 1 saat sonra erişim anahtarının süresi dolunca telefonda senkron hata vermeye başlar ve yeniden kodla giriş gerekir. Çevrimdışıyken çıkış başarısız olursa kullanıcıya hiçbir şey gösterilmez.

**Çözüm:** `signOut({ scope: 'local' })` ve hatayı ekranda göstermek.

### 4. Başlık düzenlemesi, düzenleyici kapanırken kaybolabiliyor
`src/ui/TaskItem.tsx:35` · correctness

Başlık yalnızca giriş alanından çıkılınca (`onBlur`) kaydediliyor. Düzenleyici, alan hâlâ odaktayken kapatılırsa alan sayfadan kaldırılıyor ve `onBlur` çalışmayabiliyor. Enter tuşu da kaydetmiyor.

**Senaryo:** iPhone Safari'de düğmeler dokunulduğunda odak almaz.
1. Kullanıcı başlığı "Süt al"dan "Yarım litre süt al"a çevirir.
2. Düzenleyiciyi kapatmak için görev başlığına dokunur.
3. Alan kaldırılır, yeni başlık kaydedilmez.

Yazarken alt sekmeye dokunmak da düzenlemeyi atar.

### 5. Süren senkron bitince "Çıkış yapıldı" ve "Çevrimdışı" durumları eziliyor
`src/ui/syncController.ts:54` · correctness

`requestSync` başarıyla bitince durumu koşulsuz "güncel" yapıyor.

**Senaryo:** Senkron sürerken "Çıkış yap"a basılır. Durum "çıkış yapıldı" olur, ama senkron bitince yeniden "güncel"e döner. Rozet çıkıştan sonra da yeşil "Güncel" gösterir. Uçak moduna geçilince de aynısı olur.

### 6. Sayfa sınırında aynı `synced_at` değerine sahip satırlar atlanabiliyor
`src/data/remote.ts:30` · correctness

Sayfalama yalnızca `synced_at`'e göre sıralayıp sonraki sayfayı "son değerden büyük olanlar" (`gt`) koşuluyla alıyor. Eşitliği bozan ikinci bir sıralama anahtarı yok.

**Senaryo:** Yeni bir cihaz ilk kez senkronlanıyor ve sunucuda 1000'den fazla satır var. İki satır aynı mikrosaniyede yazılmışsa ve biri 1000., diğeri 1001. sıradaysa, 1001. satır atlanır. İmleç ilerlediği için o görev bu cihaza hiç gelmez.

**Çözüm:** `(synced_at, id)` çiftine göre sıralama ve sayfalama.

### 7. Hesap veya proje değişince senkron imleci sıfırlanmıyor
`src/ui/syncController.ts:68` · correctness

`syncCursor` ve satırların "gönderildi" (`dirty = 0`) bilgisi hesaba veya projeye bağlı değil.

**Senaryo:** Kurulumda bir deneme Supabase projesi açılır, sonra silinip yenisi oluşturulur ve `.env` güncellenir. Telefon eski imleçle çeker, daha önce gönderilmiş görevleri hiç göndermez. Yeni projeye yalnızca bundan sonra düzenlenen görevler gider.

**Çözüm:** Kullanıcı veya proje değişince imleci sıfırlayıp tüm satırları yeniden gönderilecek olarak işaretlemek.

### 8. Sabah kartı aynı gün yeniden açılabiliyor
`src/data/today.ts:31` · correctness

Gün yalnızca "Sonra bakarım"a basınca işaretleniyor. Görevler tek tek halledilince işaretlenmiyor. Oysa plan "Kart o gün bir daha görünmez" diyor.

**Senaryo:** Sabah iki görev "Bugün"e alınır ve kart kaybolur. Öğlen dün tarihli bir görev senkronla gelir ya da işareti kaldırılır. Kart aynı gün yeniden açılır.

### 9. Otomatik güncelleme yazarken sayfayı yenileyebiliyor
`vite.config.ts:9` · correctness

`registerType: 'autoUpdate'` yeni sürüm yayınlanınca sayfayı kendiliğinden yeniden yüklüyor. Hızlı ekleme alanındaki veya düzenleyicideki kaydedilmemiş metin kaybolur.

**Çözüm:** "Yeni sürüm var, yenile" mesajı göstermek (`prompt` modu) ya da güncellemeyi bir sonraki açılışa bırakmak.

### 10. `crypto.randomUUID` güvenli olmayan bağlantıda yok
`src/data/store.ts:22` · correctness

Bu fonksiyon yalnızca HTTPS'te veya localhost'ta tanımlı. Geliştirme sunucusu iPhone'dan yerel ağ IP'siyle (`http://192.168.x.x:5173`) açılırsa görev eklemek sessizce başarısız olur: metin silinir ama görev eklenmez.

Yayındaki (HTTPS) uygulamayı etkilemiyor, ama SETUP.md bunu belirtmiyor.

## Temizlik ve test

### 11. Liste silme kuralı yazma anında değil, okuma anında uygulanmalı
`src/data/store.ts:118` · altitude

Silinen listenin görevlerini gizlemek, silme anında görevleri de silmeye (kaskada) dayanıyor. Bu yöntem, senkronla sonradan gelen ya da geri dönen görevleri kapsayamaz. Kök çözüm: görev sorgularında listesi silinmiş görevleri silinmiş saymak. Böylece 1 numaralı hata ve benzerleri tek yerden çözülür.

### 12. Her görev satırı listeleri ayrıca sorguluyor
`src/ui/TaskItem.tsx:10` · efficiency

Her `TaskItem` tüm listeleri ayrı ayrı çekiyor. N görev için N ayrı veritabanı sorgusu yapılıyor ve her değişiklikte hepsi yeniden çalışıyor. Listeleri ekran bileşeninde bir kez çekip görev satırlarına aktarmak yeterli.

### 13. Senkron döngüleri her tablo için kopyalanmış
`src/data/sync.ts:38` · simplification

Push ve pull döngüleri `lists` ve `tasks` için neredeyse aynen iki kez yazılmış. Aynı kalıp `remote.ts`'te ve `syncController.ts`'te de tekrarlanıyor. Yeni bir tablo eklemek birçok yerde paralel değişiklik gerektiriyor, birinin unutulması o tablonun sessizce senkronlanmamasına yol açar.

### 14. Tarih ayrıştırma kodu tekrarlanmış
`src/ui/format.ts:9` · reuse

`dueLabel`, `today.ts`'teki tarih ayrıştırmasını yeniden yazıyor. "Yarına ertele" işlemi de `MorningReview` ve `TaskItem` içinde kopyalanmış.

### 15. Supabase bağlantı kodu testsiz
`src/data/remote.ts:20` · test-coverage

İmleç hesaplama, 10 sn örtüşme ve sayfalama hiç test edilmiyor. Senkron testleri yalnızca bellekteki sahte sunucuyu kullanıyor. Bu yüzden 6 numaralı hata testlerde görünmüyor.

## Ek not

Supabase'in ücretsiz projeleri bir süre kullanılmazsa duraklatılıyor ve SETUP.md bundan bahsetmiyor. Bunun için ayrı bir görev önerildi.

## Düzeltmeler (2026-09-24)

| # | Nasıl düzeltildi |
|---|---|
| 1, 11 | Görev sorguları, listesi silinmiş görevleri de silinmiş sayıyor. Liste silme artık görevleri tek tek silmiyor. |
| 2 | Mevcut bir satırın her güncellemesi `max(şimdi, önceki + 1 ms)` damgası alıyor. Okuma ve yazma aynı transaction içinde. |
| 3 | Çıkış artık yalnızca o cihazdan yapılıyor (`scope: 'local'`). |
| 4 | Başlık üç durumda kaydediliyor: alandan çıkınca, Enter'a basınca ve düzenleyici kapanınca. |
| 5 | Senkron bitince durum yalnızca aynı kullanıcı hâlâ oturumdaysa güncelleniyor. |
| 6, 15 | Sayfalama `(synced_at, id)` çiftiyle yapılıyor ve boş sayfa gelene kadar sürüyor. Sayfa okuma ayrı bir katmana alındı ve testleri eklendi. |
| 7 | Senkron durumu proje ve kullanıcıya bağlandı. Değişince her şey yeniden gönderiliyor. |
| 8 | Gün yalnızca kart o gün gösterilip boşaldığında kapanıyor. |
| 9 | Güncelleme bir bantla soruluyor ve "Sonra" ile kapatılabiliyor. |
| 10 | `getRandomValues` ile yedek kimlik üretimi eklendi. Hızlı ekleme, hata olursa yazılan metni geri getiriyor. |
| 12 | Listeler ekran başına bir kez sorgulanıyor. |
| 13 | Senkron kodu tek bir tablo listesi (`SYNCED_TABLES`) üzerinden çalışıyor. Bir tablo unutulursa derleme hata veriyor. |
| 14 | Tarih ayrıştırma ve erteleme işlemleri tek yerde toplandı. |

**Doğrulama sırasında bulunup düzeltilen ek sorunlar:**
- Eşit zaman damgasında istemci artık sunucunun sürümünü alıyor, sunucuyla aynı kural uygulanıyor.
- Birincil anahtar `(user_id, id)` oldu. Aynı projede hesap değiştirmek artık hata vermiyor.
- Bir senkron sürerken sahiplik değişirse o senkronun sonuçları yazılmıyor.
- Silinmiş satırlara sonradan gelen düzenlemeler yok sayılıyor.
- Sunucu sayfayı kırpsa da (Max rows ayarı) tüm satırlar çekiliyor.
- Toplu gönderim 500'lük parçalara bölündü.
- Başka cihazda silinen liste açıksa "silindi" mesajı gösteriliyor.
- Görevin listesi henüz yüklenmediyse düzenleyici bunu belirtiyor.
- Hızlı eklemede çift dokunuş aynı görevi iki kez eklemiyor.

**Bilinen, kabul edilmiş sınırlar:**
- Aynı satırda iki cihazdan eşzamanlı yapılan farklı alan değişikliklerinde yalnızca biri kalıyor. Bu, satır bazında "son yazan kazanır" tasarımının sonucu.
- Açık başlık taslağı, sayfa yeniden yüklenirse kayboluyor.
- "Yenile"ye basınca diğer açık pencereler de yenileniyor.
