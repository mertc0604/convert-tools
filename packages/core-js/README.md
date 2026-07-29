# @convert-tools/core

Dış çalışma zamanı bağımlılığı olmayan exact birim dönüşümü ve WGS 84 geodezi
çekirdeği.

```js
import { convertUnits } from "@convert-tools/core/units";
import {
  inverseGeodesic,
  measureGeodesicPolyline,
} from "@convert-tools/core/geodesy";
```

Public alt yollar:

- `@convert-tools/core/units`
- `@convert-tools/core/geodesy`
- `@convert-tools/core`

Girdiler derece, geodezik temel mesafeler metre cinsindedir. GeoJSON
`[longitude, latitude]` dizileri isimli `{ latitude, longitude }` nesnelerine
çevrilmelidir.

Tam mimari ve doğruluk notları için depo kökündeki `README.md` ve
`contracts/test-vectors` içeriğine bakın.
