package io.github.mertc0604.converttools.geodesy;

public record DirectResult(
        GeoPoint destination,
        double finalBearingDegrees,
        String ellipsoid,
        String algorithm,
        int iterations
) {
}
