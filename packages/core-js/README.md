# @convert-tools/core

Dış çalışma zamanı bağımlılığı olmayan kesin uzunluk dönüşümü ve WGS 84
geodezi çekirdeği.

```js
import { convertLength } from "@convert-tools/core/length";
import {
  inverseGeodesic,
  measureGeodesicPolyline,
} from "@convert-tools/core/geodesy";

const first = convertLength("1", "metre", "nautical-mile");
const back = convertLength(
  first.exactValue,
  "nautical-mile",
  "metre",
);
```

Public alt yollar:

- `@convert-tools/core/length`
- `@convert-tools/core/units`
- `@convert-tools/core/geodesy`
- `@convert-tools/core`

`units` alt yolu yalnız uzunluk içerir ve geçiş uyumluluğu için korunur.
Yuvarlanmış `value` sunum içindir; zincirleme hesaplarda JSON uyumlu
`exactValue` kullanılmalıdır.

Girdiler derece, geodezik temel mesafeler metre cinsindedir. GeoJSON
`[longitude, latitude]` dizileri isimli `{ latitude, longitude }` nesnelerine
çevrilmelidir.

Üç bileşenli güney DMS girdisinde `S` öncesinde `"` veya `″` saniye işareti
kullanılır. Belirsiz `39d56m00.114s` değeri yönü sessizce değiştirmek yerine
reddedilir.

Tam mimari ve doğruluk notları için depo kökündeki `README.md` ve
`contracts/test-vectors` içeriğine bakın.
