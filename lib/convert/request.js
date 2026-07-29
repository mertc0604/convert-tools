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
  transformCrs,
} from "./index.js";

export class ConversionRequestError extends Error {
  constructor(message) {
    super(message);
    this.name = "ConversionRequestError";
  }
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

export function convertRequest(payloadValue) {
  const payload = requiredObject(payloadValue, "request body");
  try {
    if (payload.type === "unit") return unitResponse(payload);
    if (payload.type === "coordinate") return coordinateResponse(payload);
    if (payload.type === "crs") return crsResponse(payload);
    throw new ConversionRequestError(
      'type must be "unit", "coordinate", or "crs".',
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
    version: "1.0.0",
    endpoint: "/api/convert",
    method: "POST",
    types: ["unit", "coordinate", "crs"],
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
    example: {
      type: "unit",
      category: "length",
      value: "1",
      from: "nautical-mile",
      to: "metre",
    },
  };
}
