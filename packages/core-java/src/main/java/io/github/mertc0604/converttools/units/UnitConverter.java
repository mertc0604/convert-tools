package io.github.mertc0604.converttools.units;

public final class UnitConverter {
    private UnitConverter() {
    }

    public static UnitConversion convert(
            String input,
            String categoryId,
            String fromId,
            String toId,
            int precision
    ) {
        UnitCategory category = UnitCatalog.category(categoryId);
        UnitDefinition from = category.unit(fromId);
        UnitDefinition to = category.unit(toId);
        Rational source = Rational.parse(input);
        Rational base = source.multiply(from.scale()).add(from.offset());
        Rational result = base.subtract(to.offset()).divide(to.scale());
        Rational factor = from.scale().divide(to.scale());
        Integer requiredFractionDigits = result.exactFractionDigits();

        return new UnitConversion(
                result.format(precision),
                requiredFractionDigits != null
                        && requiredFractionDigits <= precision,
                requiredFractionDigits != null,
                requiredFractionDigits,
                factor.format(precision),
                from,
                to
        );
    }
}
