import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  convertUnits,
  formatRational,
  parseDecimal,
} from "@convert-tools/core/units";

test("uluslararası deniz mili tam olarak 1852 metredir", () => {
  const result = convertUnits("1", "length", "nautical-mile", "metre");
  assert.equal(result.value, "1852");
  assert.equal(result.exactDecimal, true);
});

test("uluslararası ayak tam olarak 0.3048 metredir", () => {
  const result = convertUnits("1", "length", "foot", "metre");
  assert.equal(result.value, "0.3048");
  assert.equal(result.exactDecimal, true);
});

test("knot dönüşümü kesin kesir üzerinden ve kontrollü yuvarlanır", () => {
  const result = convertUnits("1", "speed", "knot", "metre-second");
  assert.equal(result.value, "0.514444444444444444444444");
  assert.equal(result.exactDecimal, false);
});

test("NATO mil ile 6000'lik mil birbirinden ayrıdır", () => {
  assert.equal(
    convertUnits("1600", "angle", "nato-mil", "degree").value,
    "90",
  );
  assert.equal(
    convertUnits("1500", "angle", "wp-mil", "degree").value,
    "90",
  );
});

test("sıcaklık ofsetleri kesin rasyonel hesaplanır", () => {
  assert.equal(
    convertUnits("32", "temperature", "fahrenheit", "celsius").value,
    "0",
  );
  assert.equal(
    convertUnits("-40", "temperature", "celsius", "fahrenheit").value,
    "-40",
  );
  assert.equal(
    convertUnits("0", "temperature", "celsius", "kelvin").value,
    "273.15",
  );
});

test("uzun ondalık girdiler Number hassasiyetine düşmeden korunur", () => {
  const source = "12345678901234567890.123456789012345678";
  const parsed = parseDecimal(source);
  assert.equal(formatRational(parsed, 18), source);
  const roundTrip = convertUnits(source, "length", "metre", "millimetre", 18);
  assert.equal(roundTrip.value, "12345678901234567890123.456789012345678");
});

test("sonlu ama seçilen haneye sığmayan sonuç exact olarak işaretlenmez", () => {
  const result = convertUnits(
    "0.1234567890123456789012345",
    "length",
    "metre",
    "metre",
    24,
  );
  assert.equal(result.terminatingDecimal, true);
  assert.equal(result.requiredFractionDigits, 25);
  assert.equal(result.exactDecimal, false);
  assert.equal(result.value, "0.123456789012345678901235");
});

test("Türkçe ondalık virgülü ve bilimsel gösterim desteklenir", () => {
  assert.equal(formatRational(parseDecimal("1,25"), 8), "1.25");
  assert.equal(formatRational(parseDecimal("3e-4"), 8), "0.0003");
});

test("JavaScript ortak birim sözleşmesi vektörlerini karşılar", async () => {
  const source = await readFile(
    new URL(
      "../contracts/test-vectors/unit-conversions.csv",
      import.meta.url,
    ),
    "utf8",
  );

  for (const line of source.trim().split("\n").slice(1)) {
    const [id, category, value, from, to, precision, expected] =
      line.split(",");
    assert.equal(
      convertUnits(value, category, from, to, Number(precision)).value,
      expected,
      id,
    );
  }
});
