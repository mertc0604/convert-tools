package io.github.mertc0604.converttools.units;

import java.util.Objects;

public record UnitDefinition(
        String id,
        String symbol,
        Rational scale,
        Rational offset
) {
    public UnitDefinition {
        Objects.requireNonNull(id, "id");
        Objects.requireNonNull(symbol, "symbol");
        Objects.requireNonNull(scale, "scale");
        Objects.requireNonNull(offset, "offset");
    }

    public static UnitDefinition linear(
            String id,
            String symbol,
            String scale
    ) {
        return new UnitDefinition(
                id,
                symbol,
                Rational.parse(scale),
                Rational.parse("0")
        );
    }

    public static UnitDefinition linear(
            String id,
            String symbol,
            long numerator,
            long denominator
    ) {
        return new UnitDefinition(
                id,
                symbol,
                Rational.of(numerator, denominator),
                Rational.parse("0")
        );
    }

    public static UnitDefinition affine(
            String id,
            String symbol,
            Rational scale,
            Rational offset
    ) {
        return new UnitDefinition(id, symbol, scale, offset);
    }
}
