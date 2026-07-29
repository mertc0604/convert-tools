import assert from "node:assert/strict";
import test from "node:test";
import { convertLength } from "@convert-tools/core/length";

async function worker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("api-test", `${process.pid}-${Date.now()}`);
  return (await import(workerUrl.href)).default;
}

async function request(payload) {
  const app = await worker();
  return app.fetch(
    new Request("http://localhost/api/convert", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

async function rawRequest(body) {
  const app = await worker();
  return app.fetch(
    new Request("http://localhost/api/convert", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

async function capabilities() {
  const app = await worker();
  return app.fetch(
    new Request("http://localhost/api/convert"),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("API yalnız uzunluk birimleri ve geodezik işlemleri bildirir", async () => {
  const response = await capabilities();
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.version, "2.0.0");
  assert.deepEqual(body.types, ["length", "coordinate", "crs", "geodesic"]);
  assert.deepEqual(
    body.unitCategories.map((category) => category.id),
    ["length"],
  );
  assert.ok(body.types.includes("geodesic"));
  assert.deepEqual(
    body.geodesic.operations,
    ["inverse", "direct", "polyline", "path"],
  );
  assert.equal(body.geodesic.maximumApiPolylinePoints, 1000);
  assert.equal(body.geodesic.maximumApiPathPoints, 2049);
  assert.equal(body.limits.maximumRequestBodyBytes, 128 * 1024);
  assert.equal(body.limits.maximumExactInputDigits, 4096);
});

test("API deniz milini metreye dönüştürür", async () => {
  const response = await request({
    type: "length",
    value: "1",
    from: "nautical-mile",
    to: "metre",
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.result.value, "1852");
  assert.equal(body.result.exactDecimal, true);
  assert.deepEqual(body.result.exactValue, {
    numerator: "1852",
    denominator: "1",
  });
  assert.deepEqual(body.result.exactMetres, {
    numerator: "1852",
    denominator: "1",
  });
});

test("API kesin kesri kullanarak tekrar eden ondalığı kayıpsız geri çevirir", async () => {
  const forward = await request({
    type: "length",
    value: "1",
    from: "metre",
    to: "nautical-mile",
    precision: 24,
  });
  assert.equal(forward.status, 200);
  const first = await forward.json();
  assert.equal(first.result.exactDecimal, false);
  assert.equal(first.result.rounded, true);

  const reverse = await request({
    type: "length",
    exactValue: first.result.exactValue,
    from: "nautical-mile",
    to: "metre",
    precision: 24,
  });
  assert.equal(reverse.status, 200);
  const second = await reverse.json();
  assert.equal(second.result.value, "1");
  assert.deepEqual(second.result.exactValue, {
    numerator: "1",
    denominator: "1",
  });
});

test("API belirsiz JSON sayısını ve uzunluk dışı kategoriyi reddeder", async () => {
  const numeric = await request({
    type: "length",
    value: 9007199254740993,
    from: "metre",
    to: "millimetre",
  });
  assert.equal(numeric.status, 400);
  assert.match((await numeric.json()).error, /decimal string/i);

  const category = await request({
    type: "unit",
    category: "speed",
    value: "1",
    from: "knot",
    to: "metre",
  });
  assert.equal(category.status, 400);
  assert.match((await category.json()).error, /only.*length/i);
});

test("API çelişkili kesin girdiyi ve büyük istek gövdesini reddeder", async () => {
  const conflicting = await request({
    type: "length",
    value: "999",
    exactValue: { numerator: "1", denominator: "1852" },
    from: "nautical-mile",
    to: "metre",
  });
  assert.equal(conflicting.status, 400);
  assert.match((await conflicting.json()).error, /exactly one/i);

  const oversized = await rawRequest(
    JSON.stringify({
      type: "length",
      value: "1",
      from: "metre",
      to: "metre",
      padding: "x".repeat(128 * 1024),
    }),
  );
  assert.equal(oversized.status, 400);
  assert.match((await oversized.json()).error, /must not exceed/i);
});

test("API MGRS girdisinden tüm koordinat formatlarını üretir", async () => {
  const response = await request({
    type: "coordinate",
    format: "mgrs",
    value: { coordinate: "38SLC3918701405" },
    mgrsPrecision: 5,
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.result.mgrs.replace(/\s/g, ""), "38SLC3918701405");
  assert.match(body.result.utmUps, /^38N/);
  assert.equal(body.result.sourceCellMetres, 1);
  assert.equal(body.inputFormat, "mgrs");
  assert.deepEqual(body.result.resolution.mgrs, {
    kind: "grid-cell",
    cellMetres: 1,
    decodedPoint: "cell-center",
    maximumCenterOffsetMetres: Math.SQRT1_2,
  });
  assert.equal(body.result.resolution.gars.cellDegrees, 1 / 12);
});

test("API EPSG dönüşümünü uygular", async () => {
  const response = await request({
    type: "crs",
    source: "EPSG:4326",
    target: "EPSG:3857",
    x: 32.859742,
    y: 39.933365,
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.ok(Math.abs(body.result.x - 3657929.7470383444) < 1e-6);
});

test("API WGS84 elipsoidal mesafeyi deniz mili olarak döndürür", async () => {
  const response = await request({
    type: "geodesic",
    operation: "inverse",
    start: { latitude: 39.933365, longitude: 32.859742 },
    end: { latitude: 41.008238, longitude: 28.978359 },
    outputUnit: "nautical-mile",
    precision: 12,
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.result.ellipsoid, "WGS84");
  assert.ok(
    Math.abs(body.result.distanceMetres - 350091.704424933) < 0.001,
  );
  assert.equal(body.result.distance.unit, "nautical-mile");
  assert.equal(body.result.distance.symbol, "NM");
  assert.deepEqual(
    body.result.distance.exactMetres,
    convertLength(
      String(body.result.distanceMetres),
      "metre",
      "metre",
    ).exactValue,
  );
  assert.equal(body.result.distance.precision, 12);
  assert.equal(body.result.distance.roundingMode, "HALF_UP");
});

test("API direct geodezik ile hedef noktayı geri üretir", async () => {
  const response = await request({
    type: "geodesic",
    operation: "direct",
    start: { latitude: 39.933365, longitude: 32.859742 },
    initialBearingDegrees: 291.1840610098678,
    distanceMetres: 350091.7044265541,
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.ok(Math.abs(body.result.latitude - 41.008238) < 1e-9);
  assert.ok(Math.abs(body.result.longitude - 28.978359) < 1e-9);
});

test("API geodesic polyline toplamını hesaplar", async () => {
  const response = await request({
    type: "geodesic",
    operation: "polyline",
    points: [
      { latitude: 0, longitude: 0 },
      { latitude: 0, longitude: 1 },
      { latitude: 1, longitude: 1 },
    ],
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.result.segmentCount, 2);
  assert.ok(Math.abs(body.result.distanceMetres - 221893.87935107236) < 0.001);
});

test("API hesaplanan geodezik hattı sınırlı çizim noktalarıyla döndürür", async () => {
  const response = await request({
    type: "geodesic",
    operation: "path",
    start: { latitude: 0, longitude: 0 },
    end: { latitude: 60, longitude: 1 },
    maxSegmentMetres: 500_000,
    maxPoints: 20,
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.result.points[0], { latitude: 0, longitude: 0 });
  assert.deepEqual(body.result.points.at(-1), {
    latitude: 60,
    longitude: 1,
  });
  assert.equal(body.result.points.length, body.result.segmentCount + 1);
  assert.ok(body.result.points.length <= 20);
  assert.equal(body.result.distance.distanceMetres, body.result.distanceMetres);
});

test("API geodezik hat çıktı sınırını uygular", async () => {
  const response = await request({
    type: "geodesic",
    operation: "path",
    start: { latitude: 0, longitude: 0 },
    end: { latitude: 1, longitude: 1 },
    maxPoints: 2050,
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /maxPoints/);
});

test("API aşırı büyük polyline isteğini reddeder", async () => {
  const response = await request({
    type: "geodesic",
    operation: "polyline",
    points: Array.from({ length: 1001 }, () => ({
      latitude: 0,
      longitude: 0,
    })),
  });
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.match(body.error, /at most 1000/i);
});

test("API hatalı istekleri 400 ile reddeder", async () => {
  const response = await request({ type: "unknown" });
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.match(body.error, /type must be/i);
});
