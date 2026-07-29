package io.github.mertc0604.converttools.coordinates.projection;

import io.github.mertc0604.converttools.coordinates.core.CoordinateMath;
import io.github.mertc0604.converttools.coordinates.core.Wgs84;
import io.github.mertc0604.converttools.coordinates.model.CoordinatePoint;
import io.github.mertc0604.converttools.coordinates.model.GridCoordinate;

public final class UtmUps {
    private static final double UTM_FALSE_EASTING = 500000;
    private static final double UTM_FALSE_NORTHING = 10000000;
    private static final double UPS_FALSE_ORIGIN = 2000000;
    private static final int UTM_REFINEMENT_ITERATIONS = 3;
    private static final double UTM_REFINEMENT_STEP_DEGREES = 1e-5;
    private static final double UTM_REFINEMENT_MAX_CORRECTION_DEGREES = 1e-4;
    private static final double UTM_REFINEMENT_MAX_INITIAL_RESIDUAL_METRES = 1;
    private static final double UTM_REFINEMENT_TARGET_METRES = 1e-7;

    private UtmUps() {
    }

    public static int standardUtmZone(double latitude, double longitude) {
        new CoordinatePoint(latitude, longitude);
        if (latitude < -80 || latitude >= 84) {
            return 0;
        }
        double normalized = longitude == 180
                ? Math.nextDown(180.0)
                : longitude;
        int zone = Math.max(
                1,
                Math.min(
                        60,
                        (int) Math.floor((normalized + 180) / 6) + 1
                )
        );

        if (latitude >= 56
                && latitude < 64
                && normalized >= 3
                && normalized < 12) {
            zone = 32;
        } else if (latitude >= 72
                && latitude < 84
                && normalized >= 0
                && normalized < 42) {
            if (normalized < 9) {
                zone = 31;
            } else if (normalized < 21) {
                zone = 33;
            } else if (normalized < 33) {
                zone = 35;
            } else {
                zone = 37;
            }
        }
        return zone;
    }

    public static double centralMeridian(int zone) {
        validateUtmZone(zone);
        return zone * 6 - 183;
    }

    public static GridCoordinate utmForward(
            double latitude,
            double longitude
    ) {
        int zone = standardUtmZone(latitude, longitude);
        if (zone == 0) {
            throw new IllegalArgumentException(
                    "UTM is defined between 80°S and 84°N."
            );
        }
        return utmForward(latitude, longitude, zone);
    }

    public static GridCoordinate utmForward(
            double latitude,
            double longitude,
            int zone
    ) {
        return calculateUtmForward(latitude, longitude, zone, 0);
    }

    public static CoordinatePoint utmInverse(
            int zone,
            boolean north,
            double easting,
            double northing
    ) {
        validateUtmZone(zone);
        if (!Double.isFinite(easting)
                || !Double.isFinite(northing)
                || easting < 0
                || easting > 1000000
                || northing < 0
                || northing > 10000000) {
            throw new IllegalArgumentException(
                    "UTM easting or northing is outside the supported range."
            );
        }

        double e2 = Wgs84.ECCENTRICITY_SQUARED;
        double ep2 = Wgs84.SECOND_ECCENTRICITY_SQUARED;
        double e4 = e2 * e2;
        double e6 = e4 * e2;
        double x = easting - UTM_FALSE_EASTING;
        double y = north ? northing : northing - UTM_FALSE_NORTHING;
        double meridionalDistance = y / Wgs84.UTM_SCALE;
        double mu = meridionalDistance
                / (Wgs84.SEMI_MAJOR_AXIS
                * (1 - e2 / 4 - 3 * e4 / 64 - 5 * e6 / 256));
        double e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
        double e12 = e1 * e1;
        double e13 = e12 * e1;
        double e14 = e12 * e12;
        double footprint = mu
                + (3 * e1 / 2 - 27 * e13 / 32) * Math.sin(2 * mu)
                + (21 * e12 / 16 - 55 * e14 / 32) * Math.sin(4 * mu)
                + 151 * e13 / 96 * Math.sin(6 * mu)
                + 1097 * e14 / 512 * Math.sin(8 * mu);

        double sinFootprint = Math.sin(footprint);
        double cosFootprint = Math.cos(footprint);
        double tanFootprint = Math.tan(footprint);
        double n1 = Wgs84.SEMI_MAJOR_AXIS
                / Math.sqrt(1 - e2 * sinFootprint * sinFootprint);
        double r1 = Wgs84.SEMI_MAJOR_AXIS * (1 - e2)
                / Math.pow(
                        1 - e2 * sinFootprint * sinFootprint,
                        1.5
                );
        double t1 = tanFootprint * tanFootprint;
        double c1 = ep2 * cosFootprint * cosFootprint;
        double d = x / (n1 * Wgs84.UTM_SCALE);
        double d2 = d * d;
        double d3 = d2 * d;
        double d4 = d2 * d2;
        double d5 = d4 * d;
        double d6 = d3 * d3;

        double latitude = (footprint
                - n1 * tanFootprint / r1
                * (d2 / 2
                - (5 + 3 * t1 + 10 * c1
                - 4 * c1 * c1 - 9 * ep2) * d4 / 24
                + (61 + 90 * t1 + 298 * c1
                + 45 * t1 * t1 - 252 * ep2
                - 3 * c1 * c1) * d6 / 720))
                * CoordinateMath.RADIAN;
        double longitude = centralMeridian(zone)
                + (d
                - (1 + 2 * t1 + c1) * d3 / 6
                + (5 - 2 * c1 + 28 * t1
                - 3 * c1 * c1 + 8 * ep2
                + 24 * t1 * t1) * d5 / 120)
                / cosFootprint
                * CoordinateMath.RADIAN;

        return refineUtmInverse(
                zone,
                north,
                easting,
                northing,
                new CoordinatePoint(
                        latitude,
                        CoordinateMath.normalizeLongitude(longitude)
                )
        );
    }

    public static GridCoordinate upsForward(
            double latitude,
            double longitude
    ) {
        return upsForward(latitude, longitude, latitude >= 0);
    }

    public static GridCoordinate upsForward(
            double latitude,
            double longitude,
            boolean north
    ) {
        new CoordinatePoint(latitude, longitude);
        if ((north && latitude < 60) || (!north && latitude > -60)) {
            throw new IllegalArgumentException(
                    "UPS coordinates must be within 30° of the selected pole."
            );
        }

        double signedLatitude = north ? latitude : -latitude;
        double tangent = Math.tan(
                signedLatitude * CoordinateMath.DEGREE
        );
        double conformal = Wgs84.conformalTangent(tangent);
        double rho = Math.hypot(1, conformal) + Math.abs(conformal);
        if (conformal >= 0) {
            rho = signedLatitude == 90 ? 0 : 1 / rho;
        }
        rho *= polarConstant();

        double longitudeRadians = CoordinateMath.normalizeLongitude(longitude)
                * CoordinateMath.DEGREE;
        double easting = UPS_FALSE_ORIGIN
                + rho * Math.sin(longitudeRadians);
        double northing = UPS_FALSE_ORIGIN
                + (north ? -rho : rho) * Math.cos(longitudeRadians);
        return new GridCoordinate(0, north, easting, northing);
    }

    public static CoordinatePoint upsInverse(
            boolean north,
            double easting,
            double northing
    ) {
        if (!Double.isFinite(easting)
                || !Double.isFinite(northing)
                || easting < 700000
                || easting > 3300000
                || northing < 700000
                || northing > 3300000) {
            throw new IllegalArgumentException(
                    "UPS easting or northing is outside the supported range."
            );
        }

        double x = easting - UPS_FALSE_ORIGIN;
        double y = northing - UPS_FALSE_ORIGIN;
        double rho = Math.hypot(x, y);
        double t = rho == 0
                ? Math.pow(Math.ulp(1.0), 2)
                : rho / polarConstant();
        double conformal = (1 / t - t) / 2;
        double tangent = Wgs84.inverseConformalTangent(conformal);
        double latitude = (north ? 1 : -1)
                * Math.atan(tangent)
                * CoordinateMath.RADIAN;
        double longitude = Math.atan2(x, north ? -y : y)
                * CoordinateMath.RADIAN;
        return new CoordinatePoint(
                latitude,
                CoordinateMath.normalizeLongitude(longitude)
        );
    }

    public static GridCoordinate forward(
            double latitude,
            double longitude
    ) {
        int zone = standardUtmZone(latitude, longitude);
        return zone == 0
                ? upsForward(latitude, longitude)
                : utmForward(latitude, longitude, zone);
    }

    public static CoordinatePoint inverse(
            int zone,
            boolean north,
            double easting,
            double northing
    ) {
        if (zone < 0 || zone > 60) {
            throw new IllegalArgumentException(
                    "Zone must be between 0 and 60."
            );
        }
        return zone == 0
                ? upsInverse(north, easting, northing)
                : utmInverse(zone, north, easting, northing);
    }

    private static GridCoordinate calculateUtmForward(
            double latitude,
            double longitude,
            int zone,
            double zoneToleranceDegrees
    ) {
        new CoordinatePoint(latitude, longitude);
        if (latitude < -80 - zoneToleranceDegrees
                || latitude > 84 + zoneToleranceDegrees) {
            throw new IllegalArgumentException(
                    "UTM is defined between 80°S and 84°N."
            );
        }
        validateUtmZone(zone);

        double latitudeRadians = latitude * CoordinateMath.DEGREE;
        double normalizedLongitude =
                CoordinateMath.normalizeLongitude(longitude);
        double longitudeArcDegrees = CoordinateMath.normalizeLongitude(
                normalizedLongitude - centralMeridian(zone)
        );
        if (Math.abs(longitudeArcDegrees) > 6 + zoneToleranceDegrees) {
            throw new IllegalArgumentException(
                    "Longitude is too far from the selected UTM zone."
            );
        }

        double e2 = Wgs84.ECCENTRICITY_SQUARED;
        double ep2 = Wgs84.SECOND_ECCENTRICITY_SQUARED;
        double sinLatitude = Math.sin(latitudeRadians);
        double cosLatitude = Math.cos(latitudeRadians);
        double tangentLatitude = Math.tan(latitudeRadians);
        double n = Wgs84.SEMI_MAJOR_AXIS
                / Math.sqrt(1 - e2 * sinLatitude * sinLatitude);
        double t = tangentLatitude * tangentLatitude;
        double c = ep2 * cosLatitude * cosLatitude;
        double longitudeArc =
                longitudeArcDegrees * CoordinateMath.DEGREE;
        double aa = cosLatitude * longitudeArc;
        double aa2 = aa * aa;
        double aa3 = aa2 * aa;
        double aa4 = aa2 * aa2;
        double aa5 = aa4 * aa;
        double aa6 = aa3 * aa3;

        double easting = UTM_FALSE_EASTING
                + Wgs84.UTM_SCALE * n
                * (aa
                + (1 - t + c) * aa3 / 6
                + (5 - 18 * t + t * t + 72 * c - 58 * ep2)
                * aa5 / 120);
        double northing = Wgs84.UTM_SCALE
                * (Wgs84.meridionalArc(latitudeRadians)
                + n * tangentLatitude
                * (aa2 / 2
                + (5 - t + 9 * c + 4 * c * c) * aa4 / 24
                + (61 - 58 * t + t * t
                + 600 * c - 330 * ep2) * aa6 / 720));
        boolean north = latitude >= 0;
        if (!north) {
            northing += UTM_FALSE_NORTHING;
        }
        return new GridCoordinate(zone, north, easting, northing);
    }

    private static CoordinatePoint refineUtmInverse(
            int zone,
            boolean north,
            double easting,
            double northing,
            CoordinatePoint initialPoint
    ) {
        CoordinatePoint point = initialPoint;
        GridCoordinate projected = projectForHemisphere(
                point.latitude(),
                point.longitude(),
                zone,
                north
        );
        if (projected == null) {
            return point;
        }

        double eastingResidual = easting - projected.easting();
        double northingResidual = northing - projected.northing();
        double residualSquared = eastingResidual * eastingResidual
                + northingResidual * northingResidual;
        if (residualSquared
                > UTM_REFINEMENT_MAX_INITIAL_RESIDUAL_METRES
                * UTM_REFINEMENT_MAX_INITIAL_RESIDUAL_METRES) {
            return point;
        }

        for (int iteration = 0;
             iteration < UTM_REFINEMENT_ITERATIONS
                     && residualSquared
                     > UTM_REFINEMENT_TARGET_METRES
                     * UTM_REFINEMENT_TARGET_METRES;
             iteration++) {
            double latitudeStep =
                    point.latitude() + UTM_REFINEMENT_STEP_DEGREES <= 84
                            ? UTM_REFINEMENT_STEP_DEGREES
                            : -UTM_REFINEMENT_STEP_DEGREES;
            double longitudeCandidate =
                    CoordinateMath.normalizeLongitude(
                            point.longitude()
                                    + UTM_REFINEMENT_STEP_DEGREES
                    );
            double longitudeStep = CoordinateMath.normalizeLongitude(
                    longitudeCandidate - point.longitude()
            );
            GridCoordinate latitudeProjection = projectForHemisphere(
                    point.latitude() + latitudeStep,
                    point.longitude(),
                    zone,
                    north
            );
            GridCoordinate longitudeProjection = projectForHemisphere(
                    point.latitude(),
                    longitudeCandidate,
                    zone,
                    north
            );
            if (latitudeProjection == null
                    || longitudeProjection == null
                    || longitudeStep == 0) {
                break;
            }

            double eastingByLatitude =
                    (latitudeProjection.easting() - projected.easting())
                            / latitudeStep;
            double northingByLatitude =
                    (latitudeProjection.northing() - projected.northing())
                            / latitudeStep;
            double eastingByLongitude =
                    (longitudeProjection.easting() - projected.easting())
                            / longitudeStep;
            double northingByLongitude =
                    (longitudeProjection.northing() - projected.northing())
                            / longitudeStep;
            double determinant = eastingByLatitude * northingByLongitude
                    - eastingByLongitude * northingByLatitude;
            if (!Double.isFinite(determinant)
                    || Math.abs(determinant) < 1) {
                break;
            }

            double latitudeCorrection =
                    (eastingResidual * northingByLongitude
                    - eastingByLongitude * northingResidual)
                    / determinant;
            double longitudeCorrection =
                    (eastingByLatitude * northingResidual
                    - eastingResidual * northingByLatitude)
                    / determinant;
            if (!Double.isFinite(latitudeCorrection)
                    || !Double.isFinite(longitudeCorrection)) {
                break;
            }

            double correctionScale = Math.min(
                    1,
                    UTM_REFINEMENT_MAX_CORRECTION_DEGREES
                            / Math.max(
                                    Math.abs(latitudeCorrection),
                                    Math.abs(longitudeCorrection)
                            )
            );
            latitudeCorrection *= correctionScale;
            longitudeCorrection *= correctionScale;
            CoordinatePoint candidate;
            try {
                candidate = new CoordinatePoint(
                        point.latitude() + latitudeCorrection,
                        CoordinateMath.normalizeLongitude(
                                point.longitude() + longitudeCorrection
                        )
                );
            } catch (IllegalArgumentException error) {
                break;
            }
            if (candidate.latitude() < -80 || candidate.latitude() > 84) {
                break;
            }

            GridCoordinate candidateProjection = projectForHemisphere(
                    candidate.latitude(),
                    candidate.longitude(),
                    zone,
                    north
            );
            if (candidateProjection == null) {
                break;
            }
            double candidateEastingResidual =
                    easting - candidateProjection.easting();
            double candidateNorthingResidual =
                    northing - candidateProjection.northing();
            double candidateResidualSquared =
                    candidateEastingResidual * candidateEastingResidual
                            + candidateNorthingResidual
                            * candidateNorthingResidual;
            if (candidateResidualSquared >= residualSquared) {
                break;
            }

            point = candidate;
            projected = candidateProjection;
            eastingResidual = candidateEastingResidual;
            northingResidual = candidateNorthingResidual;
            residualSquared = candidateResidualSquared;
        }
        return point;
    }

    private static GridCoordinate projectForHemisphere(
            double latitude,
            double longitude,
            int zone,
            boolean north
    ) {
        try {
            GridCoordinate projected = calculateUtmForward(
                    latitude,
                    longitude,
                    zone,
                    UTM_REFINEMENT_MAX_CORRECTION_DEGREES
            );
            double signedNorthing = projected.north()
                    ? projected.northing()
                    : projected.northing() - UTM_FALSE_NORTHING;
            return new GridCoordinate(
                    zone,
                    north,
                    projected.easting(),
                    signedNorthing
                            + (north ? 0 : UTM_FALSE_NORTHING)
            );
        } catch (IllegalArgumentException error) {
            return null;
        }
    }

    private static double polarConstant() {
        double c = (1 - Wgs84.FLATTENING)
                * Math.exp(
                        Wgs84.ECCENTRICITY
                                * atanh(Wgs84.ECCENTRICITY)
                );
        return 2
                * Wgs84.UPS_SCALE
                * Wgs84.SEMI_MAJOR_AXIS
                / c;
    }

    private static double atanh(double value) {
        return 0.5 * Math.log((1 + value) / (1 - value));
    }

    private static void validateUtmZone(int zone) {
        if (zone < 1 || zone > 60) {
            throw new IllegalArgumentException(
                    "UTM zone must be an integer from 1 to 60."
            );
        }
    }
}
