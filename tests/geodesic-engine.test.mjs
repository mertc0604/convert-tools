import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  directGeodesic,
  inverseGeodesic,
  measureGeodesicPolyline,
} from "@convert-tools/core/geodesy";

const VECTOR_URL = new URL(
  "../contracts/test-vectors/geodesic-wgs84.csv",
  import.meta.url,
);

function angularDifference(actual, expected) {
  const difference = Math.abs(actual - expected) % 360;
  return Math.min(difference, 360 - difference);
}

async function referenceVectors() {
  const source = await readFile(VECTOR_URL, "utf8");
  return source
    .trim()
    .split("\n")
    .slice(1)
    .map((line) => {
      const [
        id,
        startLatitude,
        startLongitude,
        endLatitude,
        endLongitude,
        distanceMetres,
        initialBearingDegrees,
        finalBearingDegrees,
        toleranceMetres,
      ] = line.split(",");
      return {
        id,
        start: {
          latitude: Number(startLatitude),
          longitude: Number(startLongitude),
        },
        end: {
          latitude: Number(endLatitude),
          longitude: Number(endLongitude),
        },
        distanceMetres: Number(distanceMetres),
        initialBearingDegrees:
          initialBearingDegrees === ""
            ? null
            : Number(initialBearingDegrees),
        finalBearingDegrees:
          finalBearingDegrees === "" ? null : Number(finalBearingDegrees),
        toleranceMetres: Number(toleranceMetres),
      };
    });
}

test("WGS84 inverse geodesic matches independent reference vectors", async () => {
  for (const vector of await referenceVectors()) {
    const result = inverseGeodesic(vector.start, vector.end);
    assert.ok(
      Math.abs(result.distanceMetres - vector.distanceMetres) <=
        vector.toleranceMetres,
      `${vector.id}: ${result.distanceMetres} != ${vector.distanceMetres}`,
    );

    if (vector.initialBearingDegrees !== null) {
      assert.ok(
        angularDifference(
          result.initialBearingDegrees,
          vector.initialBearingDegrees,
        ) <= 1e-6,
        `${vector.id}: initial bearing`,
      );
      assert.ok(
        angularDifference(
          result.finalBearingDegrees,
          vector.finalBearingDegrees,
        ) <= 1e-6,
        `${vector.id}: final bearing`,
      );
    }
  }
});

test("near-antipodal pairs use the convergent ellipsoidal fallback", () => {
  const result = inverseGeodesic(
    { latitude: 0, longitude: 0 },
    { latitude: 0.5, longitude: 179.7 },
  );
  assert.equal(result.solver, "vincenty-direct-shooting");
  assert.ok(Math.abs(result.distanceMetres - 19944127.420750458) < 0.001);
});

test("inverse and direct geodesic calculations round-trip", async () => {
  for (const vector of (await referenceVectors()).filter(
    (item) => item.initialBearingDegrees !== null,
  )) {
    const inverse = inverseGeodesic(vector.start, vector.end);
    const destination = directGeodesic(
      vector.start,
      inverse.initialBearingDegrees,
      inverse.distanceMetres,
    );
    assert.ok(
      Math.abs(destination.latitude - vector.end.latitude) < 1e-9,
      `${vector.id}: latitude`,
    );
    assert.ok(
      angularDifference(destination.longitude, vector.end.longitude) < 1e-9,
      `${vector.id}: longitude`,
    );
  }
});

test("geodesic distance is symmetric and direct reconstruction stays within 1 mm", () => {
  let seed = 0x5a17c9e3;
  const random = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };

  for (let index = 0; index < 250; index += 1) {
    const start = {
      latitude: -89 + random() * 178,
      longitude: -180 + random() * 360,
    };
    const end = {
      latitude: -89 + random() * 178,
      longitude: -180 + random() * 360,
    };
    const forward = inverseGeodesic(start, end);
    const reverse = inverseGeodesic(end, start);
    assert.ok(
      Math.abs(forward.distanceMetres - reverse.distanceMetres) <= 0.001,
      `distance symmetry ${index}`,
    );

    const destination = directGeodesic(
      start,
      forward.initialBearingDegrees,
      forward.distanceMetres,
    );
    const reconstructionError = inverseGeodesic(destination, end);
    assert.ok(
      reconstructionError.distanceMetres <= 0.001,
      `direct reconstruction ${index}: ${reconstructionError.distanceMetres} m`,
    );
  }
});

test("coincident points have zero distance and no azimuth", () => {
  const point = { latitude: 39.933365, longitude: 32.859742 };
  const result = inverseGeodesic(point, point);
  assert.equal(result.distanceMetres, 0);
  assert.equal(result.azimuthDefined, false);
  assert.equal(result.initialBearingDegrees, null);
});

test("polyline length uses ellipsoidal segments and compensated summation", () => {
  const points = [
    { latitude: 0, longitude: 0 },
    { latitude: 0, longitude: 1 },
    { latitude: 1, longitude: 1 },
  ];
  const result = measureGeodesicPolyline(points);
  assert.equal(result.segmentCount, 2);
  assert.ok(
    Math.abs(result.distanceMetres - 221893.87935107236) < 0.001,
  );
  assert.equal(result.segments.length, 2);
});

test("invalid geodesic input fails closed", () => {
  assert.throws(
    () =>
      inverseGeodesic(
        { latitude: 91, longitude: 0 },
        { latitude: 0, longitude: 0 },
      ),
    /latitude/i,
  );
  assert.throws(
    () => measureGeodesicPolyline("not-an-array"),
    /array/i,
  );
});
