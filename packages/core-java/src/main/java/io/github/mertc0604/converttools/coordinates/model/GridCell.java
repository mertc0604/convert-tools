package io.github.mertc0604.converttools.coordinates.model;

import java.util.Objects;

public record GridCell(
        CoordinatePoint point,
        int zone,
        boolean north,
        double easting,
        double northing,
        int precision,
        double cellMetres,
        boolean decodedAtCellCenter
) {
    public GridCell {
        Objects.requireNonNull(point, "point");
        if (zone < 0 || zone > 60) {
            throw new IllegalArgumentException(
                    "Grid zone must be between 0 and 60."
            );
        }
        if (!Double.isFinite(easting) || !Double.isFinite(northing)) {
            throw new IllegalArgumentException(
                    "Grid coordinates must be finite."
            );
        }
        if (precision < 0 || precision > 5) {
            throw new IllegalArgumentException(
                    "Grid precision must be between 0 and 5."
            );
        }
        if (!Double.isFinite(cellMetres) || cellMetres <= 0) {
            throw new IllegalArgumentException(
                    "Grid cell resolution must be positive."
            );
        }
    }
}
