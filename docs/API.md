# Convert API

Yerel adres: `http://127.0.0.1:5173/api/convert`

- `GET`: yetenekler, kimlikler ve desteklenen işlemler
- `POST`: dönüşüm veya geodezik ölçüm
- `OPTIONS`: CORS ön kontrolü
- Hatalı girdi: `400` ve `{ "error": "..." }`
- Contract sürümü: `1.1`

## Birim dönüşümü

```json
{
  "type": "unit",
  "category": "speed",
  "value": "1",
  "from": "knot",
  "to": "metre-second",
  "precision": 24
}
```

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
      "symbol": "NM"
    }
  }
}
```

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
