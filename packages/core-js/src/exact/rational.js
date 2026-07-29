const TEN = 10n;
const MAX_DECIMAL_EXPONENT = 1000;
const MAX_OUTPUT_DIGITS = 60;

function absolute(value) {
  return value < 0n ? -value : value;
}

function greatestCommonDivisor(left, right) {
  let a = absolute(left);
  let b = absolute(right);

  while (b !== 0n) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }

  return a;
}

export function normalizeRational(numerator, denominator = 1n) {
  if (denominator === 0n) {
    throw new Error("Division by zero is not allowed.");
  }

  let normalizedNumerator = numerator;
  let normalizedDenominator = denominator;
  if (normalizedDenominator < 0n) {
    normalizedNumerator = -normalizedNumerator;
    normalizedDenominator = -normalizedDenominator;
  }

  if (normalizedNumerator === 0n) {
    return Object.freeze({ n: 0n, d: 1n });
  }

  const divisor = greatestCommonDivisor(
    normalizedNumerator,
    normalizedDenominator,
  );
  return Object.freeze({
    n: normalizedNumerator / divisor,
    d: normalizedDenominator / divisor,
  });
}

function powerOfTen(exponent) {
  if (
    !Number.isInteger(exponent) ||
    exponent < 0 ||
    exponent > MAX_DECIMAL_EXPONENT
  ) {
    throw new Error(
      `Decimal exponent must be between 0 and ${MAX_DECIMAL_EXPONENT}.`,
    );
  }

  return TEN ** BigInt(exponent);
}

export function parseDecimal(input) {
  const source = String(input).trim().replace(/\s+/g, "");
  const match = source.match(
    /^([+-]?)(?:(\d+)(?:[.,](\d*))?|[.,](\d+))(?:[eE]([+-]?\d+))?$/,
  );

  if (!match) {
    throw new Error("Enter a valid decimal number, for example 1852 or 3e-4.");
  }

  const sign = match[1] === "-" ? -1n : 1n;
  const integerPart = match[2] ?? "0";
  const fractionPart = match[3] ?? match[4] ?? "";
  const exponent = Number(match[5] ?? "0");

  if (
    !Number.isInteger(exponent) ||
    Math.abs(exponent) > MAX_DECIMAL_EXPONENT
  ) {
    throw new Error(
      `Exponent must be between -${MAX_DECIMAL_EXPONENT} and ${MAX_DECIMAL_EXPONENT}.`,
    );
  }

  const digits = `${integerPart}${fractionPart}`.replace(/^0+(?=\d)/, "");
  let numerator = sign * BigInt(digits || "0");
  let denominator = powerOfTen(fractionPart.length);

  if (exponent > 0) {
    numerator *= powerOfTen(exponent);
  } else if (exponent < 0) {
    denominator *= powerOfTen(-exponent);
  }

  return normalizeRational(numerator, denominator);
}

export function toRational(value) {
  if (typeof value === "string") {
    return parseDecimal(value);
  }
  if (Array.isArray(value) && value.length === 2) {
    return normalizeRational(BigInt(value[0]), BigInt(value[1]));
  }
  if (typeof value === "bigint" || Number.isSafeInteger(value)) {
    return normalizeRational(BigInt(value), 1n);
  }

  throw new Error("Rational values must be decimal strings or [n, d] pairs.");
}

export function addRational(left, right) {
  return normalizeRational(
    left.n * right.d + right.n * left.d,
    left.d * right.d,
  );
}

export function subtractRational(left, right) {
  return normalizeRational(
    left.n * right.d - right.n * left.d,
    left.d * right.d,
  );
}

export function multiplyRational(left, right) {
  return normalizeRational(left.n * right.n, left.d * right.d);
}

export function divideRational(left, right) {
  if (right.n === 0n) {
    throw new Error("Division by zero is not allowed.");
  }
  return normalizeRational(left.n * right.d, left.d * right.n);
}

export function exactFractionDigits(value) {
  let denominator = value.d;
  let twos = 0;
  let fives = 0;
  while (denominator % 2n === 0n) {
    denominator /= 2n;
    twos += 1;
  }
  while (denominator % 5n === 0n) {
    denominator /= 5n;
    fives += 1;
  }
  return denominator === 1n ? Math.max(twos, fives) : null;
}

export function hasTerminatingDecimal(value) {
  return exactFractionDigits(value) !== null;
}

export function formatRational(value, maximumFractionDigits = 24) {
  if (!Number.isInteger(maximumFractionDigits)) {
    throw new Error("Maximum fraction digits must be an integer.");
  }

  const digits = Math.max(
    0,
    Math.min(MAX_OUTPUT_DIGITS, maximumFractionDigits),
  );
  const negative = value.n < 0n;
  const numerator = absolute(value.n);
  const scale = powerOfTen(digits);
  const rounded = (numerator * scale * 2n + value.d) / (value.d * 2n);
  let output = rounded.toString().padStart(digits + 1, "0");

  if (digits > 0) {
    const split = output.length - digits;
    output = `${output.slice(0, split)}.${output.slice(split)}`;
    output = output.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  }

  if (negative && output !== "0") {
    output = `-${output}`;
  }
  return output;
}
