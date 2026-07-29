package io.github.mertc0604.converttools.units;

public record UnitConversion(
        String value,
        boolean exactDecimal,
        boolean terminatingDecimal,
        Integer requiredFractionDigits,
        String factor,
        UnitDefinition from,
        UnitDefinition to
) {
}
