# Convert API

Yerel adres: `http://127.0.0.1:5173/api/convert`

- `GET`: yetenekler, kimlikler ve desteklenen işlemler
- `POST`: dönüşüm veya geodezik ölçüm
- `OPTIONS`: CORS ön kontrolü
- Hatalı girdi: `400` ve `{ "error": "..." }`
- Contract sürümü: `2.0`
- En büyük istek gövdesi: `131072` bayt
- Bir kesin sayı bileşeninde en fazla `4096` onluk basamak

## Kesin uzunluk dönüşümü

```json
{
  "type": "length",
  "value": "1",
  "from": "nautical-mile",
  "to": "metre",
  "precision": 24
}
```

Ondalık değerler JSON sayı olarak değil metin olarak gönderilir. Yanıt hem
gösterim değerini hem de zincirleme hesaplarda kullanılacak kesin kesri taşır:

```json
{
  "type": "length",
  "category": "length",
  "result": {
    "value": "1852",
    "unit": "metre",
    "symbol": "m",
    "exactDecimal": true,
    "rounded": false,
    "precision": 24,
    "roundingMode": "HALF_UP",
    "exactValue": {
      "numerator": "1852",
      "denominator": "1"
    },
    "exactMetres": {
      "numerator": "1852",
      "denominator": "1"
    }
  }
}
```

Örneğin `metre → deniz mili` sonucu sonsuz ondalıksa ikinci istekte
yuvarlanmış `value` yerine ilk yanıtın `exactValue` alanı gönderilir:

```json
{
  "type": "length",
  "exactValue": {
    "numerator": "1",
    "denominator": "1852"
  },
  "from": "nautical-mile",
  "to": "metre"
}
```

Eski istemciler için `type: "unit"` yalnız `category: "length"` ile kabul
edilir. Hız, alan, açı, kütle, basınç ve sıcaklık kategorileri bulunmaz.

## İki nokta arası WGS 84 mesafe

```json
{
  "type": "geodesic",
  "operation": "inverse",
  "start": {
    "latitude": 39.933365,
    "longitude": 32.859742
  },
  "end": {
    "latitude": 41.008238,
    "longitude": 28.978359
  },
  "outputUnit": "nautical-mile",
  "precision": 12
}
```

Yanıt, yuvarlanmamış sayısal `distanceMetres`, azimutlar, çözücü bilgisi ve
istenen gösterim birimini birlikte taşır:

```json
{
  "type": "geodesic",
  "operation": "inverse",
  "datum": "WGS84",
  "result": {
    "distanceMetres": 350091.7044265541,
    "initialBearingDegrees": 291.1840610098678,
    "finalBearingDegrees": 288.66413786850296,
    "azimuthDefined": true,
    "ambiguous": false,
    "ellipsoid": "WGS84",
    "algorithm": "ellipsoidal",
    "solver": "vincenty-inverse",
    "distance": {
      "distanceMetres": 350091.7044265541,
      "value": "189.034397638528",
      "unit": "nautical-mile",
      "symbol": "NM",
      "exactValue": {
        "numerator": "3500917044265541",
        "denominator": "18520000000000"
      },
      "exactMetres": {
        "numerator": "3500917044265541",
        "denominator": "10000000000"
      },
      "exactDecimal": false,
      "rounded": true,
      "precision": 12,
      "roundingMode": "HALF_UP"
    }
  }
}
```

`distanceMetres` geodezik çözücünün sayısal sonucudur. `distance.exactMetres`
bu sonucun API'ye aktarılan ondalık gösterimini kesin kesir olarak taşır;
sonraki birim değişikliklerinde `distance.exactValue` kullanılarak ilave
yuvarlama zincire sokulmaz.

## Harita çizgisi uzunluğu

Her ardışık çift ayrı WGS 84 geodezik segment olarak ölçülür:

```json
{
  "type": "geodesic",
  "operation": "polyline",
  "points": [
    { "latitude": 39.933365, "longitude": 32.859742 },
    { "latitude": 40.2, "longitude": 31.5 },
    { "latitude": 41.008238, "longitude": 28.978359 }
  ],
  "outputUnit": "kilometre"
}
```

HTTP API tek istekte en fazla `1000` nokta kabul eder. Daha büyük geometriler
istemci tarafında bölünebilir veya doğrudan core kütüphanesiyle ölçülebilir.

## Direct geodezik

Başlangıç noktası, başlangıç azimutu ve metre cinsinden mesafeden hedef nokta:

```json
{
  "type": "geodesic",
  "operation": "direct",
  "start": {
    "latitude": 39.933365,
    "longitude": 32.859742
  },
  "initialBearingDegrees": 291.184061009959,
  "distanceMetres": 350091.704424933
}
```

## Konum formatı dönüşümü

DD:

```json
{
  "type": "coordinate",
  "format": "dd",
  "value": {
    "latitude": "39.933365",
    "longitude": "32.859742"
  },
  "mgrsPrecision": 5
}
```

DMS ve DDM aynı `latitude` / `longitude` alanlarını kullanır.
Üç bileşenli güney DMS değerinde `S` öncesinde saniye işareti (`"` veya `″`)
bulunmalıdır; böylece `s` harfinin saniye mi güney yarımküre mi olduğu sessizce
yanlış yorumlanmaz.

MGRS, GARS ve GEOREF:

```json
{
  "type": "coordinate",
  "format": "mgrs",
  "value": { "coordinate": "38SLC3918701405" }
}
```

UTM/UPS:

```json
{
  "type": "coordinate",
  "format": "utm-ups",
  "value": {
    "zone": 36,
    "hemisphere": "N",
    "easting": 488015.988,
    "northing": 4420370.844
  }
}
```

UPS için `zone` değeri `0` kullanılır.

Yanıttaki `result.resolution` alanı her gösterimin çözünürlüğünü bildirir.
DD/DMS/DDM ve UTM/UPS için yuvarlama adımı; MGRS, GARS ve GEOREF için hücre
boyutu verilir. Hücre formatları özgün noktayı birebir geri üretmez; çözümleme
hücrenin merkez noktasını döndürür.

## CRS / EPSG dönüşümü

```json
{
  "type": "crs",
  "source": "EPSG:4326",
  "target": "EPSG:32636",
  "x": 32.859742,
  "y": 39.933365
}
```

Desteklenen aileler:

- `EPSG:4326` — WGS 84 coğrafi
- `EPSG:3857` — Web Mercator
- `EPSG:32601`–`EPSG:32660` — WGS 84 / UTM kuzey
- `EPSG:32701`–`EPSG:32760` — WGS 84 / UTM güney
- `EPSG:5041` — WGS 84 / UPS kuzey
- `EPSG:5042` — WGS 84 / UPS güney

API her zaman X/Y sırası kullanır. `EPSG:4326` için X boylam, Y enlemdir.
