package io.github.mertc0604.converttools.coordinates.model;

public record GridCoordinate(
        int zone,
        boolean north,
        double easting,
        double northing
) {
    public GridCoordinate {
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
    }
}
