package io.github.mertc0604.converttools.geodesy;

public record GeodesicResult(
        double distanceMetres,
        Double initialBearingDegrees,
        Double finalBearingDegrees,
        boolean azimuthDefined,
        boolean ambiguous,
        String ellipsoid,
        String algorithm,
        String solver,
        int iterations
) {
}
