const TEN = 10n;

function abs(value) {
  return value < 0n ? -value : value;
}

function gcd(a, b) {
  let x = abs(a);
  let y = abs(b);
  while (y !== 0n) {
    const remainder = x % y;
    x = y;
    y = remainder;
  }
  return x;
}

function normalize(numerator, denominator = 1n) {
  if (denominator === 0n) {
    throw new Error("Sıfıra bölme yapılamaz.");
  }

  let n = numerator;
  let d = denominator;
  if (d < 0n) {
    n = -n;
    d = -d;
  }

  if (n === 0n) {
    return { n: 0n, d: 1n };
  }

  const divisor = gcd(n, d);
  return { n: n / divisor, d: d / divisor };
}

function pow10(exponent) {
  if (!Number.isInteger(exponent) || exponent < 0 || exponent > 1000) {
    throw new Error("Ondalık üs 0 ile 1000 arasında olmalıdır.");
  }
  return TEN ** BigInt(exponent);
}

export function parseDecimal(input) {
  const source = String(input).trim().replace(/\s+/g, "");
  const match = source.match(
    /^([+-]?)(?:(\d+)(?:[.,](\d*))?|[.,](\d+))(?:[eE]([+-]?\d+))?$/,
  );

  if (!match) {
    throw new Error("Geçerli bir sayı girin. Örnek: 1852, 1.25 veya 3e-4.");
  }

  const sign = match[1] === "-" ? -1n : 1n;
  const integerPart = match[2] ?? "0";
  const fractionPart = match[3] ?? match[4] ?? "";
  const exponent = Number(match[5] ?? "0");

  if (!Number.isInteger(exponent) || Math.abs(exponent) > 1000) {
    throw new Error("Üs değeri -1000 ile 1000 arasında olmalıdır.");
  }

  const digits = `${integerPart}${fractionPart}`.replace(/^0+(?=\d)/, "");
  let numerator = sign * BigInt(digits || "0");
  let denominator = pow10(fractionPart.length);

  if (exponent > 0) {
    numerator *= pow10(exponent);
  } else if (exponent < 0) {
    denominator *= pow10(-exponent);
  }

  return normalize(numerator, denominator);
}

function rational(value) {
  if (typeof value === "string") {
    return parseDecimal(value);
  }
  if (Array.isArray(value)) {
    return normalize(BigInt(value[0]), BigInt(value[1]));
  }
  return normalize(BigInt(value), 1n);
}

function add(a, b) {
  return normalize(a.n * b.d + b.n * a.d, a.d * b.d);
}

function subtract(a, b) {
  return normalize(a.n * b.d - b.n * a.d, a.d * b.d);
}

function multiply(a, b) {
  return normalize(a.n * b.n, a.d * b.d);
}

function divide(a, b) {
  return normalize(a.n * b.d, a.d * b.n);
}

function isTerminatingDecimal(value) {
  let denominator = value.d;
  while (denominator % 2n === 0n) denominator /= 2n;
  while (denominator % 5n === 0n) denominator /= 5n;
  return denominator === 1n;
}

export function formatRational(value, maximumFractionDigits = 24) {
  const digits = Math.max(0, Math.min(60, maximumFractionDigits));
  const negative = value.n < 0n;
  const numerator = abs(value.n);
  const scale = pow10(digits);
  const rounded = (numerator * scale * 2n + value.d) / (value.d * 2n);
  let raw = rounded.toString().padStart(digits + 1, "0");

  if (digits > 0) {
    const split = raw.length - digits;
    raw = `${raw.slice(0, split)}.${raw.slice(split)}`;
    raw = raw.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  }

  if (negative && raw !== "0") raw = `-${raw}`;
  return raw;
}

const linearUnit = (id, label, symbol, factor, detail) => ({
  id,
  label,
  symbol,
  scale: rational(factor),
  offset: rational("0"),
  detail,
});

const affineUnit = (id, label, symbol, scale, offset, detail) => ({
  id,
  label,
  symbol,
  scale: rational(scale),
  offset: rational(offset),
  detail,
});

export const UNIT_CATEGORIES = [
  {
    id: "length",
    label: "Uzunluk",
    defaultFrom: "nautical-mile",
    defaultTo: "metre",
    units: [
      linearUnit("millimetre", "Milimetre", "mm", "0.001"),
      linearUnit("centimetre", "Santimetre", "cm", "0.01"),
      linearUnit("metre", "Metre", "m", "1", "SI temel uzunluk birimi"),
      linearUnit("kilometre", "Kilometre", "km", "1000"),
      linearUnit("inch", "İnç", "in", "0.0254", "Uluslararası inç, tam"),
      linearUnit("foot", "Ayak", "ft", "0.3048", "Uluslararası ayak, tam"),
      linearUnit("yard", "Yarda", "yd", "0.9144", "Uluslararası yarda, tam"),
      linearUnit("mile", "Mil", "mi", "1609.344", "Kara mili, tam"),
      linearUnit(
        "nautical-mile",
        "Deniz mili",
        "NM",
        "1852",
        "Uluslararası deniz mili, tam",
      ),
    ],
  },
  {
    id: "speed",
    label: "Hız",
    defaultFrom: "knot",
    defaultTo: "metre-second",
    units: [
      linearUnit("metre-second", "Metre/saniye", "m/s", "1"),
      linearUnit("kilometre-hour", "Kilometre/saat", "km/h", [5, 18]),
      linearUnit(
        "knot",
        "Knot",
        "kt",
        [463, 900],
        "1 NM/saat; SI karşılığı tam rasyoneldir",
      ),
      linearUnit("mile-hour", "Mil/saat", "mph", "0.44704"),
      linearUnit("foot-second", "Ayak/saniye", "ft/s", "0.3048"),
    ],
  },
  {
    id: "area",
    label: "Alan",
    defaultFrom: "square-nautical-mile",
    defaultTo: "square-kilometre",
    units: [
      linearUnit("square-metre", "Metrekare", "m²", "1"),
      linearUnit("hectare", "Hektar", "ha", "10000"),
      linearUnit("square-kilometre", "Kilometrekare", "km²", "1000000"),
      linearUnit("square-foot", "Ayak kare", "ft²", "0.09290304"),
      linearUnit("acre", "Akre", "ac", "4046.8564224"),
      linearUnit(
        "square-nautical-mile",
        "Deniz mili kare",
        "NM²",
        "3429904",
      ),
    ],
  },
  {
    id: "angle",
    label: "Açı",
    defaultFrom: "degree",
    defaultTo: "nato-mil",
    units: [
      linearUnit("degree", "Derece", "°", "1"),
      linearUnit("gon", "Gon / grad", "gon", "0.9"),
      linearUnit(
        "nato-mil",
        "NATO mil",
        "mil",
        "0.05625",
        "6400 mil = 360°",
      ),
      linearUnit(
        "wp-mil",
        "6000'lik mil",
        "mil (6000)",
        "0.06",
        "6000 mil = 360°; NATO mil ile karıştırmayın",
      ),
      linearUnit("minute-angle", "Açı dakikası", "MOA", [1, 60]),
      linearUnit("arc-second", "Açı saniyesi", "arcsec", [1, 3600]),
    ],
  },
  {
    id: "mass",
    label: "Kütle",
    defaultFrom: "kilogram",
    defaultTo: "pound",
    units: [
      linearUnit("milligram", "Miligram", "mg", "0.000001"),
      linearUnit("gram", "Gram", "g", "0.001"),
      linearUnit("kilogram", "Kilogram", "kg", "1"),
      linearUnit("tonne", "Metrik ton", "t", "1000"),
      linearUnit("ounce", "Ons", "oz", "0.028349523125"),
      linearUnit(
        "pound",
        "Pound",
        "lb",
        "0.45359237",
        "Uluslararası avoirdupois pound, tam",
      ),
    ],
  },
  {
    id: "pressure",
    label: "Basınç",
    defaultFrom: "bar",
    defaultTo: "kilopascal",
    units: [
      linearUnit("pascal", "Pascal", "Pa", "1"),
      linearUnit("kilopascal", "Kilopascal", "kPa", "1000"),
      linearUnit("hectopascal", "Hektopascal", "hPa", "100"),
      linearUnit("bar", "Bar", "bar", "100000"),
      linearUnit("atmosphere", "Standart atmosfer", "atm", "101325"),
      linearUnit(
        "psi",
        "Pound/inç kare",
        "psi",
        "6894.757293168361336722673",
      ),
    ],
  },
  {
    id: "temperature",
    label: "Sıcaklık",
    defaultFrom: "celsius",
    defaultTo: "fahrenheit",
    units: [
      affineUnit("celsius", "Celsius", "°C", "1", "0"),
      affineUnit("kelvin", "Kelvin", "K", "1", "-273.15"),
      affineUnit("fahrenheit", "Fahrenheit", "°F", [5, 9], [-160, 9]),
      affineUnit("rankine", "Rankine", "°R", [5, 9], "-273.15"),
    ],
  },
];

export function getCategory(categoryId) {
  return UNIT_CATEGORIES.find((category) => category.id === categoryId);
}

export function getUnit(category, unitId) {
  return category?.units.find((unit) => unit.id === unitId);
}

export function convertUnits(input, categoryId, fromId, toId, precision = 24) {
  const category = getCategory(categoryId);
  if (!category) throw new Error("Birim kategorisi bulunamadı.");

  const from = getUnit(category, fromId);
  const to = getUnit(category, toId);
  if (!from || !to) throw new Error("Kaynak veya hedef birim bulunamadı.");

  const source = parseDecimal(input);
  const base = add(multiply(source, from.scale), from.offset);
  const result = divide(subtract(base, to.offset), to.scale);
  const factor = divide(from.scale, to.scale);

  return {
    rational: result,
    value: formatRational(result, precision),
    exactDecimal: isTerminatingDecimal(result),
    factor: formatRational(factor, precision),
    from,
    to,
  };
}

export function convertToAll(input, categoryId, fromId, precision = 18) {
  const category = getCategory(categoryId);
  if (!category) return [];

  return category.units
    .filter((unit) => unit.id !== fromId)
    .map((unit) => ({
      ...unit,
      ...convertUnits(input, categoryId, fromId, unit.id, precision),
    }));
}
