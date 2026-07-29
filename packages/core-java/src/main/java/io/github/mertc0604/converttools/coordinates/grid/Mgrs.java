package io.github.mertc0604.converttools.coordinates.grid;

import io.github.mertc0604.converttools.coordinates.model.CoordinatePoint;
import io.github.mertc0604.converttools.coordinates.model.GridCell;
import io.github.mertc0604.converttools.coordinates.model.GridCoordinate;
import io.github.mertc0604.converttools.coordinates.projection.UtmUps;

import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class Mgrs {
    private static final int TILE = 100000;
    private static final String LATITUDE_BANDS =
            "CDEFGHJKLMNPQRSTUVWX";
    private static final String[] UTM_COLUMNS = {
            "ABCDEFGH",
            "JKLMNPQR",
            "STUVWXYZ"
    };
    private static final String UTM_ROWS = "ABCDEFGHJKLMNPQRSTUV";
    private static final String UPS_BANDS = "ABYZ";
    private static final String[] UPS_COLUMNS = {
            "JKLPQRSTUXYZ",
            "ABCFGHJKLPQR",
            "RSTUXYZ",
            "ABCFGHJ"
    };
    private static final String[] UPS_ROWS = {
            "ABCDEFGHJKLMNPQRSTUVWXYZ",
            "ABCDEFGHJKLMNP"
    };
    private static final Pattern UTM_PREFIX = Pattern.compile(
            "^(\\d{1,2})([C-HJ-NP-X])([A-HJ-NP-Z])([A-HJ-NP-V])"
    );
    private static final Pattern UPS_PREFIX = Pattern.compile(
            "^([ABYZ])([A-HJ-NP-Z])([A-HJ-NP-Z])"
    );
    private static final Pattern DIGITS = Pattern.compile("^\\d*$");
    private static final Pattern UTM_FORMAT = Pattern.compile(
            "^(\\d{1,2})([C-HJ-NP-X])([A-HJ-NP-Z]{2})(\\d*)$"
    );
    private static final Pattern UPS_FORMAT = Pattern.compile(
            "^([ABYZ])([A-HJ-NP-Z]{2})(\\d*)$"
    );

    private Mgrs() {
    }

    public static String encode(CoordinatePoint point) {
        return encode(point.latitude(), point.longitude(), 5);
    }

    public static String encode(CoordinatePoint point, int precision) {
        return encode(point.latitude(), point.longitude(), precision);
    }

    public static String encode(
            double latitude,
            double longitude,
            int precision
    ) {
        validatePrecision(precision);
        GridCoordinate grid = UtmUps.forward(latitude, longitude);
        return grid.zone() == 0
                ? encodeUps(grid, precision)
                : encodeUtm(grid, latitude, precision);
    }

    public static GridCell decode(String value) {
        return decode(value, true);
    }

    public static GridCell decode(String value, boolean center) {
        String source = normalize(value);
        return !source.isEmpty() && Character.isDigit(source.charAt(0))
                ? decodeUtm(source, center)
                : decodeUps(source, center);
    }

    public static String format(String value) {
        String source = normalize(value);
        Matcher utm = UTM_FORMAT.matcher(source);
        if (utm.matches()) {
            return spaced(
                    utm.group(1) + " " + utm.group(2) + " " + utm.group(3),
                    utm.group(4)
            );
        }
        Matcher ups = UPS_FORMAT.matcher(source);
        if (ups.matches()) {
            return spaced(
                    ups.group(1) + " " + ups.group(2),
                    ups.group(3)
            );
        }
        return source;
    }

    private static String encodeUtm(
            GridCoordinate grid,
            double latitude,
            int precision
    ) {
        char band = latitudeBand(latitude);
        String columnSet = UTM_COLUMNS[(grid.zone() - 1) % 3];
        int columnIndex = (int) Math.floor(grid.easting() / TILE) - 1;
        int rowIndex = ((int) Math.floor(grid.northing() / TILE)
                + (grid.zone() % 2 == 0 ? 5 : 0)) % 20;
        if (columnIndex < 0 || columnIndex >= columnSet.length()) {
            throw new IllegalArgumentException(
                    "UTM easting is outside the MGRS grid."
            );
        }
        return Integer.toString(grid.zone())
                + band
                + columnSet.charAt(columnIndex)
                + UTM_ROWS.charAt(rowIndex)
                + precisionDigits(grid.easting(), precision)
                + precisionDigits(grid.northing(), precision);
    }

    private static String encodeUps(
            GridCoordinate grid,
            int precision
    ) {
        int columnTile = (int) Math.floor(grid.easting() / TILE);
        int rowTile = (int) Math.floor(grid.northing() / TILE);
        boolean east = columnTile >= 20;
        int bandIndex = (grid.north() ? 2 : 0) + (east ? 1 : 0);
        int columnOffset = east ? 20 : grid.north() ? 13 : 8;
        int rowOffset = grid.north() ? 13 : 8;
        int columnIndex = columnTile - columnOffset;
        int rowIndex = rowTile - rowOffset;
        if (columnIndex < 0
                || columnIndex >= UPS_COLUMNS[bandIndex].length()
                || rowIndex < 0
                || rowIndex >= UPS_ROWS[grid.north() ? 1 : 0].length()) {
            throw new IllegalArgumentException(
                    "UPS coordinate is outside the MGRS lettering grid."
            );
        }
        return Character.toString(UPS_BANDS.charAt(bandIndex))
                + UPS_COLUMNS[bandIndex].charAt(columnIndex)
                + UPS_ROWS[grid.north() ? 1 : 0].charAt(rowIndex)
                + precisionDigits(grid.easting(), precision)
                + precisionDigits(grid.northing(), precision);
    }

    private static GridCell decodeUtm(String source, boolean center) {
        Matcher matcher = UTM_PREFIX.matcher(source);
        if (!matcher.find()) {
            throw new IllegalArgumentException(
                    "Invalid UTM MGRS coordinate."
            );
        }
        int zone = Integer.parseInt(matcher.group(1));
        char band = matcher.group(2).charAt(0);
        char column = matcher.group(3).charAt(0);
        char row = matcher.group(4).charAt(0);
        if (zone < 1 || zone > 60) {
            throw new IllegalArgumentException("Invalid MGRS zone.");
        }
        String columnSet = UTM_COLUMNS[(zone - 1) % 3];
        int columnIndex = columnSet.indexOf(column);
        if (columnIndex < 0) {
            throw new IllegalArgumentException(
                    "Invalid MGRS 100 km column."
            );
        }
        int rowIndex = UTM_ROWS.indexOf(row);
        if (rowIndex < 0) {
            throw new IllegalArgumentException(
                    "Invalid MGRS 100 km row."
            );
        }
        if (zone % 2 == 0) {
            rowIndex = (rowIndex + 15) % 20;
        }

        Trailing trailing = parseTrailingDigits(source, matcher.end());
        double easting = (columnIndex + 1) * (double) TILE
                + trailing.easting();
        double northing = rowIndex * (double) TILE
                + trailing.northing();
        double minimumNorthing = bandMinimumNorthing(band);
        while (northing < minimumNorthing) {
            northing += 2000000;
        }
        if (center) {
            easting += trailing.unit() / 2;
            northing += trailing.unit() / 2;
        }

        boolean north = LATITUDE_BANDS.indexOf(band)
                >= LATITUDE_BANDS.indexOf('N');
        CoordinatePoint point = UtmUps.inverse(
                zone,
                north,
                easting,
                northing
        );
        int bandIndex = LATITUDE_BANDS.indexOf(band);
        double minimumLatitude = -80 + bandIndex * 8;
        double maximumLatitude = band == 'X'
                ? 84
                : minimumLatitude + 8;
        if (point.latitude() < minimumLatitude - 1
                || point.latitude() > maximumLatitude + 1) {
            throw new IllegalArgumentException(
                    "MGRS square is inconsistent with its latitude band."
            );
        }
        return new GridCell(
                point,
                zone,
                north,
                easting,
                northing,
                trailing.precision(),
                trailing.unit(),
                center
        );
    }

    private static GridCell decodeUps(String source, boolean center) {
        Matcher matcher = UPS_PREFIX.matcher(source);
        if (!matcher.find()) {
            throw new IllegalArgumentException(
                    "Invalid UPS MGRS coordinate."
            );
        }
        char band = matcher.group(1).charAt(0);
        char column = matcher.group(2).charAt(0);
        char row = matcher.group(3).charAt(0);
        int bandIndex = UPS_BANDS.indexOf(band);
        boolean north = bandIndex >= 2;
        boolean east = bandIndex % 2 == 1;
        int columnIndex = UPS_COLUMNS[bandIndex].indexOf(column);
        int rowIndex = UPS_ROWS[north ? 1 : 0].indexOf(row);
        if (columnIndex < 0 || rowIndex < 0) {
            throw new IllegalArgumentException(
                    "Invalid UPS MGRS 100 km square."
            );
        }

        Trailing trailing = parseTrailingDigits(source, matcher.end());
        int columnOffset = east ? 20 : north ? 13 : 8;
        int rowOffset = north ? 13 : 8;
        double easting = (columnOffset + columnIndex) * (double) TILE
                + trailing.easting();
        double northing = (rowOffset + rowIndex) * (double) TILE
                + trailing.northing();
        if (center) {
            easting += trailing.unit() / 2;
            northing += trailing.unit() / 2;
        }
        CoordinatePoint point = UtmUps.inverse(
                0,
                north,
                easting,
                northing
        );
        return new GridCell(
                point,
                0,
                north,
                easting,
                northing,
                trailing.precision(),
                trailing.unit(),
                center
        );
    }

    private static Trailing parseTrailingDigits(
            String source,
            int prefixLength
    ) {
        String digits = source.substring(prefixLength);
        if (!DIGITS.matcher(digits).matches()
                || digits.length() % 2 != 0
                || digits.length() > 10) {
            throw new IllegalArgumentException(
                    "MGRS must end with an even number of digits."
            );
        }
        int precision = digits.length() / 2;
        double unit = Math.pow(10, 5 - precision);
        double easting = precision == 0
                ? 0
                : Integer.parseInt(digits.substring(0, precision)) * unit;
        double northing = precision == 0
                ? 0
                : Integer.parseInt(digits.substring(precision)) * unit;
        return new Trailing(
                precision,
                unit,
                easting,
                northing
        );
    }

    private static char latitudeBand(double latitude) {
        if (latitude < -80 || latitude > 84) {
            throw new IllegalArgumentException(
                    "UTM MGRS latitude must be between 80°S and 84°N."
            );
        }
        if (latitude == 84) {
            return 'X';
        }
        int index = Math.max(
                0,
                Math.min(19, (int) Math.floor((latitude + 80) / 8))
        );
        return LATITUDE_BANDS.charAt(index);
    }

    private static String precisionDigits(double value, int precision) {
        if (precision == 0) {
            return "";
        }
        double unit = Math.pow(10, 5 - precision);
        double tile = Math.floor(value / TILE);
        double remainder = Math.max(
                0,
                Math.min(
                        Math.nextDown((double) TILE),
                        value - tile * TILE
                )
        );
        int maximum = (int) Math.pow(10, precision) - 1;
        int digits = Math.min(
                maximum,
                (int) Math.floor(remainder / unit)
        );
        return String.format(
                Locale.ROOT,
                "%0" + precision + "d",
                digits
        );
    }

    private static String spaced(String prefix, String numeric) {
        if (numeric.isEmpty()) {
            return prefix;
        }
        int split = numeric.length() / 2;
        return prefix
                + " "
                + numeric.substring(0, split)
                + " "
                + numeric.substring(split);
    }

    private static String normalize(String value) {
        return value.toUpperCase(Locale.ROOT).replaceAll("\\s+", "");
    }

    private static void validatePrecision(int precision) {
        if (precision < 0 || precision > 5) {
            throw new IllegalArgumentException(
                    "MGRS precision must be between 0 and 5."
            );
        }
    }

    private static double bandMinimumNorthing(char band) {
        return switch (band) {
            case 'C' -> 1100000;
            case 'D' -> 2000000;
            case 'E' -> 2800000;
            case 'F' -> 3700000;
            case 'G' -> 4600000;
            case 'H' -> 5500000;
            case 'J' -> 6400000;
            case 'K' -> 7300000;
            case 'L' -> 8200000;
            case 'M' -> 9100000;
            case 'N' -> 0;
            case 'P' -> 800000;
            case 'Q' -> 1700000;
            case 'R' -> 2600000;
            case 'S' -> 3500000;
            case 'T' -> 4400000;
            case 'U' -> 5300000;
            case 'V' -> 6200000;
            case 'W' -> 7000000;
            case 'X' -> 7900000;
            default -> throw new IllegalArgumentException(
                    "Invalid MGRS latitude band."
            );
        };
    }

    private record Trailing(
            int precision,
            double unit,
            double easting,
            double northing
    ) {
    }
}
