package io.github.mertc0604.converttools.coordinates.core;

import io.github.mertc0604.converttools.geodesy.Ellipsoid;

public final class Wgs84 {
    public static final String ID = Ellipsoid.WGS84.id();
    public static final double SEMI_MAJOR_AXIS =
            Ellipsoid.WGS84.semiMajorAxisMetres();
    public static final double FLATTENING = Ellipsoid.WGS84.flattening();
    public static final double SEMI_MINOR_AXIS =
            Ellipsoid.WGS84.semiMinorAxisMetres();
    public static final double UTM_SCALE = 0.9996;
    public static final double UPS_SCALE = 0.994;
    public static final double ECCENTRICITY_SQUARED =
            FLATTENING * (2 - FLATTENING);
    public static final double ECCENTRICITY =
            Math.sqrt(ECCENTRICITY_SQUARED);
    public static final double SECOND_ECCENTRICITY_SQUARED =
            ECCENTRICITY_SQUARED / (1 - ECCENTRICITY_SQUARED);

    private Wgs84() {
    }

    public static double meridionalArc(double latitudeRadians) {
        double e2 = ECCENTRICITY_SQUARED;
        double e4 = e2 * e2;
        double e6 = e4 * e2;
        return SEMI_MAJOR_AXIS
                * ((1 - e2 / 4 - 3 * e4 / 64 - 5 * e6 / 256)
                * latitudeRadians
                - (3 * e2 / 8 + 3 * e4 / 32 + 45 * e6 / 1024)
                * Math.sin(2 * latitudeRadians)
                + (15 * e4 / 256 + 45 * e6 / 1024)
                * Math.sin(4 * latitudeRadians)
                - 35 * e6 / 3072 * Math.sin(6 * latitudeRadians));
    }

    public static double conformalTangent(double tangentLatitude) {
        double hypotenuse = Math.hypot(1, tangentLatitude);
        double eccentricTerm = Math.sinh(
                ECCENTRICITY
                        * atanh(
                                ECCENTRICITY
                                        * tangentLatitude
                                        / hypotenuse
                        )
        );
        return Math.hypot(1, eccentricTerm) * tangentLatitude
                - eccentricTerm * hypotenuse;
    }

    public static double inverseConformalTangent(double conformalTangent) {
        double oneMinusE2 = 1 - ECCENTRICITY_SQUARED;
        double tangentLatitude = Math.abs(conformalTangent) > 70
                ? conformalTangent
                * Math.exp(ECCENTRICITY * atanh(ECCENTRICITY))
                : conformalTangent / oneMinusE2;

        for (int iteration = 0; iteration < 6; iteration++) {
            double estimated = conformalTangent(tangentLatitude);
            double delta = ((conformalTangent - estimated)
                    * (1 + oneMinusE2
                    * tangentLatitude
                    * tangentLatitude))
                    / (oneMinusE2
                    * Math.hypot(1, tangentLatitude)
                    * Math.hypot(1, estimated));
            tangentLatitude += delta;
            if (Math.abs(delta)
                    < 1e-14 * Math.max(1, Math.abs(tangentLatitude))) {
                break;
            }
        }
        return tangentLatitude;
    }

    private static double atanh(double value) {
        return 0.5 * Math.log((1 + value) / (1 - value));
    }
}
