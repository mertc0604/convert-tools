package io.github.mertc0604.converttools;

import io.github.mertc0604.converttools.geodesy.DirectResult;
import io.github.mertc0604.converttools.geodesy.GeoPoint;
import io.github.mertc0604.converttools.geodesy.Geodesic;
import io.github.mertc0604.converttools.geodesy.GeodesicResult;
import io.github.mertc0604.converttools.geodesy.PolylineMeasurement;
import io.github.mertc0604.converttools.units.UnitConversion;
import io.github.mertc0604.converttools.units.UnitConverter;

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
        testGeodesics(vectors.resolve("geodesic-wgs84.csv"));
        testPolyline();
        System.out.println("Java contract tests passed.");
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
}
