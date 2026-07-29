# Convert API

Yerel adres: `http://127.0.0.1:5173/api/convert`

- `GET` yetenekleri, birim kimliklerini ve örnek isteği döndürür.
- `POST` dönüşüm yapar.
- Hatalı kullanıcı girdileri `400` ve `{ "error": "..." }` döndürür.
- Tüm başarılı yanıtlar JSON'dur.

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

DMS ve DDM aynı `latitude` / `longitude` alanlarını kullanır. MGRS, GARS ve
GEOREF:

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

Desteklenen CRS ailesi:

- `EPSG:4326` — WGS 84 coğrafi
- `EPSG:3857` — Web Mercator
- `EPSG:32601`–`EPSG:32660` — WGS 84 / UTM kuzey
- `EPSG:32701`–`EPSG:32760` — WGS 84 / UTM güney
- `EPSG:5041` — WGS 84 / UPS kuzey
- `EPSG:5042` — WGS 84 / UPS güney

API her zaman X/Y sırası kullanır. `EPSG:4326` için X boylam, Y enlemdir.
