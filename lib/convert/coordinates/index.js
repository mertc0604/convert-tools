import { transformCrs } from "./crs.js";
import {
  formatDdm,
  formatDms,
  parseCoordinatePair,
} from "./dms.js";
import {
  decodeGars,
  decodeGeoref,
  encodeGars,
  encodeGeoref,
} from "./grid-references.js";
import { decodeMgrs, encodeMgrs, formatMgrs } from "./mgrs.js";
import {
  fixed,
  parseCoordinateNumber,
  pointFromValues,
  validatePoint,
} from "./numbers.js";
import { utmUpsForward, utmUpsInverse } from "./utm-ups.js";

function pointSource(point) {
  return { ...point, sourceKind: "point" };
}

export function fromDecimalDegrees(latitude, longitude) {
  return pointSource(pointFromValues(latitude, longitude));
}

export function fromDms(latitude, longitude) {
  return pointSource(parseCoordinatePair(latitude, longitude));
}

export function fromDdm(latitude, longitude) {
  return pointSource(parseCoordinatePair(latitude, longitude));
}

export function fromMgrs(value) {
  const decoded = decodeMgrs(value, true);
  return {
    latitude: decoded.latitude,
    longitude: decoded.longitude,
    sourceKind: "cell",
    sourceCellMetres: decoded.cellMetres,
  };
}

export function fromUtmUps(zoneValue, hemisphereValue, eastingValue, northingValue) {
  const zoneSource = String(zoneValue).trim();
  if (!/^\d{1,2}$/.test(zoneSource)) {
    throw new Error("Zone must be an integer from 0 to 60.");
  }
  const zone = Number(zoneSource);
  if (zone < 0 || zone > 60) {
    throw new Error("Zone must be an integer from 0 to 60.");
  }
  const hemisphere = String(hemisphereValue).trim().toUpperCase();
  if (hemisphere !== "N" && hemisphere !== "S") {
    throw new Error("Hemisphere must be N or S.");
  }
  const point = utmUpsInverse(
    zone,
    hemisphere === "N",
    parseCoordinateNumber(eastingValue, "Easting"),
    parseCoordinateNumber(northingValue, "Northing"),
  );
  return pointSource(point);
}

export function fromGars(value) {
  const decoded = decodeGars(value);
  return {
    latitude: decoded.latitude,
    longitude: decoded.longitude,
    sourceKind: "area",
    sourceCellDegrees: decoded.cellDegrees,
  };
}

export function fromGeoref(value) {
  const decoded = decodeGeoref(value);
  return {
    latitude: decoded.latitude,
    longitude: decoded.longitude,
    sourceKind: "cell",
    sourceCellDegrees: decoded.cellDegrees,
  };
}

export function coordinateResults(point, mgrsPrecision = 5) {
  const { latitude, longitude } = validatePoint(
    point.latitude,
    point.longitude,
  );
  const precision = Number(mgrsPrecision);
  if (!Number.isInteger(precision) || precision < 0 || precision > 5) {
    throw new Error("MGRS precision must be between 0 and 5.");
  }

  const grid = utmUpsForward(latitude, longitude);
  const gridPrefix =
    grid.zone === 0
      ? `UPS ${grid.north ? "N" : "S"}`
      : `${grid.zone}${grid.north ? "N" : "S"}`;
  return {
    latitude,
    longitude,
    dd: `${fixed(latitude, 10)}, ${fixed(longitude, 10)}`,
    dms: `${formatDms(latitude, "latitude")}  ${formatDms(longitude, "longitude")}`,
    ddm: `${formatDdm(latitude, "latitude")}  ${formatDdm(longitude, "longitude")}`,
    mgrs: formatMgrs(encodeMgrs(latitude, longitude, precision)),
    utmUps: `${gridPrefix}  ${fixed(grid.easting, 3)} E  ${fixed(grid.northing, 3)} N`,
    gars: encodeGars(longitude, latitude),
    georef: encodeGeoref(longitude, latitude, 4),
    sourceKind: point.sourceKind ?? "point",
    sourceCellMetres: point.sourceCellMetres,
    sourceCellDegrees: point.sourceCellDegrees,
  };
}

export {
  decodeGars,
  decodeGeoref,
  decodeMgrs,
  encodeGars,
  encodeGeoref,
  encodeMgrs,
  formatDdm,
  formatDms,
  transformCrs,
  utmUpsForward,
  utmUpsInverse,
};
export { normalizeEpsg, SUPPORTED_CRS } from "./crs.js";
