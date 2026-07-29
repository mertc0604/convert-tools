package io.github.mertc0604.converttools.units;

public record UnitConversion(
        Rational exactValue,
        Rational exactMetres,
        String value,
        boolean exactDecimal,
        boolean rounded,
        boolean terminatingDecimal,
        Integer requiredFractionDigits,
        int precision,
        String roundingMode,
        Rational exactFactor,
        String factor,
        UnitDefinition from,
        UnitDefinition to
) {
}
