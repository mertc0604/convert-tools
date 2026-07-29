import assert from "node:assert/strict";
import test from "node:test";

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

async function capabilities() {
  const app = await worker();
  return app.fetch(
    new Request("http://localhost/api/convert"),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("API yetenek sözleşmesi geodezik işlemleri bildirir", async () => {
  const response = await capabilities();
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.version, "1.1.0");
  assert.ok(body.types.includes("geodesic"));
  assert.deepEqual(
    body.geodesic.operations,
    ["inverse", "direct", "polyline"],
  );
  assert.equal(body.geodesic.maximumApiPolylinePoints, 1000);
});

test("API deniz milini metreye dönüştürür", async () => {
  const response = await request({
    type: "unit",
    category: "length",
    value: "1",
    from: "nautical-mile",
    to: "metre",
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.result.value, "1852");
  assert.equal(body.result.exactDecimal, true);
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
