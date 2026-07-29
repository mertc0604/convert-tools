import {
  UNIT_CATEGORIES,
  convertUnits,
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
  transformCrs,
} from "@convert-tools/core";

const MAX_API_POLYLINE_POINTS = 1000;

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

function unitResponse(payload) {
  const result = convertUnits(
    payload.value,
    payload.category,
    payload.from,
    payload.to,
    payload.precision ?? 24,
  );
  return {
    type: "unit",
    category: payload.category,
    input: {
      value: String(payload.value),
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
      factor: result.factor,
    },
  };
}

function coordinateResponse(payload) {
  const value = requiredObject(payload.value, "value");
  const point = coordinatePoint(String(payload.format ?? "").toLowerCase(), value);
  return {
    type: "coordinate",
    datum: "WGS84",
    inputFormat: payload.format,
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
  const conversion = convertUnits(
    String(distanceMetres),
    "length",
    "metre",
    outputUnit,
    precision,
  );
  return {
    distanceMetres,
    value: conversion.value,
    unit: conversion.to.id,
    symbol: conversion.to.symbol,
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

  throw new ConversionRequestError(
    'operation must be "inverse", "direct", or "polyline".',
  );
}

export function convertRequest(payloadValue) {
  const payload = requiredObject(payloadValue, "request body");
  try {
    if (payload.type === "unit") return unitResponse(payload);
    if (payload.type === "coordinate") return coordinateResponse(payload);
    if (payload.type === "crs") return crsResponse(payload);
    if (payload.type === "geodesic") return geodesicResponse(payload);
    throw new ConversionRequestError(
      'type must be "unit", "coordinate", "crs", or "geodesic".',
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
    version: "1.1.0",
    endpoint: "/api/convert",
    method: "POST",
    contractVersion: "1.1",
    types: ["unit", "coordinate", "crs", "geodesic"],
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
      operations: ["inverse", "direct", "polyline"],
      inputAngles: "degrees",
      baseDistanceUnit: "metre",
      pathModel: "shortest ellipsoidal geodesic per segment",
      maximumApiPolylinePoints: MAX_API_POLYLINE_POINTS,
    },
    example: {
      type: "unit",
      category: "length",
      value: "1",
      from: "nautical-mile",
      to: "metre",
    },
  };
}
