package io.github.mertc0604.converttools.coordinates.model;

import java.util.Objects;

public record CrsTransformation(
        String source,
        String target,
        double x,
        double y,
        String formattedX,
        String formattedY
) {
    public CrsTransformation {
        Objects.requireNonNull(source, "source");
        Objects.requireNonNull(target, "target");
        Objects.requireNonNull(formattedX, "formattedX");
        Objects.requireNonNull(formattedY, "formattedY");
        if (!Double.isFinite(x) || !Double.isFinite(y)) {
            throw new IllegalArgumentException(
                    "Transformed coordinates must be finite."
            );
        }
    }
}
