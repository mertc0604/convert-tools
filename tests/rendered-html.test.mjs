import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("Birim ve koordinat çevirici arayüzünü sunucu tarafında oluşturur", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(
    html,
    /<title>Convert — Birim ve Koordinat Çevirici<\/title>/i,
  );
  assert.match(html, />CONVERT</);
  assert.match(html, /Birim Çevirici/);
  assert.match(html, /aria-label="English"/);
  assert.match(html, /Örnekler/);
  assert.match(html, /Koordinatlar/);
  assert.doesNotMatch(html, /SAHA CONVERT|react-loading-skeleton/i);
});
