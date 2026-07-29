# Convert

Türkçe ve İngilizce çalışan, çevrimdışı birim ve koordinat dönüştürücü.
Dönüşüm motoru bu projenin kendi kodudur; fiziksel birim, DMS, MGRS,
UTM/UPS, GARS, GEOREF veya EPSG dönüşümü için üçüncü taraf paket kullanmaz.

## Özellikler

- Fiziksel birimler: uzunluk, hız, alan, açı, kütle, basınç ve sıcaklık
- WGS 84 formatları: DD, DMS, DDM, MGRS, UTM/UPS, GARS ve GEOREF
- CRS: EPSG:4326, EPSG:3857, WGS 84 UTM ve UPS
- MGRS: UTM ve polar UPS bölgeleri, 1 m–100 km hassasiyet
- Türkçe/İngilizce arayüz ve kopyalanabilir sonuçlar
- Aynı motoru kullanan JSON API: `GET/POST /api/convert`

## Mimari

```text
app/
  api/convert/route.ts       HTTP API
components/
  common/                    Ortak küçük bileşenler
  coordinates/               Koordinat arayüzü
  units/                     Birim arayüzü
lib/convert/
  coordinates/
    crs.js                   EPSG dönüşüm yönlendirmesi
    dms.js                   Açı ayrıştırma ve biçimleme
    ellipsoid.js             WGS 84 sabitleri
    grid-references.js       GARS ve GEOREF
    mgrs.js                  MGRS kodlama/çözme
    utm-ups.js               TM ve polar stereografik izdüşüm
  index.js                   Kütüphanenin genel girişi
  request.js                 API istek sözleşmesi
tests/                       Referans, API ve render testleri
```

Arayüz, API ve proje içinden yapılan importlar aynı `lib/convert` motorunu
kullanır. Böylece üç farklı yerde farklı hesap oluşmaz.

## Çalıştırma

Masaüstündeki `Baslat.command` dosyasına çift tıklayın veya:

```bash
pnpm install --ignore-scripts
pnpm dev
```

Ardından `http://127.0.0.1:5173/` adresini açın.

```bash
pnpm test
pnpm lint
```

## Proje içinden kullanım

```js
import { convertUnits, coordinateResults, fromMgrs } from "@/lib/convert";

const distance = convertUnits(
  "1",
  "length",
  "nautical-mile",
  "metre",
);

const position = coordinateResults(
  fromMgrs("38SLC3918701405"),
  5,
);
```

## API

```bash
curl -X POST http://127.0.0.1:5173/api/convert \
  -H "Content-Type: application/json" \
  -d '{
    "type": "unit",
    "category": "length",
    "value": "1",
    "from": "nautical-mile",
    "to": "metre"
  }'
```

Yanıt:

```json
{
  "type": "unit",
  "category": "length",
  "input": { "value": "1", "unit": "nautical-mile", "symbol": "NM" },
  "result": {
    "value": "1852",
    "unit": "metre",
    "symbol": "m",
    "exactDecimal": true,
    "factor": "1852"
  }
}
```

Tüm istek biçimleri için [API belgesine](docs/API.md) bakın.

## Hassasiyet

Birim girdileri `Number` türüne dönüştürülmeden ayrıştırılır ve `BigInt`
pay/payda değerleriyle hesaplanır. Uluslararası deniz mili tam `1852 m`,
uluslararası ayak tam `0.3048 m` kabul edilir. NATO 6400 mil ile 6000'lik mil
ayrı tutulur.

Koordinat motoru WGS 84 elipsoidi üzerinde Transverse Mercator ve polar
stereografik denklemleri uygular. Hücre tabanlı MGRS, GARS ve GEOREF girdileri
merkez noktaya dönüştürülür. Referans vektörleri otomatik testlerle korunur.

GARS bir alan referansıdır; navigasyon veya hedefleme amacıyla
kullanılmamalıdır. Operasyonel sonuçlar yetkili veri ve yazılımla ayrıca
doğrulanmalıdır.
