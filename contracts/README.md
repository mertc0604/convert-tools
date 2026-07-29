# Cross-language contracts

`test-vectors` altındaki dosyalar JavaScript ve Java çekirdeklerinin ortak
kabul kaynağıdır.

- `unit-conversions.csv`: kategori/birim kimlikleri, gösterim sonucu ve uzunluk
  dönüşümleri için indirgenmiş kesin kesirler
- `geodesic-wgs84.csv`: WGS 84 inverse mesafe ve azimut referansları
- `coordinate-projections.csv`: DD girdilerinden UTM/UPS ve desteklenen EPSG
  hedeflerine üretilen ortak projeksiyon referansları

Geodezik mesafe toleransı metre cinsinden her satırda bulunur. Exact antipodal
noktalarda birden fazla en kısa yol olduğu için azimut alanları özellikle boş
bırakılır; iki çekirdek canonical sonuç döndürse de kabul testi yalnız mesafeyi
zorunlu tutar.

Koordinat projeksiyonlarında zon, yarımküre ve EPSG kimliği birebir
eşleşmelidir. `expected_x` ve `expected_y`, satırdaki `output_tolerance`
sınırında karşılaştırılır. Ters dönüşüm de
`roundtrip_tolerance_degrees` ile kontrol edilir. Coğrafi kutuplarda boylam
tekil olmadığı için yalnız enlem ve yeniden projeksiyon çıktısı zorunludur.

Yeni bir formül veya sabit değişikliği iki dilde de aynı vektörleri geçmeden
kabul edilmemelidir.

## Kesin uzunluk sözleşmesi

Uzunluk dönüşümünün değişmez değeri metre cinsinden indirgenmiş bir kesirdir.
JavaScript nesnelerinde hesap `bigint` ile yapılır; süreçler ve diller arasında
ise JSON güvenli biçim kullanılır:

```json
{
  "numerator": "1",
  "denominator": "1852"
}
```

`exactValue` hedef birimdeki kesin değeri, `exactMetres` aynı fiziksel
uzunluğun metre cinsinden değişmez değerini ve `exactFactor` kesin dönüşüm
oranını taşır. Payda her zaman pozitif, kesir indirgenmiş ve iki alan da onluk
tam sayı metnidir.

`value` yalnız gösterim içindir. `exactDecimal` false ve `rounded` true ise bu
metni sonraki hesap için kullanmak bilgi kaybettirir; zincirleme dönüşümlerde
`exactValue` veya `exactMetres` kullanılmalıdır. Yuvarlama modu `HALF_UP`,
`precision` aralığı 0–60'tır.

Yüksek hassasiyetli veya ondalıklı girdiler JSON/JavaScript Number olarak
verilmemelidir. Kesinlik için ondalık metin ya da JSON kesri kullanılmalıdır.
Bir dış istekte her kesir bileşeni en fazla 4096 onluk basamak, ondalık üs ise
-1000 ile +1000 arasındadır.
