package io.github.mertc0604.converttools.geodesy;

public record GeoPoint(double latitude, double longitude) {
    public GeoPoint {
        if (!Double.isFinite(latitude) || latitude < -90 || latitude > 90) {
            throw new IllegalArgumentException(
                    "Latitude must be finite and between -90 and 90."
            );
        }
        if (!Double.isFinite(longitude) || longitude < -180 || longitude > 180) {
            throw new IllegalArgumentException(
                    "Longitude must be finite and between -180 and 180."
            );
        }
    }

    public static double normalizeLongitude(double longitude) {
        double normalized = ((longitude + 180) % 360 + 360) % 360 - 180;
        return normalized == -180 && longitude > 0 ? 180 : normalized;
    }
}
