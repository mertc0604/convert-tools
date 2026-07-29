package io.github.mertc0604.converttools.coordinates.model;

import java.util.Objects;

public record AngularCell(
        CoordinatePoint center,
        int precision,
        double cellDegrees
) {
    public AngularCell {
        Objects.requireNonNull(center, "center");
        if (precision < 0) {
            throw new IllegalArgumentException(
                    "Angular cell precision cannot be negative."
            );
        }
        if (!Double.isFinite(cellDegrees) || cellDegrees <= 0) {
            throw new IllegalArgumentException(
                    "Angular cell resolution must be positive."
            );
        }
    }
}
