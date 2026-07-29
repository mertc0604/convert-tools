package io.github.mertc0604.converttools;

import io.github.mertc0604.converttools.geodesy.DirectResult;
import io.github.mertc0604.converttools.geodesy.GeoPoint;
import io.github.mertc0604.converttools.geodesy.Geodesic;
import io.github.mertc0604.converttools.geodesy.GeodesicResult;
import io.github.mertc0604.converttools.geodesy.PolylineMeasurement;
import io.github.mertc0604.converttools.units.LengthConverter;
import io.github.mertc0604.converttools.units.Rational;
import io.github.mertc0604.converttools.units.UnitCatalog;
import io.github.mertc0604.converttools.units.UnitConversion;
import io.github.mertc0604.converttools.units.UnitConverter;
import io.github.mertc0604.converttools.units.UnitDefinition;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

public final class ContractTest {
    private ContractTest() {
    }

    public static void main(String[] args) throws IOException {
        if (args.length != 1) {
            throw new IllegalArgumentException(
                    "Pass the contracts/test-vectors directory."
            );
        }

        Path vectors = Path.of(args[0]);
        testUnits(vectors.resolve("unit-conversions.csv"));
        testAllLengthRoundTrips();
        testLengthContractLimits();
        testGeodesics(vectors.resolve("geodesic-wgs84.csv"));
        testPolyline();
        System.out.println("Java contract tests passed.");
    }

    private static void testAllLengthRoundTrips() {
        List<String> inputs = List.of(
                "0",
                "1",
                "-1",
                "0.1",
                "123.456789012345678901234",
                "9.87654321e-12",
                "98765432101234567890.123456789"
        );

        for (UnitDefinition from : UnitCatalog.length().units()) {
            for (UnitDefinition to : UnitCatalog.length().units()) {
                for (String input : inputs) {
                    Rational expected = Rational.parse(input);
                    UnitConversion forward = LengthConverter.convert(
                            input,
                            from.id(),
                            to.id(),
                            24
                    );
                    UnitConversion reverse = LengthConverter.convert(
                            forward.exactValue(),
                            to.id(),
                            from.id(),
                            24
                    );
                    require(
                            reverse.exactValue().equals(expected),
                            "Length round trip mismatch: "
                                    + input
                                    + " "
                                    + from.id()
                                    + " -> "
                                    + to.id()
                    );
                    require(
                            forward.exactMetres().equals(
                                    expected.multiply(from.metresPerUnit())
                            ),
                            "Canonical metre value mismatch."
                    );
                }
            }
        }

        UnitConversion metres = LengthConverter.convert(
                "1",
                "nautical-mile",
                "metre",
                24
        );
        UnitConversion nauticalMiles = LengthConverter.convert(
                metres.exactValue(),
                "metre",
                "nautical-mile",
                24
        );
        require(metres.value().equals("1852"), "1 NM must equal 1852 m.");
        require(
                nauticalMiles.value().equals("1"),
                "1 NM -> m -> NM must return exactly 1."
        );
    }

    private static void testLengthContractLimits() {
        require(
                UnitCatalog.categories().size() == 1
                        && UnitCatalog.categories().get(0).id()
                        .equals("length"),
                "Only the length category must be public."
        );
        requireThrows(
                () -> UnitCatalog.category("speed"),
                "Non-length categories must be rejected."
        );
        requireThrows(
                () -> Rational.parse("1e1001"),
                "Exponent greater than 1000 must be rejected."
        );
        requireThrows(
                () -> Rational.parse("9".repeat(4097)),
                "More than 4096 input digits must be rejected."
        );
        requireThrows(
                () -> Rational.parse("0".repeat(4096) + "1"),
                "Leading zeroes must count toward the input limit."
        );

        String maximumInteger = "9".repeat(4096);
        UnitConversion expanded = LengthConverter.convert(
                maximumInteger,
                "kilometre",
                "millimetre",
                24
        );
        require(
                expanded.exactValue().numerator().toString().length() == 4102,
                "A valid maximum-length input must survive result growth."
        );

        String fractional = "." + "0".repeat(4095) + "1";
        UnitConversion fractionalForward = LengthConverter.convert(
                fractional,
                "nautical-mile",
                "metre",
                24
        );
        UnitConversion fractionalBack = LengthConverter.convert(
                fractionalForward.exactValue(),
                "metre",
                "nautical-mile",
                24
        );
        require(
                fractionalBack.exactValue().equals(Rational.parse(fractional)),
                "4096 fractional digits must survive an exact round trip."
        );

        UnitConversion repeating = LengthConverter.convert(
                "1",
                "metre",
                "nautical-mile",
                24
        );
        require(!repeating.exactDecimal(), "m -> NM must repeat.");
        require(repeating.rounded(), "Repeating display must be marked rounded.");
    }

    private static void testUnits(Path file) throws IOException {
        List<String> lines = Files.readAllLines(file);
        for (String line : lines.subList(1, lines.size())) {
            String[] columns = line.split(",", -1);
            UnitConversion result = UnitConverter.convert(
                    columns[2],
                    columns[1],
                    columns[3],
                    columns[4],
                    Integer.parseInt(columns[5])
            );
            require(
                    result.value().equals(columns[6]),
                    columns[0] + ": " + result.value() + " != " + columns[6]
            );
            if (columns.length >= 13 && !columns[7].isEmpty()) {
                require(
                        result.exactValue().numerator().toString()
                                .equals(columns[7])
                                && result.exactValue().denominator().toString()
                                .equals(columns[8]),
                        columns[0] + ": exact value mismatch"
                );
                require(
                        result.exactMetres().numerator().toString()
                                .equals(columns[9])
                                && result.exactMetres().denominator().toString()
                                .equals(columns[10]),
                        columns[0] + ": exact metre value mismatch"
                );
                require(
                        result.exactFactor().numerator().toString()
                                .equals(columns[11])
                                && result.exactFactor().denominator().toString()
                                .equals(columns[12]),
                        columns[0] + ": exact factor mismatch"
                );
            }
        }
    }

    private static void testGeodesics(Path file) throws IOException {
        List<String> lines = Files.readAllLines(file);
        for (String line : lines.subList(1, lines.size())) {
            String[] columns = line.split(",", -1);
            GeoPoint start = new GeoPoint(
                    Double.parseDouble(columns[1]),
                    Double.parseDouble(columns[2])
            );
            GeoPoint end = new GeoPoint(
                    Double.parseDouble(columns[3]),
                    Double.parseDouble(columns[4])
            );
            double expectedDistance = Double.parseDouble(columns[5]);
            double tolerance = Double.parseDouble(columns[8]);
            GeodesicResult result = Geodesic.inverse(start, end);
            require(
                    Math.abs(result.distanceMetres() - expectedDistance)
                            <= tolerance,
                    columns[0] + ": distance mismatch"
            );

            if (!columns[6].isEmpty()) {
                require(
                        angularDifference(
                                result.initialBearingDegrees(),
                                Double.parseDouble(columns[6])
                        ) <= 1e-6,
                        columns[0] + ": initial bearing mismatch"
                );
                require(
                        angularDifference(
                                result.finalBearingDegrees(),
                                Double.parseDouble(columns[7])
                        ) <= 1e-6,
                        columns[0] + ": final bearing mismatch"
                );

                DirectResult destination = Geodesic.direct(
                        start,
                        result.initialBearingDegrees(),
                        result.distanceMetres()
                );
                require(
                        Math.abs(
                                destination.destination().latitude()
                                        - end.latitude()
                        ) <= 1e-9,
                        columns[0] + ": direct latitude mismatch"
                );
                require(
                        angularDifference(
                                destination.destination().longitude(),
                                end.longitude()
                        ) <= 1e-9,
                        columns[0] + ": direct longitude mismatch"
                );
            }
        }
    }

    private static void testPolyline() {
        PolylineMeasurement result = Geodesic.measurePolyline(List.of(
                new GeoPoint(0, 0),
                new GeoPoint(0, 1),
                new GeoPoint(1, 1)
        ));
        require(result.segmentCount() == 2, "Polyline segment count mismatch");
        require(
                Math.abs(result.distanceMetres() - 221893.87935107236)
                        <= 0.001,
                "Polyline distance mismatch"
        );
    }

    private static double angularDifference(double actual, double expected) {
        double difference = Math.abs(actual - expected) % 360;
        return Math.min(difference, 360 - difference);
    }

    private static void require(boolean condition, String message) {
        if (!condition) {
            throw new AssertionError(message);
        }
    }

    private static void requireThrows(Runnable operation, String message) {
        try {
            operation.run();
        } catch (IllegalArgumentException expected) {
            return;
        }
        throw new AssertionError(message);
    }
}
