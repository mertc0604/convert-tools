# Convert

Bağımsız fiziksel birim dönüşümü, koordinat formatları, CRS dönüşümü ve
WGS 84 elipsoidal harita ölçümü sunan React uygulaması ile JavaScript/Java
çekirdek kütüphaneleri.

Hesap motorları dış dönüşüm paketi kullanmaz. React arayüzü, HTTP API ve Java
uyarlaması aynı kimlikleri ve ortak referans vektörlerini kullanır.

## Neler var?

- Fiziksel birimler: uzunluk, hız, alan, açı, kütle, basınç ve sıcaklık
- Harita ölçümü: iki nokta arası elipsoidal mesafe, başlangıç/varış azimutu
  ve çok parçalı çizgi uzunluğu
- WGS 84 formatları: DD, DMS, DDM, MGRS, UTM/UPS, GARS ve GEOREF
- CRS: EPSG:4326, EPSG:3857, WGS 84 UTM zonları ve UPS
- JavaScript paketi: `@convert-tools/core`
- Java 17 çekirdeği: `io.github.mertc0604:convert-tools-core`
- Aynı motoru kullanan JSON API: `GET/POST /api/convert`
- Türkçe ve İngilizce React arayüzü

## Sorumluluk sınırları

`units` ve `geodesy` birbirinden ayrıdır:

- `convertUnits(...)`, zaten bilinen bir fiziksel değerin birimini değiştirir.
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
lib/api/                      HTTP istek/yanıt adaptörü

packages/
  core-js/
    src/
      exact/                  BigInt tabanlı kesin rasyonel matematik
      units/
        catalog/              Her fiziksel büyüklük ayrı dosyada
        converter.js          Birim dönüşüm servisi
        registry.js           Birim kataloğu
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
      geodesy/                Java WGS 84 ölçüm motoru

contracts/test-vectors/       JS ve Java için ortak doğruluk vektörleri
tests/                        Core, HTTP ve render testleri
```

React kodu hesap formülü içermez. HTTP katmanı da yalnızca public core API'yi
çağırır. Böylece tarayıcı, sunucu ve başka projelerde aynı sonuç üretilir.

## JavaScript kullanımı

### Birim dönüşümü

```js
import { convertUnits } from "@convert-tools/core/units";

const result = convertUnits(
  "1",
  "length",
  "nautical-mile",
  "metre",
);

console.log(result.value); // "1852"
```

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

Metre sonucunu NM, km veya mile çevirmek için ayrıca `convertUnits` çağrılır.
Hesaplanan `number` sonucu hesap katmanında yuvarlanmaz; yuvarlama yalnız
sunumda yapılır.

## Java kullanımı

```java
GeoPoint ankara = new GeoPoint(39.933365, 32.859742);
GeoPoint istanbul = new GeoPoint(41.008238, 28.978359);

GeodesicResult result = Geodesic.inverse(ankara, istanbul);
System.out.println(result.distanceMetres());
```

Java birim motoru aynı kategori/birim kimliklerini kullanır:

```java
UnitConversion result = UnitConverter.convert(
    "1",
    "length",
    "nautical-mile",
    "metre",
    24
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

Fiziksel birim oranları JavaScript'te `BigInt`, Java'da `BigInteger` pay/payda
olarak tutulur. Deniz mili tam `1852 m`, uluslararası ayak tam `0.3048 m`
kabul edilir. NATO 6400 mil ile 6000'lik mil ayrı birimlerdir.

Harita ölçümü WGS 84 dönel elipsoidi üzerinde inverse/direct geodezik çözer.
Normal çiftlerde hızlı iteratif inverse çözüm, antipodale yakın çiftlerde
direct çözüm ve sönümlü sayısal atış yedeği kullanılır. Kalıcı test kümesindeki
ekvator, antimeridyen, kutup ve antipodal vektörler bağımsız referanslara göre
`1 mm` toleransla doğrulanır. Çok parçalı toplamda Neumaier telafili toplama
kullanılır.

Bu değer elipsoit yüzey mesafesidir. Şunlarla aynı değildir:

- EPSG:3857 üzerinde düz çizgi mesafesi
- UTM grid mesafesi
- rhumb line / sabit kerteriz yolu
- rakım içeren 3B eğik mesafe

Sayısal doğruluk, kaynak koordinatın veya sensörün gerçek dünya doğruluğunu
artırmaz. Operasyonel kullanımda datum, yükseklik modeli, cihaz hatası ve
yetkili referans yazılımıyla bağımsız kabul testi ayrıca yapılmalıdır.
