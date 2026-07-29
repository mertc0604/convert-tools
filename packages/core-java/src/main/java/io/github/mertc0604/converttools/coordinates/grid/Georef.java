package io.github.mertc0604.converttools.coordinates.grid;

import io.github.mertc0604.converttools.coordinates.model.AngularCell;
import io.github.mertc0604.converttools.coordinates.model.CoordinatePoint;

import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class Georef {
    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final String DEGREE_ALPHABET =
            ALPHABET.substring(0, 15);
    private static final Pattern VALUE = Pattern.compile(
            "^([A-HJ-NP-Z]{4})(\\d*)$"
    );

    private Georef() {
    }

    public static String encode(CoordinatePoint point) {
        return encode(point.longitude(), point.latitude(), 4);
    }

    public static String encode(CoordinatePoint point, int precision) {
        return encode(point.longitude(), point.latitude(), precision);
    }

    public static String encode(
            double longitude,
            double latitude,
            int precision
    ) {
        new CoordinatePoint(latitude, longitude);
        validatePrecision(precision);

        double safeLongitude = longitude == 180 ? -180 : longitude;
        double shiftedLongitude = safeLongitude + 180;
        double shiftedLatitude = latitude + 90;
        int longitudeZone = (int) Math.floor(shiftedLongitude / 15);
        int latitudeZone = Math.min(
                11,
                (int) Math.floor(shiftedLatitude / 15)
        );
        double longitudeWithinZone =
                shiftedLongitude - longitudeZone * 15;
        double latitudeWithinZone =
                shiftedLatitude - latitudeZone * 15;
        int longitudeDegree =
                (int) Math.floor(longitudeWithinZone);
        int latitudeDegree = Math.min(
                14,
                (int) Math.floor(latitudeWithinZone)
        );

        StringBuilder result = new StringBuilder();
        result.append(ALPHABET.charAt(longitudeZone));
        result.append(ALPHABET.charAt(latitudeZone));
        result.append(DEGREE_ALPHABET.charAt(longitudeDegree));
        result.append(DEGREE_ALPHABET.charAt(latitudeDegree));

        if (precision > 0) {
            double scale = Math.pow(10, Math.max(0, precision - 2));
            double divisor = precision == 1 ? 10 : 1 / scale;
            double longitudeMinutes =
                    (longitudeWithinZone - longitudeDegree) * 60;
            double latitudeMinutes =
                    (latitudeWithinZone - latitudeDegree) * 60;
            int maximumDigits = (int) Math.floor(60 / divisor) - 1;
            int longitudeDigits = Math.min(
                    maximumDigits,
                    (int) Math.floor(
                            longitudeMinutes / divisor + 1e-10
                    )
            );
            int latitudeDigits = Math.min(
                    maximumDigits,
                    (int) Math.floor(
                            latitudeMinutes / divisor + 1e-10
                    )
            );
            result.append(String.format(
                    Locale.ROOT,
                    "%0" + precision + "d",
                    longitudeDigits
            ));
            result.append(String.format(
                    Locale.ROOT,
                    "%0" + precision + "d",
                    latitudeDigits
            ));
        }
        return result.toString();
    }

    public static AngularCell decode(String value) {
        String source = value.toUpperCase(Locale.ROOT)
                .replaceAll("\\s+", "");
        Matcher matcher = VALUE.matcher(source);
        if (!matcher.matches()
                || matcher.group(2).length() % 2 != 0
                || matcher.group(2).length() > 10) {
            throw new IllegalArgumentException(
                    "Invalid GEOREF coordinate."
            );
        }

        String letters = matcher.group(1);
        int longitudeZone = ALPHABET.indexOf(letters.charAt(0));
        int latitudeZone = ALPHABET.indexOf(letters.charAt(1));
        int longitudeDegree =
                DEGREE_ALPHABET.indexOf(letters.charAt(2));
        int latitudeDegree =
                DEGREE_ALPHABET.indexOf(letters.charAt(3));
        if (longitudeZone < 0
                || longitudeZone > 23
                || latitudeZone < 0
                || latitudeZone > 11
                || longitudeDegree < 0
                || latitudeDegree < 0) {
            throw new IllegalArgumentException(
                    "Invalid GEOREF grid letters."
            );
        }

        String digits = matcher.group(2);
        int precision = digits.length() / 2;
        String longitudeText = digits.substring(0, precision);
        String latitudeText = digits.substring(precision);
        double stepMinutes = precision == 0
                ? 60
                : Math.pow(10, 2 - precision);
        double longitudeMinutes = precision == 0
                ? 0
                : Integer.parseInt(longitudeText) * stepMinutes;
        double latitudeMinutes = precision == 0
                ? 0
                : Integer.parseInt(latitudeText) * stepMinutes;
        if (longitudeMinutes >= 60 || latitudeMinutes >= 60) {
            throw new IllegalArgumentException(
                    "Invalid GEOREF minute value."
            );
        }

        double cellDegrees = stepMinutes / 60;
        return new AngularCell(
                new CoordinatePoint(
                        -90
                                + latitudeZone * 15
                                + latitudeDegree
                                + (latitudeMinutes + stepMinutes / 2)
                                / 60,
                        -180
                                + longitudeZone * 15
                                + longitudeDegree
                                + (longitudeMinutes + stepMinutes / 2)
                                / 60
                ),
                precision,
                cellDegrees
        );
    }

    private static void validatePrecision(int precision) {
        if (precision < 0 || precision > 5) {
            throw new IllegalArgumentException(
                    "GEOREF precision must be between 0 and 5."
            );
        }
    }
}
