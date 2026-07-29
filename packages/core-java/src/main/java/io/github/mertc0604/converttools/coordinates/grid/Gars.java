package io.github.mertc0604.converttools.coordinates.grid;

import io.github.mertc0604.converttools.coordinates.model.AngularCell;
import io.github.mertc0604.converttools.coordinates.model.CoordinatePoint;

import java.util.Locale;
import java.util.regex.Pattern;

public final class Gars {
    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final Pattern VALUE = Pattern.compile(
            "^\\d{3}[A-HJ-NP-Z]{2}(?:[1-4](?:[1-9])?)?$"
    );

    private Gars() {
    }

    public static String encode(CoordinatePoint point) {
        return encode(point.longitude(), point.latitude());
    }

    public static String encode(double longitude, double latitude) {
        new CoordinatePoint(latitude, longitude);
        double longitudePosition = (longitude + 180) / 0.5;
        double latitudePosition = (latitude + 90) / 0.5;
        int longitudeIndex = Math.min(
                719,
                (int) Math.floor(longitudePosition)
        );
        int latitudeIndex = Math.min(
                359,
                (int) Math.floor(latitudePosition)
        );
        String longitudeBand = String.format(
                Locale.ROOT,
                "%03d",
                longitudeIndex + 1
        );
        String latitudeBand = new String(new char[]{
                ALPHABET.charAt(latitudeIndex / 24),
                ALPHABET.charAt(latitudeIndex % 24)
        });

        double longitudeRemainder = Math.min(
                1,
                Math.max(0, longitudePosition - longitudeIndex)
        );
        double latitudeRemainder = Math.min(
                1,
                Math.max(0, latitudePosition - latitudeIndex)
        );
        int quadrantColumn = Math.min(
                1,
                (int) Math.floor(longitudeRemainder * 2)
        );
        int quadrantRow = Math.min(
                1,
                (int) Math.floor(latitudeRemainder * 2)
        );
        int quadrant;
        if (quadrantRow == 1) {
            quadrant = quadrantColumn == 0 ? 1 : 2;
        } else {
            quadrant = quadrantColumn == 0 ? 3 : 4;
        }
        double longitudeInQuadrant =
                longitudeRemainder * 2 - quadrantColumn;
        double latitudeInQuadrant =
                latitudeRemainder * 2 - quadrantRow;
        int keypadColumn = Math.min(
                2,
                (int) Math.floor(longitudeInQuadrant * 3)
        );
        int keypadRowFromSouth = Math.min(
                2,
                (int) Math.floor(latitudeInQuadrant * 3)
        );
        int keypad = (2 - keypadRowFromSouth) * 3
                + keypadColumn
                + 1;
        return longitudeBand + latitudeBand + quadrant + keypad;
    }

    public static AngularCell decode(String value) {
        String source = value.toUpperCase(Locale.ROOT)
                .replaceAll("\\s+", "");
        if (!VALUE.matcher(source).matches()) {
            throw new IllegalArgumentException(
                    "Invalid GARS coordinate."
            );
        }

        int longitudeBand = Integer.parseInt(source.substring(0, 3));
        int latitudeBand = ALPHABET.indexOf(source.charAt(3)) * 24
                + ALPHABET.indexOf(source.charAt(4));
        if (longitudeBand < 1
                || longitudeBand > 720
                || latitudeBand < 0
                || latitudeBand > 359) {
            throw new IllegalArgumentException("Invalid GARS band.");
        }

        double longitude = -180 + (longitudeBand - 1) * 0.5;
        double latitude = -90 + latitudeBand * 0.5;
        double cellDegrees = 0.5;
        if (source.length() >= 6) {
            int quadrant = Character.digit(source.charAt(5), 10);
            longitude += (quadrant == 2 || quadrant == 4 ? 1 : 0)
                    * 0.25;
            latitude += (quadrant == 1 || quadrant == 2 ? 1 : 0)
                    * 0.25;
            cellDegrees = 0.25;
        }
        if (source.length() == 7) {
            int keypadIndex = Character.digit(source.charAt(6), 10) - 1;
            longitude += keypadIndex % 3 / 12.0;
            latitude += (2 - keypadIndex / 3) / 12.0;
            cellDegrees = 1.0 / 12;
        }

        return new AngularCell(
                new CoordinatePoint(
                        latitude + cellDegrees / 2,
                        longitude + cellDegrees / 2
                ),
                source.length(),
                cellDegrees
        );
    }
}
