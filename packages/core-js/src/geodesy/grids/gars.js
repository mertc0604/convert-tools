import { pointFromValues, validatePoint } from "../core/numbers.js";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ";

export function encodeGars(longitudeValue, latitudeValue) {
  const { latitude, longitude } = pointFromValues(latitudeValue, longitudeValue);
  const safeLongitude = longitude === 180 ? 180 - Number.EPSILON * 128 : longitude;
  const safeLatitude = latitude === 90 ? 90 - Number.EPSILON * 64 : latitude;
  const longitudePosition = (safeLongitude + 180) / 0.5;
  const latitudePosition = (safeLatitude + 90) / 0.5;
  const longitudeIndex = Math.floor(longitudePosition);
  const latitudeIndex = Math.floor(latitudePosition);
  const longitudeBand = String(longitudeIndex + 1).padStart(3, "0");
  const latitudeBand =
    ALPHABET[Math.floor(latitudeIndex / 24)] + ALPHABET[latitudeIndex % 24];

  const longitudeRemainder = longitudePosition - longitudeIndex;
  const latitudeRemainder = latitudePosition - latitudeIndex;
  const quadrantColumn = Math.min(1, Math.floor(longitudeRemainder * 2));
  const quadrantRow = Math.min(1, Math.floor(latitudeRemainder * 2));
  const quadrant =
    quadrantRow === 1
      ? quadrantColumn === 0
        ? 1
        : 2
      : quadrantColumn === 0
        ? 3
        : 4;
  const longitudeInQuadrant = longitudeRemainder * 2 - quadrantColumn;
  const latitudeInQuadrant = latitudeRemainder * 2 - quadrantRow;
  const keypadColumn = Math.min(2, Math.floor(longitudeInQuadrant * 3));
  const keypadRowFromSouth = Math.min(2, Math.floor(latitudeInQuadrant * 3));
  const keypad = (2 - keypadRowFromSouth) * 3 + keypadColumn + 1;
  return `${longitudeBand}${latitudeBand}${quadrant}${keypad}`;
}

export function decodeGars(value) {
  const source = String(value).toUpperCase().replace(/\s+/g, "");
  if (!/^\d{3}[A-HJ-NP-Z]{2}(?:[1-4](?:[1-9])?)?$/.test(source)) {
    throw new Error("Invalid GARS coordinate.");
  }

  const longitudeBand = Number(source.slice(0, 3));
  const latitudeBand =
    ALPHABET.indexOf(source[3]) * 24 + ALPHABET.indexOf(source[4]);
  if (
    longitudeBand < 1 ||
    longitudeBand > 720 ||
    latitudeBand < 0 ||
    latitudeBand > 359
  ) {
    throw new Error("Invalid GARS band.");
  }

  let longitude = -180 + (longitudeBand - 1) * 0.5;
  let latitude = -90 + latitudeBand * 0.5;
  let cellDegrees = 0.5;
  if (source.length >= 6) {
    const quadrant = Number(source[5]);
    longitude += (quadrant === 2 || quadrant === 4 ? 1 : 0) * 0.25;
    latitude += (quadrant === 1 || quadrant === 2 ? 1 : 0) * 0.25;
    cellDegrees = 0.25;
  }
  if (source.length === 7) {
    const keypadIndex = Number(source[6]) - 1;
    longitude += (keypadIndex % 3) / 12;
    latitude += (2 - Math.floor(keypadIndex / 3)) / 12;
    cellDegrees = 1 / 12;
  }

  return {
    ...validatePoint(
      latitude + cellDegrees / 2,
      longitude + cellDegrees / 2,
    ),
    precision: source.length,
    cellDegrees,
  };
}
