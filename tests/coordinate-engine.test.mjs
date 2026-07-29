import assert from "node:assert/strict";
import test from "node:test";
import {
  coordinateResults,
  decodeGeoref,
  encodeGeoref,
  fromDecimalDegrees,
  fromDms,
  fromGars,
  fromMgrs,
  fromUtmUps,
  transformCrs,
  utmUpsForward,
} from "../lib/coordinate-core.js";

const closeTo = (actual, expected, tolerance, message) => {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${message}: ${actual} ≉ ${expected}`,
  );
};

test("Ramadi test noktası 1 metre hassasiyetli MGRS üretir", () => {
  const result = coordinateResults(fromDecimalDegrees(33.44, 43.27), 5);
  assert.equal(result.mgrs.replace(/\s/g, ""), "38SLC3918701405");
});

test("Ankara UTM dönüşümü metre-altı toleransla geri döner", () => {
  const point = fromDecimalDegrees(39.933365, 32.859742);
  const result = coordinateResults(point, 5);
  assert.match(result.utmUps, /^36N\b/);

  const grid = utmUpsForward(point.latitude, point.longitude);
  closeTo(grid.easting, 488015.98778223846, 0.001, "easting");
  closeTo(grid.northing, 4420370.843637543, 0.001, "northing");
  const roundTrip = fromUtmUps(
    grid.zone,
    "N",
    grid.easting,
    grid.northing,
  );
  closeTo(roundTrip.latitude, point.latitude, 1e-8, "latitude");
  closeTo(roundTrip.longitude, point.longitude, 1e-8, "longitude");
});

test("MGRS çözümleme hücrenin merkez noktasını kullanır", () => {
  const point = fromMgrs("36SVK8801520370");
  assert.equal(point.sourceKind, "cell");
  assert.equal(point.sourceCellMetres, 1);
  closeTo(point.latitude, 39.9333619, 0.00002, "latitude");
  closeTo(point.longitude, 32.8597363, 0.00002, "longitude");
});

test("Kutup noktaları UPS ve polar MGRS ile desteklenir", () => {
  const result = coordinateResults(fromDecimalDegrees(85, 0), 5);
  assert.match(result.utmUps, /^UPS N\b/);
  assert.match(result.mgrs.replace(/\s/g, ""), /^[YZ]/);
});

test("DMS girdi çözümlemesi ve biçimlemesi yön harflerini korur", () => {
  const point = fromDms(`39°56'00.114"N`, `032°51'35.0712"E`);
  closeTo(point.latitude, 39.933365, 1e-12, "latitude");
  closeTo(point.longitude, 32.859742, 1e-12, "longitude");
  const result = coordinateResults(point, 5);
  assert.match(result.dms, /N/);
  assert.match(result.dms, /E/);
});

test("GARS referans örneği üretilir ve hücre merkezine çözülür", () => {
  const result = coordinateResults(fromDecimalDegrees(10.775276, 106.706797), 5);
  assert.equal(result.gars, "574JK19");

  const point = fromGars("574JK19");
  assert.equal(point.sourceKind, "area");
  assert.equal(point.sourceCellDegrees, 1 / 12);
  closeTo(point.latitude, 10.791666666666666, 1e-12, "latitude");
  closeTo(point.longitude, 106.70833333336667, 1e-9, "longitude");
});

test("GEOREF bilinen örneği kodlanır ve aynı hücreye çözülür", () => {
  const georef = encodeGeoref(106.706797, 10.775276, 4);
  assert.equal(georef, "VGBL42404651");
  const point = decodeGeoref(georef);
  assert.equal(encodeGeoref(point.longitude, point.latitude, 4), georef);
});

test("Web Mercator dönüşümü ve ters dönüşümü tutarlıdır", () => {
  const projected = transformCrs(
    "EPSG:4326",
    "EPSG:3857",
    32.859742,
    39.933365,
  );
  closeTo(projected.x, 3657929.7470383444, 1e-6, "x");
  closeTo(projected.y, 4856263.78244475, 1e-6, "y");

  const restored = transformCrs(
    "EPSG:3857",
    "EPSG:4326",
    projected.x,
    projected.y,
  );
  closeTo(restored.x, 32.859742, 1e-10, "longitude");
  closeTo(restored.y, 39.933365, 1e-10, "latitude");
});

test("Norveç ve Svalbard özel UTM zonları uygulanır", () => {
  assert.equal(utmUpsForward(60, 6).zone, 32);
  assert.equal(utmUpsForward(72, 21).zone, 35);
});

test("UPS güney dönüşümü kutup bölgesinde geri çevrilebilir", () => {
  const grid = utmUpsForward(-85, 30);
  assert.equal(grid.zone, 0);
  assert.equal(grid.north, false);
  const point = fromUtmUps(
    0,
    "S",
    grid.easting,
    grid.northing,
  );
  closeTo(point.latitude, -85, 1e-10, "latitude");
  closeTo(point.longitude, 30, 1e-10, "longitude");
});

test("Tanımsız EPSG kodu açıkça reddedilir", () => {
  assert.throws(
    () => transformCrs("EPSG:4326", "EPSG:999999", 0, 0),
    /not available/i,
  );
});
