# Convert

Kesin uzunluk dönüşümü, koordinat formatları, CRS dönüşümü ve WGS 84
elipsoidal harita ölçümü sunan React uygulaması ile JavaScript/Java çekirdek
kütüphaneleri.

Hesap motorları dış dönüşüm paketi kullanmaz. React arayüzü, HTTP API ve Java
uyarlaması aynı kimlikleri ve ortak referans vektörlerini kullanır.

## Neler var?

- Uzunluk: mm, cm, m, km, inç, ayak, yarda, kara mili ve deniz mili
- Harita ölçümü: iki nokta arası elipsoidal mesafe, başlangıç/varış azimutu
  ve çok parçalı çizgi uzunluğu
- İnteraktif küre: ölçülen en kısa geodeziği Cesium üzerinde çizme
- WGS 84 formatları: DD, DMS, DDM, MGRS, UTM/UPS, GARS ve GEOREF
- CRS: EPSG:4326, EPSG:3857, WGS 84 UTM zonları ve UPS
- JavaScript paketi: `@convert-tools/core`
- Java 17 çekirdeği: `io.github.mertc0604:convert-tools-core`
- Aynı motoru kullanan JSON API: `GET/POST /api/convert`
- Türkçe ve İngilizce React arayüzü

## Sorumluluk sınırları

`units` ve `geodesy` birbirinden ayrıdır:

- `convertLength(...)`, zaten bilinen bir uzunluğun birimini değiştirir.
  Örneğin `1 NM → 1852 m`.
- `inverseGeodesic(...)`, iki koordinattan WGS 84 yüzey mesafesini üretir.
- `measureGeodesicPolyline(...)`, harita çizgisinin her segmentini geodezik
  olarak ölçer ve telafili toplamla birleştirir.
- `transformCrs(...)`, koordinat sistemini değiştirir; genel harita mesafesi
  hesaplamak için projeksiyon X/Y farkı kullanılmaz.

## Mimari

```text
app/                          React sayfası ve HTTP route
components/                   Yalnız arayüz bileşenleri
  coordinates/map/            Lazy Cesium sunum adaptörü
lib/api/                      HTTP istek/yanıt adaptörü

packages/
  core-js/
    src/
      exact/                  BigInt tabanlı kesin rasyonel matematik
      units/
        catalog/length.js     Tek uzunluk kataloğu
        converter.js          Kesin uzunluk dönüşüm servisi
        registry.js           Uzunluk birimi kayıtları
      geodesy/
        core/                 WGS 84 ve sayısal doğrulama
        formats/              DMS / DDM
        grids/                MGRS / GARS / GEOREF
        projections/          UTM / UPS / CRS
        measurement/          Inverse, direct ve polyline ölçümü
      index.js                Kontrollü public API

  core-java/
    src/main/java/.../
      units/                  Java exact birim motoru
      coordinates/            Java format, grid, UTM/UPS ve CRS motoru
      geodesy/                Java WGS 84 ölçüm motoru

contracts/test-vectors/       JS ve Java için ortak doğruluk vektörleri
tests/                        Core, HTTP ve render testleri
```

React kodu hesap formülü içermez. HTTP katmanı da yalnızca public core API'yi
çağırır. Böylece tarayıcı, sunucu ve başka projelerde aynı sonuç üretilir.
Cesium yalnız uygulamanın görsel katmanıdır; `@convert-tools/core` ve Java
çekirdeği Cesium'a veya başka bir harita paketine bağımlı değildir.

## JavaScript kullanımı

### Kesin uzunluk dönüşümü

```js
import { convertLength } from "@convert-tools/core/length";

const result = convertLength(
  "1",
  "nautical-mile",
  "metre",
);

console.log(result.value); // "1852"
console.log(result.exactValue);
// { numerator: "1852", denominator: "1" }
```

Ondalık gösterimi sonsuz süren dönüşümlerde `value` alanı yalnız sunum
değeridir. Sonraki hesaplamaya `exactValue` verildiğinde yuvarlama zincire
girmez:

```js
const nauticalMiles = convertLength("1", "metre", "nautical-mile");
const metres = convertLength(
  nauticalMiles.exactValue,
  "nautical-mile",
  "metre",
);

console.log(metres.value); // "1"
```

`@convert-tools/core/units` yolu geriye dönük geçiş kolaylığı için aynı
uzunluk API'sini sunar. Başka fiziksel büyüklük katalogları bulunmaz.

### İki harita noktası arasındaki mesafe

```js
import { inverseGeodesic } from "@convert-tools/core/geodesy";

const result = inverseGeodesic(
  { latitude: 39.933365, longitude: 32.859742 },
  { latitude: 41.008238, longitude: 28.978359 },
);

console.log(result.distanceMetres);
console.log(result.initialBearingDegrees);
```

`ambiguous: true`, antipodal kesim bölgesinde sayısal doğruluk sınırı içinde
birden fazla rota bulunduğunu belirtir. Mesafe ve seçilen rota hedefe kadar
doğrulanır; fakat operasyonel kullanımda çağıran uygulama bu bayrağı
görünür kılmalı ve tek bir azimutu kesinmiş gibi sunmamalıdır.

### Hesaplanan hattı haritada çizme

`sampleGeodesicPath`, inverse çözümün bulduğu aynı kısa geodezik üzerinde eşit
mesafe aralıklı noktalar üretir. Dönen `distanceMetres` inverse çözümün
sonucudur; örnek noktalar yalnız çizim içindir:

```js
import { sampleGeodesicPath } from "@convert-tools/core/geodesy";

const path = sampleGeodesicPath(
  { latitude: 39.933365, longitude: 32.859742 },
  { latitude: 41.008238, longitude: 28.978359 },
  { maxSegmentMetres: 25_000, maxPoints: 2_049 },
);

console.log(path.distanceMetres);
console.log(path.points); // { latitude, longitude }[]
```

`maxPoints` kaynak tüketimini sınırlar. Bu sınır nedeniyle hedef segment
uzunluğu aşıldığında gerçek aralık `sampledMaximumSegmentMetres` alanında
bildirilir.

### GeoJSON / harita çizgisi uzunluğu

GeoJSON koordinatları `[longitude, latitude]` sırasındadır. Core API ise isimli
alan kullandığı için sıra hatası oluşmaz:

```js
import { measureGeodesicPolyline } from "@convert-tools/core/geodesy";

const points = feature.geometry.coordinates.map(
  ([longitude, latitude]) => ({ latitude, longitude }),
);

const measurement = measureGeodesicPolyline(points);
console.log(measurement.distanceMetres);
```

Metre sonucunu NM, km veya mile çevirmek için ayrıca `convertLength` çağrılır.
Hesaplanan `number` sonucu hesap katmanında yuvarlanmaz; yuvarlama yalnız
sunumda yapılır.

## Java kullanımı

```java
GeoPoint ankara = new GeoPoint(39.933365, 32.859742);
GeoPoint istanbul = new GeoPoint(41.008238, 28.978359);

GeodesicResult result = Geodesic.inverse(ankara, istanbul);
System.out.println(result.distanceMetres());

GeodesicPath path = Geodesic.samplePath(ankara, istanbul);
System.out.println(path.points());
```

Java uzunluk motoru aynı birim kimliklerini ve kesin kesir sözleşmesini
kullanır:

```java
UnitConversion first = LengthConverter.convert(
    "1",
    "nautical-mile",
    "metre",
    24
);

UnitConversion back = LengthConverter.convert(
    first.exactValue(),
    "metre",
    "nautical-mile",
    24
);
```

Koordinat formatları ve CRS dönüşümleri de Java çekirdeğinde aynı WGS 84
sözleşmesiyle bulunur:

```java
CoordinateSource source = Coordinates.fromMgrs("38SLC3918701405");
CoordinateResult formats = Coordinates.results(source, 5);
GeoPoint mapPoint = Coordinates.toGeoPoint(source);

CrsTransformation projected = CrsTransformer.transform(
    "EPSG:4326",
    "EPSG:32636",
    "32.859742",
    "39.933365"
);
```

Detaylar: [`packages/core-java/README.md`](packages/core-java/README.md)

## HTTP API

```bash
curl -X POST http://127.0.0.1:5173/api/convert \
  -H "Content-Type: application/json" \
  -d '{
    "type": "geodesic",
    "operation": "inverse",
    "start": { "latitude": 39.933365, "longitude": 32.859742 },
    "end": { "latitude": 41.008238, "longitude": 28.978359 },
    "outputUnit": "nautical-mile"
  }'
```

Tüm istekler için [`docs/API.md`](docs/API.md) belgesine bakın.

## Çalıştırma

Masaüstündeki `Baslat.command` dosyasına çift tıklayın veya:

```bash
pnpm install --ignore-scripts
pnpm dev
```

Uygulama: `http://127.0.0.1:5173/`

```bash
pnpm test
pnpm lint
pnpm typecheck
```

## Doğruluk modeli

Uzunluk oranları JavaScript'te `BigInt`, Java'da `BigInteger` pay/payda olarak
tutulur. Deniz mili tam `1852 m`, uluslararası ayak tam `0.3048 m` kabul
edilir. Her sonuç, gösterilen ondalık metnin yanında JSON'a uygun kesin
`numerator`/`denominator` değerini taşır. Bütün birim çiftlerinde kesin değer
üzerinden ileri–geri dönüş kimliği korunur.

Harita ölçümü WGS 84 dönel elipsoidi üzerinde inverse/direct geodezik çözer.
Normal çiftlerde hızlı iteratif inverse çözüm, antipodale yakın çiftlerde
direct çözüm ve sönümlü sayısal atış yedeği kullanılır. Kalıcı test kümesindeki
ekvator, antimeridyen, kutup ve antipodal vektörler bağımsız referanslara göre
`1 mm` toleransla doğrulanır. Ayrıca GeographicLib'in 500.000 resmî WGS 84
vektörünün tamamında en büyük mesafe farkı `0.075847 mm`, en büyük
inverse/direct hedef kapanması `0.000635 mm` ölçülmüştür. Ayrıntılar
[`docs/GEODESIC_VALIDATION.md`](docs/GEODESIC_VALIDATION.md) belgesindedir.
Çok parçalı toplamda Neumaier telafili toplama kullanılır.

Bir boylam derecesinin fiziksel uzunluğu enleme bağlıdır: ekvatorda en büyük,
kutuplara yaklaştıkça sıfıra yakın olur. Aynı kutup noktasında farklı yazılmış
boylamlar bu nedenle tek fiziksel nokta kabul edilir. Enlem doğrultusundaki
meridyen yayları da WGS 84 basıklığı nedeniyle küresel bir modelle aynı
değildir.

Google Maps JavaScript geometri yardımcıları varsayılan olarak yarıçapı
`6.378.137 m` olan küresel bir model kullanır. Bu çekirdek ise WGS 84 elipsoidi
kullanır. Örneğin `(0°, 0°) → (90°, 0°)` için elipsoidal yüzey mesafesi
yaklaşık `10.001.965,729 m`, küresel çeyrek çevre ise yaklaşık
`10.018.754,171 m` olur. Yaklaşık `16,788 km` fark bir yuvarlama hatası değil,
iki farklı jeodezik modelin sonucudur. Google modelinin ayrıntısı
[`geometry.spherical` referansında](https://developers.google.com/maps/documentation/javascript/reference/geometry)
belgelenir.

Bu değer elipsoit yüzey mesafesidir. Şunlarla aynı değildir:

- EPSG:3857 üzerinde düz çizgi mesafesi
- UTM grid mesafesi
- rhumb line / sabit kerteriz yolu
- rakım içeren 3B eğik mesafe

Uygulamadaki Cesium görünümü, çekirdeğin örneklediği hattı yerel Natural Earth
altlığı üzerinde gösterir. Cesium ölçüm yapmaz; sonuçları değiştirmez. Araziye
oturtma ve yükseklik hesabı özellikle kapalıdır, dolayısıyla çizgi WGS 84
elipsoit yüzey ölçümünü temsil eder.

Sayısal doğruluk, kaynak koordinatın veya sensörün gerçek dünya doğruluğunu
artırmaz. Operasyonel kullanımda datum, yükseklik modeli, cihaz hatası ve
yetkili referans yazılımıyla bağımsız kabul testi ayrıca yapılmalıdır.

DD, DMS, DDM ve projeksiyon dönüşümleri kendi ilan edilen sayısal toleransıyla
test edilir. MGRS, GARS ve GEOREF bir noktayı değil çözünürlüğü belirli bir
hücreyi temsil eder; bu formatlarda doğru sözleşme özgün noktanın bit düzeyinde
geri gelmesi değil, noktanın ilgili hücrenin sınırları içinde kalmasıdır.
