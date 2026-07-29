# WGS 84 geodezik doğrulama raporu

Doğrulama tarihi: 29 Temmuz 2026

Bu rapor, JavaScript ve Java çekirdeklerinde aynı şekilde uygulanan WGS 84
inverse/direct geodezik hesabının bağımsız kaynaklarla karşılaştırmasını
belgeler. Çalışma zamanı dönüşüm kütüphanesi kullanılmamıştır; dış kaynaklar
yalnız referans sonuç üretmek için kullanılmıştır.

## Çevrimiçi karşılaştırma

Yerel JavaScript çekirdeği, GeographicLib `GeodSolve` WGS 84 sonuçlarıyla
aşağıdaki nokta çiftlerinde karşılaştırıldı:

| Test | Yerel sonuç (m) | GeographicLib (m) | Mutlak fark (mm) |
|---|---:|---:|---:|
| Ekvator → kuzey kutbu | 10001965.729311792 | 10001965.729312723 | 0.000931 |
| Ekvatorda 1° boylam | 111319.490793273 | 111319.490793274 | 0.000001 |
| 60° N'de 1° boylam | 55799.470393381 | 55799.470393260 | 0.000121 |
| Ankara → İstanbul | 350082.334483181 | 350082.334481562 | 0.001619 |
| Antimeridyen geçişi | 21927.872477976 | 21927.872477939 | 0.000037 |
| Yakın antipodal | 19992082.107913356 | 19992082.107913843 | 0.000488 |
| Çok yakın antipodal | 20003920.400273103 | 20003920.400274968 | 0.001866 |

Aynı örnekler Esri ArcGIS Online Geometry Service ile de çalıştırıldı.
GeographicLib ve Esri arasındaki en büyük fark yaklaşık 11.2 nanometreydi.
NOAA NGS ve Japon GSI hesaplayıcıları GRS80 elipsoidi ve daha düşük çıktı
çözünürlüğü kullandığı için ayrıca model/yuvarlama uyumluluğu kontrolü olarak
değerlendirildi:

- NOAA sonuçlarının referanstan en büyük sapması 0.047 mm; çıktı çözünürlüğü
  0.1 mm.
- GSI sonuçlarının referanstan en büyük sapması 0.484 mm; çıktı çözünürlüğü
  1 mm.
- Geoscience Australia servisi test tarihinde geçerli isteğe sunucu hatası
  döndürdüğü için sonuca dahil edilmedi.

## 500.000 resmî vektör

GeographicLib'in yüksek hassasiyetle üretilmiş tam `GeodTest` veri setinin
500.000 satırı çalıştırıldı. Küme; rastgele, kısa, kutba yakın, meridyene ve
ekvatora yakın, antipodal, vertex arası ve vertex yakını kategorilerini içerir.

Referans veri:

- SHA-256:
  `3f5bb237cfb04fceb8eab60e75d6ef9dd6eb8bf436a7a9dc13ceffa682ad593c`
- Doğrulanan JavaScript geodezik dosyası SHA-256:
  `cf9ba156b8d27c273fb17b7a31ca49f41da6e5f18d246f35ea0fdbd742ee58af`
- Çalıştırılan vektör: 500.000
- Hesaplama hatası/exception: 0
- Vincenty inverse: 413.387
- Direct shooting yedeği: 86.613

Mesafe farkları:

| Ölçüt | Sonuç |
|---|---:|
| Ortalama mutlak fark | 0.012720 mm |
| RMS fark | 0.024717 mm |
| P95 | 0.067573 mm |
| P99 | 0.074867 mm |
| En büyük fark | 0.075847 mm |
| 0.1 mm üstü | 0 |
| 1 mm üstü | 0 |

Her inverse sonucu, kendi başlangıç azimutu ve mesafesiyle tekrar `direct`
hesaba verilerek hedef kapanması ayrıca doğrulandı:

| Ölçüt | Sonuç |
|---|---:|
| Ortalama kapanma farkı | 0.000038 mm |
| P99 | 0.000467 mm |
| En büyük kapanma farkı | 0.000635 mm |
| 0.1 mm üstü | 0 |
| 1 mm üstü | 0 |

Antipodal kesim bölgesinde azimut duyarlılığı yüksek olan 100.055 sonuç
`ambiguous: true` olarak işaretlendi. Bunların 50.000'i vertex arası,
50.000'i vertex yakını ve 55'i karşı kutup kategorisindedir. Bu bayrak mesafe
sonucunu geçersiz kılmaz; çağıran uygulamanın tek bir azimutu kesin rota gibi
sunmaması gerektiğini bildirir.

`ambiguous: false` kalan 399.945 sonuçta en büyük azimut farkı
`0.000016950°` idi. Bu uç örnek yalnız 1.57 mm uzunluğundadır; milimetre
ölçeğinde azimut doğal olarak koordinat yuvarlamasına çok duyarlıdır.
Boyutu anlamlı yakın-antipodal örneklerde en büyük fark
`0.000000873°` olarak ölçüldü.

## Bulunan ve kapatılan hata

İlk taramada vertex arası 245 vakada mesafe doğru olmasına rağmen 90° yerine
270° dalı seçilebiliyordu. Bu azimutla `direct` hesap hedefin ters boylamına
gidiyor ve yaklaşık 134 km kapanma hatası oluşturabiliyordu.

Düzeltmeden sonra:

- Her Vincenty inverse sonucu `direct` hedef kapanmasıyla doğrulanır.
- Geçersiz dal yerine yalnız hedefe kapandığı kanıtlanan karşı dal kabul
  edilir.
- Yakın antipodal adaylar 0.1 mm sayısal zarf içinde kaldığında deterministik
  dal seçimi uygulanır.
- Antipodal kesim bölgesinde başlangıç azimutuna göre hedef duyarlılığı
  sayısal türevle ölçülür; 1 metrenin altındaki hassasiyet belirsiz sayılır.
- Birbirinden ayırt edilemeyen rotalar `ambiguous: true` olarak açıklanır.
- Çok küçük boylam farklarında toplamsal kayan nokta kaybı önlenir.
- JavaScript ve Java aynı ortak doğu/batı vertex ve nanoderece vektörlerini
  çalıştırır.

## Kaynaklar ve kapsam

- [GeographicLib çevrimiçi GeodSolve](https://geographiclib.sourceforge.io/cgi-bin/GeodSolve)
- [GeographicLib geodezik test kümesi açıklaması](https://geographiclib.sourceforge.io/C%2B%2B/doc/geodesic.html)
- [GeodTest tam veri seti](https://sourceforge.net/projects/geographiclib/files/testdata/GeodTest.dat.gz/download)
- [GeodTest DOI arşivi](https://doi.org/10.5281/zenodo.32156)
- [NOAA NGS inverse hesaplayıcı](https://geodesy.noaa.gov/TOOLS/Inv_Fwd/Inv_Fwd.html)
- [Esri geodesic lengths API](https://developers.arcgis.com/rest/services-reference/enterprise/lengths/)
- [Japon GSI SurveyCalc](https://vldb.gsi.go.jp/sokuchi/surveycalc/main.html)

Bu sonuçlar WGS 84 elipsoit yüzey mesafesi içindir. Arazi yüksekliği, jeoit,
3B eğik mesafe, rhumb line, UTM grid mesafesi, sensör doğruluğu veya farklı
datum dönüşümü bu doğruluk zarfına dahil değildir.

Hiçbir kayan nokta yazılımı için mutlak “sıfır hata” garantisi verilemez.
Savunulabilir ifade, bu sürümün resmî 500.000 vektörde `0.1 mm` altında mesafe
farkı ve `0.001 mm` altında inverse/direct hedef kapanması göstermesidir.
