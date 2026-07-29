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

test("API hatalı istekleri 400 ile reddeder", async () => {
  const response = await request({ type: "unknown" });
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.match(body.error, /type must be/i);
});
