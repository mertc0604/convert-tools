import {
  DEGREE,
  RADIAN,
  WGS84,
  WGS84_DERIVED,
  conformalTangent,
  inverseConformalTangent,
  meridionalArc,
} from "./ellipsoid.js";
import { normalizeLongitude, validatePoint } from "./numbers.js";

const UTM_FALSE_EASTING = 500000;
const UTM_FALSE_NORTHING = 10000000;
const UPS_FALSE_ORIGIN = 2000000;

export function standardUtmZone(latitude, longitude) {
  if (latitude < -80 || latitude >= 84) return 0;
  const lon = longitude === 180 ? 180 - Number.EPSILON * 128 : longitude;
  let zone = Math.max(1, Math.min(60, Math.floor((lon + 180) / 6) + 1));

  if (latitude >= 56 && latitude < 64 && lon >= 3 && lon < 12) {
    zone = 32;
  } else if (latitude >= 72 && latitude < 84 && lon >= 0 && lon < 42) {
    if (lon < 9) zone = 31;
    else if (lon < 21) zone = 33;
    else if (lon < 33) zone = 35;
    else zone = 37;
  }
  return zone;
}

export function centralMeridian(zone) {
  if (!Number.isInteger(zone) || zone < 1 || zone > 60) {
    throw new Error("UTM zone must be an integer from 1 to 60.");
  }
  return zone * 6 - 183;
}

export function utmForward(latitude, longitude, requestedZone) {
  validatePoint(latitude, longitude);
  if (latitude < -80 || latitude > 84) {
    throw new Error("UTM is defined between 80°S and 84°N.");
  }

  const zone = requestedZone ?? standardUtmZone(latitude, longitude);
  if (!Number.isInteger(zone) || zone < 1 || zone > 60) {
    throw new Error("UTM zone must be an integer from 1 to 60.");
  }

  const { a, utmScale: k0 } = WGS84;
  const { e2, ep2 } = WGS84_DERIVED;
  const latitudeRadians = latitude * DEGREE;
  const normalizedLongitude = normalizeLongitude(longitude);
  const longitudeArcDegrees = normalizeLongitude(
    normalizedLongitude - centralMeridian(zone),
  );
  if (Math.abs(longitudeArcDegrees) > 6) {
    throw new Error("Longitude is too far from the selected UTM zone.");
  }
  const sinLatitude = Math.sin(latitudeRadians);
  const cosLatitude = Math.cos(latitudeRadians);
  const tangentLatitude = Math.tan(latitudeRadians);
  const n = a / Math.sqrt(1 - e2 * sinLatitude * sinLatitude);
  const t = tangentLatitude * tangentLatitude;
  const c = ep2 * cosLatitude * cosLatitude;
  const longitudeArc = longitudeArcDegrees * DEGREE;
  const aa = cosLatitude * longitudeArc;
  const aa2 = aa * aa;
  const aa3 = aa2 * aa;
  const aa4 = aa2 * aa2;
  const aa5 = aa4 * aa;
  const aa6 = aa3 * aa3;

  const easting =
    UTM_FALSE_EASTING +
    k0 *
      n *
      (aa +
        ((1 - t + c) * aa3) / 6 +
        ((5 - 18 * t + t * t + 72 * c - 58 * ep2) * aa5) / 120);
  let northing =
    k0 *
    (meridionalArc(latitudeRadians) +
      n *
        tangentLatitude *
        (aa2 / 2 +
          ((5 - t + 9 * c + 4 * c * c) * aa4) / 24 +
          ((61 - 58 * t + t * t + 600 * c - 330 * ep2) * aa6) / 720));
  const north = latitude >= 0;
  if (!north) northing += UTM_FALSE_NORTHING;

  return { zone, north, easting, northing };
}

export function utmInverse(zone, north, easting, northing) {
  if (!Number.isInteger(zone) || zone < 1 || zone > 60) {
    throw new Error("UTM zone must be an integer from 1 to 60.");
  }
  if (
    !Number.isFinite(easting) ||
    !Number.isFinite(northing) ||
    easting < 0 ||
    easting > 1000000 ||
    northing < 0 ||
    northing > 10000000
  ) {
    throw new Error("UTM easting or northing is outside the supported range.");
  }

  const { a, utmScale: k0 } = WGS84;
  const { e2, ep2 } = WGS84_DERIVED;
  const e4 = e2 * e2;
  const e6 = e4 * e2;
  const x = easting - UTM_FALSE_EASTING;
  const y = north ? northing : northing - UTM_FALSE_NORTHING;
  const meridionalDistance = y / k0;
  const mu =
    meridionalDistance /
    (a * (1 - e2 / 4 - (3 * e4) / 64 - (5 * e6) / 256));
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const e12 = e1 * e1;
  const e13 = e12 * e1;
  const e14 = e12 * e12;
  const footprint =
    mu +
    (3 * e1 / 2 - 27 * e13 / 32) * Math.sin(2 * mu) +
    (21 * e12 / 16 - 55 * e14 / 32) * Math.sin(4 * mu) +
    (151 * e13 / 96) * Math.sin(6 * mu) +
    (1097 * e14 / 512) * Math.sin(8 * mu);

  const sinFootprint = Math.sin(footprint);
  const cosFootprint = Math.cos(footprint);
  const tanFootprint = Math.tan(footprint);
  const n1 = a / Math.sqrt(1 - e2 * sinFootprint * sinFootprint);
  const r1 =
    (a * (1 - e2)) /
    (1 - e2 * sinFootprint * sinFootprint) ** 1.5;
  const t1 = tanFootprint * tanFootprint;
  const c1 = ep2 * cosFootprint * cosFootprint;
  const d = x / (n1 * k0);
  const d2 = d * d;
  const d3 = d2 * d;
  const d4 = d2 * d2;
  const d5 = d4 * d;
  const d6 = d3 * d3;

  const latitude =
    (footprint -
      ((n1 * tanFootprint) / r1) *
        (d2 / 2 -
          ((5 + 3 * t1 + 10 * c1 - 4 * c1 * c1 - 9 * ep2) * d4) / 24 +
          ((61 +
            90 * t1 +
            298 * c1 +
            45 * t1 * t1 -
            252 * ep2 -
            3 * c1 * c1) *
            d6) /
            720)) *
    RADIAN;
  const longitude =
    centralMeridian(zone) +
    ((d -
      ((1 + 2 * t1 + c1) * d3) / 6 +
      ((5 -
        2 * c1 +
        28 * t1 -
        3 * c1 * c1 +
        8 * ep2 +
        24 * t1 * t1) *
        d5) /
        120) /
      cosFootprint) *
      RADIAN;

  return validatePoint(latitude, normalizeLongitude(longitude));
}

function polarConstant() {
  const { a, f, upsScale } = WGS84;
  const { e } = WGS84_DERIVED;
  const c = (1 - f) * Math.exp(e * Math.atanh(e));
  return (2 * upsScale * a) / c;
}

export function upsForward(latitude, longitude, requestedNorth) {
  validatePoint(latitude, longitude);
  const north = requestedNorth ?? latitude >= 0;
  if ((north && latitude < 60) || (!north && latitude > -60)) {
    throw new Error("UPS coordinates must be within 30° of the selected pole.");
  }

  const signedLatitude = north ? latitude : -latitude;
  const tangent = Math.tan(signedLatitude * DEGREE);
  const conformal = conformalTangent(tangent);
  let rho = Math.hypot(1, conformal) + Math.abs(conformal);
  rho =
    conformal >= 0
      ? signedLatitude === 90
        ? 0
        : 1 / rho
      : rho;
  rho *= polarConstant();

  const longitudeRadians = normalizeLongitude(longitude) * DEGREE;
  const easting = UPS_FALSE_ORIGIN + rho * Math.sin(longitudeRadians);
  const northing =
    UPS_FALSE_ORIGIN + (north ? -rho : rho) * Math.cos(longitudeRadians);
  return { zone: 0, north, easting, northing };
}

export function upsInverse(north, easting, northing) {
  if (
    !Number.isFinite(easting) ||
    !Number.isFinite(northing) ||
    easting < 700000 ||
    easting > 3300000 ||
    northing < 700000 ||
    northing > 3300000
  ) {
    throw new Error("UPS easting or northing is outside the supported range.");
  }

  const x = easting - UPS_FALSE_ORIGIN;
  const y = northing - UPS_FALSE_ORIGIN;
  const rho = Math.hypot(x, y);
  const t = rho === 0 ? Number.EPSILON ** 2 : rho / polarConstant();
  const conformal = (1 / t - t) / 2;
  const tangent = inverseConformalTangent(conformal);
  const latitude = (north ? 1 : -1) * Math.atan(tangent) * RADIAN;
  const longitude =
    Math.atan2(x, north ? -y : y) * RADIAN;
  return validatePoint(latitude, normalizeLongitude(longitude));
}

export function utmUpsForward(latitude, longitude) {
  const zone = standardUtmZone(latitude, longitude);
  return zone === 0
    ? upsForward(latitude, longitude)
    : utmForward(latitude, longitude, zone);
}

export function utmUpsInverse(zone, north, easting, northing) {
  return zone === 0
    ? upsInverse(north, easting, northing)
    : utmInverse(zone, north, easting, northing);
}
