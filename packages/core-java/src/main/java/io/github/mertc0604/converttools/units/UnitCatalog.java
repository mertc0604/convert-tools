package io.github.mertc0604.converttools.units;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static io.github.mertc0604.converttools.units.UnitDefinition.affine;
import static io.github.mertc0604.converttools.units.UnitDefinition.linear;

public final class UnitCatalog {
    private static final List<UnitCategory> CATEGORY_LIST = List.of(
            length(),
            speed(),
            area(),
            angle(),
            mass(),
            pressure(),
            temperature()
    );
    private static final Map<String, UnitCategory> CATEGORIES =
            indexCategories();

    private UnitCatalog() {
    }

    public static UnitCategory category(String categoryId) {
        UnitCategory category = CATEGORIES.get(categoryId);
        if (category == null) {
            throw new IllegalArgumentException(
                    "Unknown unit category: " + categoryId + "."
            );
        }
        return category;
    }

    public static List<UnitCategory> categories() {
        return CATEGORY_LIST;
    }

    private static Map<String, UnitCategory> indexCategories() {
        LinkedHashMap<String, UnitCategory> result = new LinkedHashMap<>();
        for (UnitCategory category : CATEGORY_LIST) {
            result.put(category.id(), category);
        }
        return Collections.unmodifiableMap(result);
    }

    private static UnitCategory length() {
        return new UnitCategory("length", List.of(
                linear("millimetre", "mm", "0.001"),
                linear("centimetre", "cm", "0.01"),
                linear("metre", "m", "1"),
                linear("kilometre", "km", "1000"),
                linear("inch", "in", "0.0254"),
                linear("foot", "ft", "0.3048"),
                linear("yard", "yd", "0.9144"),
                linear("mile", "mi", "1609.344"),
                linear("nautical-mile", "NM", "1852")
        ));
    }

    private static UnitCategory speed() {
        return new UnitCategory("speed", List.of(
                linear("metre-second", "m/s", "1"),
                linear("kilometre-hour", "km/h", 5, 18),
                linear("knot", "kt", 463, 900),
                linear("mile-hour", "mph", "0.44704"),
                linear("foot-second", "ft/s", "0.3048")
        ));
    }

    private static UnitCategory area() {
        return new UnitCategory("area", List.of(
                linear("square-metre", "m²", "1"),
                linear("hectare", "ha", "10000"),
                linear("square-kilometre", "km²", "1000000"),
                linear("square-foot", "ft²", "0.09290304"),
                linear("acre", "ac", "4046.8564224"),
                linear("square-nautical-mile", "NM²", "3429904")
        ));
    }

    private static UnitCategory angle() {
        return new UnitCategory("angle", List.of(
                linear("degree", "°", "1"),
                linear("gon", "gon", "0.9"),
                linear("nato-mil", "mil", "0.05625"),
                linear("wp-mil", "mil (6000)", "0.06"),
                linear("minute-angle", "MOA", 1, 60),
                linear("arc-second", "arcsec", 1, 3600)
        ));
    }

    private static UnitCategory mass() {
        return new UnitCategory("mass", List.of(
                linear("milligram", "mg", "0.000001"),
                linear("gram", "g", "0.001"),
                linear("kilogram", "kg", "1"),
                linear("tonne", "t", "1000"),
                linear("ounce", "oz", "0.028349523125"),
                linear("pound", "lb", "0.45359237")
        ));
    }

    private static UnitCategory pressure() {
        return new UnitCategory("pressure", List.of(
                linear("pascal", "Pa", "1"),
                linear("kilopascal", "kPa", "1000"),
                linear("hectopascal", "hPa", "100"),
                linear("bar", "bar", "100000"),
                linear("atmosphere", "atm", "101325"),
                linear("psi", "psi", "6894.757293168361336722673")
        ));
    }

    private static UnitCategory temperature() {
        return new UnitCategory("temperature", List.of(
                affine(
                        "celsius",
                        "°C",
                        Rational.parse("1"),
                        Rational.parse("0")
                ),
                affine(
                        "kelvin",
                        "K",
                        Rational.parse("1"),
                        Rational.parse("-273.15")
                ),
                affine(
                        "fahrenheit",
                        "°F",
                        Rational.of(5, 9),
                        Rational.of(-160, 9)
                ),
                affine(
                        "rankine",
                        "°R",
                        Rational.of(5, 9),
                        Rational.parse("-273.15")
                )
        ));
    }
}
