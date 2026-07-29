import { utmUpsForward, utmUpsInverse } from "./utm-ups.js";

const TILE = 100000;
const LATITUDE_BANDS = "CDEFGHJKLMNPQRSTUVWX";
const UTM_COLUMNS = ["ABCDEFGH", "JKLMNPQR", "STUVWXYZ"];
const UTM_ROWS = "ABCDEFGHJKLMNPQRSTUV";
const UPS_BANDS = "ABYZ";
const UPS_COLUMNS = [
  "JKLPQRSTUXYZ",
  "ABCFGHJKLPQR",
  "RSTUXYZ",
  "ABCFGHJ",
];
const UPS_ROWS = [
  "ABCDEFGHJKLMNPQRSTUVWXYZ",
  "ABCDEFGHJKLMNP",
];
const BAND_MINIMUM_NORTHING = {
  C: 1100000,
  D: 2000000,
  E: 2800000,
  F: 3700000,
  G: 4600000,
  H: 5500000,
  J: 6400000,
  K: 7300000,
  L: 8200000,
  M: 9100000,
  N: 0,
  P: 800000,
  Q: 1700000,
  R: 2600000,
  S: 3500000,
  T: 4400000,
  U: 5300000,
  V: 6200000,
  W: 7000000,
  X: 7900000,
};

function latitudeBand(latitude) {
  if (latitude < -80 || latitude > 84) {
    throw new Error("UTM MGRS latitude must be between 80°S and 84°N.");
  }
  if (latitude === 84) return "X";
  const index = Math.max(
    0,
    Math.min(19, Math.floor((latitude + 80) / 8)),
  );
  return LATITUDE_BANDS[index];
}

function precisionDigits(value, precision) {
  if (precision === 0) return "";
  const unit = 10 ** (5 - precision);
  const tile = Math.floor(value / TILE);
  const remainder = Math.max(0, Math.min(TILE - Number.EPSILON, value - tile * TILE));
  return String(Math.min(10 ** precision - 1, Math.floor(remainder / unit)))
    .padStart(precision, "0")
    .slice(-precision);
}

function validatePrecision(precision) {
  if (!Number.isInteger(precision) || precision < 0 || precision > 5) {
    throw new Error("MGRS precision must be between 0 and 5.");
  }
}

function encodeUtm(grid, latitude, precision) {
  const band = latitudeBand(latitude);
  const columnSet = UTM_COLUMNS[(grid.zone - 1) % 3];
  const columnIndex = Math.floor(grid.easting / TILE) - 1;
  const rowIndex =
    (Math.floor(grid.northing / TILE) + (grid.zone % 2 === 0 ? 5 : 0)) % 20;
  if (columnIndex < 0 || columnIndex >= columnSet.length) {
    throw new Error("UTM easting is outside the MGRS grid.");
  }
  return (
    `${grid.zone}${band}${columnSet[columnIndex]}${UTM_ROWS[rowIndex]}` +
    precisionDigits(grid.easting, precision) +
    precisionDigits(grid.northing, precision)
  );
}

function encodeUps(grid, precision) {
  const columnTile = Math.floor(grid.easting / TILE);
  const rowTile = Math.floor(grid.northing / TILE);
  const east = columnTile >= 20;
  const bandIndex = (grid.north ? 2 : 0) + (east ? 1 : 0);
  const columnOffset = east ? 20 : grid.north ? 13 : 8;
  const rowOffset = grid.north ? 13 : 8;
  const column = UPS_COLUMNS[bandIndex][columnTile - columnOffset];
  const row = UPS_ROWS[grid.north ? 1 : 0][rowTile - rowOffset];
  if (!column || !row) {
    throw new Error("UPS coordinate is outside the MGRS lettering grid.");
  }
  return (
    `${UPS_BANDS[bandIndex]}${column}${row}` +
    precisionDigits(grid.easting, precision) +
    precisionDigits(grid.northing, precision)
  );
}

export function encodeMgrs(latitude, longitude, precision = 5) {
  validatePrecision(precision);
  const grid = utmUpsForward(latitude, longitude);
  return grid.zone === 0
    ? encodeUps(grid, precision)
    : encodeUtm(grid, latitude, precision);
}

function parseTrailingDigits(source, prefixLength) {
  const digits = source.slice(prefixLength);
  if (!/^\d*$/.test(digits) || digits.length % 2 !== 0 || digits.length > 10) {
    throw new Error("MGRS must end with an even number of digits.");
  }
  const precision = digits.length / 2;
  const unit = 10 ** (5 - precision);
  return {
    precision,
    unit,
    easting: precision ? Number(digits.slice(0, precision)) * unit : 0,
    northing: precision ? Number(digits.slice(precision)) * unit : 0,
  };
}

function decodeUtm(source, center) {
  const match = source.match(
    /^(\d{1,2})([C-HJ-NP-X])([A-HJ-NP-Z])([A-HJ-NP-V])/,
  );
  if (!match) throw new Error("Invalid UTM MGRS coordinate.");
  const [, zoneText, band, column, row] = match;
  const zone = Number(zoneText);
  if (zone < 1 || zone > 60) throw new Error("Invalid MGRS zone.");
  const columnSet = UTM_COLUMNS[(zone - 1) % 3];
  const columnIndex = columnSet.indexOf(column);
  if (columnIndex < 0) throw new Error("Invalid MGRS 100 km column.");
  let rowIndex = UTM_ROWS.indexOf(row);
  if (rowIndex < 0) throw new Error("Invalid MGRS 100 km row.");
  if (zone % 2 === 0) rowIndex = (rowIndex + 15) % 20;

  const trailing = parseTrailingDigits(source, match[0].length);
  let easting = (columnIndex + 1) * TILE + trailing.easting;
  let northing = rowIndex * TILE + trailing.northing;
  while (northing < BAND_MINIMUM_NORTHING[band]) northing += 2000000;
  if (center) {
    easting += trailing.unit / 2;
    northing += trailing.unit / 2;
  }

  const north = LATITUDE_BANDS.indexOf(band) >= LATITUDE_BANDS.indexOf("N");
  const point = utmUpsInverse(zone, north, easting, northing);
  const bandIndex = LATITUDE_BANDS.indexOf(band);
  const minimumLatitude = -80 + bandIndex * 8;
  const maximumLatitude = band === "X" ? 84 : minimumLatitude + 8;
  if (point.latitude < minimumLatitude - 1 || point.latitude > maximumLatitude + 1) {
    throw new Error("MGRS square is inconsistent with its latitude band.");
  }
  return {
    ...point,
    zone,
    north,
    easting,
    northing,
    precision: trailing.precision,
    cellMetres: trailing.unit,
  };
}

function decodeUps(source, center) {
  const match = source.match(/^([ABYZ])([A-HJ-NP-Z])([A-HJ-NP-Z])/);
  if (!match) throw new Error("Invalid UPS MGRS coordinate.");
  const [, band, column, row] = match;
  const bandIndex = UPS_BANDS.indexOf(band);
  const north = bandIndex >= 2;
  const east = bandIndex % 2 === 1;
  const columnIndex = UPS_COLUMNS[bandIndex].indexOf(column);
  const rowIndex = UPS_ROWS[north ? 1 : 0].indexOf(row);
  if (columnIndex < 0 || rowIndex < 0) {
    throw new Error("Invalid UPS MGRS 100 km square.");
  }

  const trailing = parseTrailingDigits(source, match[0].length);
  const columnOffset = east ? 20 : north ? 13 : 8;
  const rowOffset = north ? 13 : 8;
  let easting = (columnOffset + columnIndex) * TILE + trailing.easting;
  let northing = (rowOffset + rowIndex) * TILE + trailing.northing;
  if (center) {
    easting += trailing.unit / 2;
    northing += trailing.unit / 2;
  }
  const point = utmUpsInverse(0, north, easting, northing);
  return {
    ...point,
    zone: 0,
    north,
    easting,
    northing,
    precision: trailing.precision,
    cellMetres: trailing.unit,
  };
}

export function decodeMgrs(value, center = true) {
  const source = String(value).toUpperCase().replace(/\s+/g, "");
  return /^\d/.test(source)
    ? decodeUtm(source, center)
    : decodeUps(source, center);
}

export function formatMgrs(value) {
  const source = String(value).toUpperCase().replace(/\s+/g, "");
  const utm = source.match(/^(\d{1,2})([C-HJ-NP-X])([A-HJ-NP-Z]{2})(\d*)$/);
  const ups = source.match(/^([ABYZ])([A-HJ-NP-Z]{2})(\d*)$/);
  const match = utm ?? ups;
  if (!match) return source;

  const numeric = match[match.length - 1];
  const prefix = match.slice(1, -1).join(" ");
  if (!numeric) return prefix;
  const split = numeric.length / 2;
  return `${prefix} ${numeric.slice(0, split)} ${numeric.slice(split)}`;
}
