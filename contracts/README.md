# Cross-language contracts

`test-vectors` altındaki dosyalar JavaScript ve Java çekirdeklerinin ortak
kabul kaynağıdır.

- `unit-conversions.csv`: kategori/birim kimlikleri ve beklenen exact sonuç
- `geodesic-wgs84.csv`: WGS 84 inverse mesafe ve azimut referansları

Geodezik mesafe toleransı metre cinsinden her satırda bulunur. Exact antipodal
noktalarda birden fazla en kısa yol olduğu için azimut alanları özellikle boş
bırakılır; iki çekirdek canonical sonuç döndürse de kabul testi yalnız mesafeyi
zorunlu tutar.

Yeni bir formül veya sabit değişikliği iki dilde de aynı vektörleri geçmeden
kabul edilmemelidir.
