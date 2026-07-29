package io.github.mertc0604.converttools.coordinates.model;

public record CoordinatePoint(double latitude, double longitude) {
    public CoordinatePoint {
        if (!Double.isFinite(latitude) || latitude < -90 || latitude > 90) {
            throw new IllegalArgumentException(
                    "Latitude must be between -90 and 90."
            );
        }
        if (!Double.isFinite(longitude)
                || longitude < -180
                || longitude > 180) {
            throw new IllegalArgumentException(
                    "Longitude must be between -180 and 180."
            );
        }
    }
}
