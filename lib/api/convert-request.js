import {
  UNIT_CATEGORIES,
  convertLength,
  coordinateResults,
  fromDecimalDegrees,
  fromDdm,
  fromDms,
  fromGars,
  fromGeoref,
  fromMgrs,
  fromUtmUps,
  directGeodesic,
  inverseGeodesic,
  measureGeodesicPolyline,
  sampleGeodesicPath,
  transformCrs,
} from "@convert-tools/core";

const MAX_API_POLYLINE_POINTS = 1000;
const MAX_API_PATH_POINTS = 2049;
export const MAX_API_REQUEST_BODY_BYTES = 128 * 1024;

export class ConversionRequestError extends Error {
  constructor(message) {
    super(message);
    this.name = "ConversionRequestError";
  }
}

function requiredPointArray(value) {
  if (!Array.isArray(value)) {
    throw new ConversionRequestError("points must be an array.");
  }
  if (value.length > MAX_API_POLYLINE_POINTS) {
    throw new ConversionRequestError(
      `points must contain at most ${MAX_API_POLYLINE_POINTS} positions.`,
    );
  }
  return value;
}

function requiredObject(value, name) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ConversionRequestError(`${name} must be an object.`);
  }
  return value;
}

function pathMaxPoints(value) {
  const result = value ?? MAX_API_PATH_POINTS;
  if (
    !Number.isInteger(result) ||
    result < 2 ||
    result > MAX_API_PATH_POINTS
  ) {
    throw new ConversionRequestError(
      `maxPoints must be an integer between 2 and ${MAX_API_PATH_POINTS}.`,
    );
  }
  return result;
}

function coordinatePoint(format, value) {
  if (format === "dd") {
    return fromDecimalDegrees(value.latitude, value.longitude);
  }
  if (format === "dms") {
    return fromDms(value.latitude, value.longitude);
  }
  if (format === "ddm") {
    return fromDdm(value.latitude, value.longitude);
  }
  if (format === "mgrs") return fromMgrs(value.coordinate);
  if (format === "gars") return fromGars(value.coordinate);
  if (format === "georef") return fromGeoref(value.coordinate);
  if (format === "utm" || format === "utm-ups") {
    return fromUtmUps(
      value.zone,
      value.hemisphere,
      value.easting,
      value.northing,
    );
  }
  throw new ConversionRequestError(`Unsupported coordinate format: ${format}.`);
}

function exactLengthInput(payload) {
  const hasValue = payload.value !== undefined;
  const hasExactValue = payload.exactValue !== undefined;
  if (hasValue === hasExactValue) {
    throw new ConversionRequestError(
      "Provide exactly one of value or exactValue.",
    );
  }
  if (hasExactValue) {
    return requiredObject(payload.exactValue, "exactValue");
  }
  if (typeof payload.value !== "string") {
    throw new ConversionRequestError(
      "value must be a decimal string; use exactValue for chained conversions.",
    );
  }
  return payload.value;
}

function lengthResponse(payload, responseType = "length") {
  if (payload.category !== undefined && payload.category !== "length") {
    throw new ConversionRequestError(
      'Only the "length" unit category is supported.',
    );
  }
  const result = convertLength(
    exactLengthInput(payload),
    payload.from,
    payload.to,
    payload.precision ?? 24,
  );
  return {
    type: responseType,
    category: "length",
    input: {
      ...(typeof payload.value === "string"
        ? { value: payload.value }
        : { exactValue: payload.exactValue }),
      unit: result.from.id,
      symbol: result.from.symbol,
    },
    result: {
      value: result.value,
      unit: result.to.id,
      symbol: result.to.symbol,
      exactDecimal: result.exactDecimal,
      terminatingDecimal: result.terminatingDecimal,
      requiredFractionDigits: result.requiredFractionDigits,
      rounded: !result.exactDecimal,
      precision: result.precision,
      roundingMode: result.roundingMode,
      exactValue: result.exactValue,
      exactMetres: result.exactMetres,
      factor: result.factor,
      exactFactor: result.exactFactor,
    },
  };
}

function coordinateResponse(payload) {
  const value = requiredObject(payload.value, "value");
  const inputFormat = String(payload.format ?? "").toLowerCase();
  const point = coordinatePoint(inputFormat, value);
  return {
    type: "coordinate",
    datum: "WGS84",
    inputFormat,
    result: coordinateResults(point, payload.mgrsPrecision ?? 5),
  };
}

function crsResponse(payload) {
  return {
    type: "crs",
    result: transformCrs(
      payload.source,
      payload.target,
      payload.x,
      payload.y,
    ),
  };
}

function distanceOutput(distanceMetres, outputUnit, precision) {
  const conversion = convertLength(
    String(distanceMetres),
    "metre",
    outputUnit,
    precision,
  );
  return {
    distanceMetres,
    value: conversion.value,
    unit: conversion.to.id,
    symbol: conversion.to.symbol,
    exactValue: conversion.exactValue,
    exactMetres: conversion.exactMetres,
    exactDecimal: conversion.exactDecimal,
    rounded: conversion.rounded,
    precision: conversion.precision,
    roundingMode: conversion.roundingMode,
  };
}

function geodesicResponse(payload) {
  const operation = String(payload.operation ?? "inverse").toLowerCase();
  const outputUnit = String(payload.outputUnit ?? "metre");
  const precision = payload.precision ?? 12;

  if (operation === "inverse") {
    const result = inverseGeodesic(
      requiredObject(payload.start, "start"),
      requiredObject(payload.end, "end"),
    );
    return {
      type: "geodesic",
      operation,
      datum: "WGS84",
      result: {
        ...result,
        distance: distanceOutput(
          result.distanceMetres,
          outputUnit,
          precision,
        ),
      },
    };
  }

  if (operation === "direct") {
    return {
      type: "geodesic",
      operation,
      datum: "WGS84",
      result: directGeodesic(
        requiredObject(payload.start, "start"),
        payload.initialBearingDegrees,
        payload.distanceMetres,
      ),
    };
  }

  if (operation === "polyline") {
    const result = measureGeodesicPolyline(
      requiredPointArray(payload.points),
    );
    return {
      type: "geodesic",
      operation,
      datum: "WGS84",
      result: {
        ...result,
        distance: distanceOutput(
          result.distanceMetres,
          outputUnit,
          precision,
        ),
      },
    };
  }

  if (operation === "path") {
    const result = sampleGeodesicPath(
      requiredObject(payload.start, "start"),
      requiredObject(payload.end, "end"),
      {
        maxSegmentMetres: payload.maxSegmentMetres ?? 25_000,
        maxPoints: pathMaxPoints(payload.maxPoints),
      },
    );
    return {
      type: "geodesic",
      operation,
      datum: "WGS84",
      result: {
        ...result,
        distance: distanceOutput(
          result.distanceMetres,
          outputUnit,
          precision,
        ),
      },
    };
  }

  throw new ConversionRequestError(
    'operation must be "inverse", "direct", "polyline", or "path".',
  );
}

export function convertRequest(payloadValue) {
  const payload = requiredObject(payloadValue, "request body");
  try {
    if (payload.type === "length") return lengthResponse(payload);
    if (payload.type === "unit") return lengthResponse(payload, "unit");
    if (payload.type === "coordinate") return coordinateResponse(payload);
    if (payload.type === "crs") return crsResponse(payload);
    if (payload.type === "geodesic") return geodesicResponse(payload);
    throw new ConversionRequestError(
      'type must be "length", "coordinate", "crs", or "geodesic".',
    );
  } catch (error) {
    if (error instanceof ConversionRequestError) throw error;
    throw new ConversionRequestError(
      error instanceof Error ? error.message : "Conversion failed.",
    );
  }
}

export function apiCapabilities() {
  return {
    name: "Convert API",
    version: "2.0.0",
    endpoint: "/api/convert",
    method: "POST",
    contractVersion: "2.0",
    types: ["length", "coordinate", "crs", "geodesic"],
    compatibilityTypes: ["unit (length category only)"],
    unitCategories: UNIT_CATEGORIES.map((category) => ({
      id: category.id,
      units: category.units.map(({ id, label, symbol }) => ({
        id,
        label,
        symbol,
      })),
    })),
    coordinateFormats: ["dd", "dms", "ddm", "mgrs", "utm-ups", "gars", "georef"],
    crs: [
      "EPSG:4326",
      "EPSG:3857",
      "EPSG:32601–EPSG:32660",
      "EPSG:32701–EPSG:32760",
      "EPSG:5041",
      "EPSG:5042",
    ],
    geodesic: {
      datum: "WGS84",
      operations: ["inverse", "direct", "polyline", "path"],
      inputAngles: "degrees",
      baseDistanceUnit: "metre",
      pathModel: "shortest ellipsoidal geodesic per segment",
      maximumApiPolylinePoints: MAX_API_POLYLINE_POINTS,
      maximumApiPathPoints: MAX_API_PATH_POINTS,
    },
    limits: {
      maximumRequestBodyBytes: MAX_API_REQUEST_BODY_BYTES,
      maximumExactInputDigits: 4096,
    },
    example: {
      type: "length",
      value: "1",
      from: "nautical-mile",
      to: "metre",
    },
  };
}
