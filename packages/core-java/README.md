# Convert Tools Core — Java

Java 17 için dış bağımlılığı olmayan birim dönüşümü ve WGS 84 geodezi
çekirdeğidir. JavaScript çekirdeğiyle aynı birim kimliklerini, metre/derece
sözleşmesini ve `contracts/test-vectors` referanslarını kullanır.

## Birim dönüşümü

```java
UnitConversion result = UnitConverter.convert(
    "1",
    "length",
    "nautical-mile",
    "metre",
    24
);

System.out.println(result.value()); // 1852
```

## İki harita noktası arasındaki mesafe

```java
GeoPoint ankara = new GeoPoint(39.933365, 32.859742);
GeoPoint istanbul = new GeoPoint(41.008238, 28.978359);
GeodesicResult result = Geodesic.inverse(ankara, istanbul);

System.out.println(result.distanceMetres());
System.out.println(result.initialBearingDegrees());
```

## Harita çizgisi uzunluğu

```java
PolylineMeasurement measurement = Geodesic.measurePolyline(List.of(
    new GeoPoint(39.933365, 32.859742),
    new GeoPoint(40.2, 31.5),
    new GeoPoint(41.008238, 28.978359)
));
```

Hesaplar iki boyutlu WGS 84 elipsoit yüzey mesafesidir. Web Mercator piksel
mesafesi, rhumb line, grid mesafesi veya yükseklik içeren 3B eğik mesafe
değildir.
