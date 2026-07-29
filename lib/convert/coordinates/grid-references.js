import { pointFromValues, validatePoint } from "./numbers.js";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DEGREE_ALPHABET = ALPHABET.slice(0, 15);

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

export function encodeGeoref(longitudeValue, latitudeValue, precision = 4) {
  const { latitude, longitude } = pointFromValues(latitudeValue, longitudeValue);
  if (!Number.isInteger(precision) || precision < 0 || precision > 5) {
    throw new Error("GEOREF precision must be between 0 and 5.");
  }

  const safeLongitude = longitude === 180 ? -180 : longitude;
  const safeLatitude = latitude === 90 ? 90 - Number.EPSILON * 64 : latitude;
  const shiftedLongitude = safeLongitude + 180;
  const shiftedLatitude = safeLatitude + 90;
  const longitudeZone = Math.floor(shiftedLongitude / 15);
  const latitudeZone = Math.floor(shiftedLatitude / 15);
  const longitudeWithinZone = shiftedLongitude - longitudeZone * 15;
  const latitudeWithinZone = shiftedLatitude - latitudeZone * 15;
  const longitudeDegree = Math.floor(longitudeWithinZone);
  const latitudeDegree = Math.floor(latitudeWithinZone);

  let result =
    ALPHABET[longitudeZone] +
    ALPHABET[latitudeZone] +
    DEGREE_ALPHABET[longitudeDegree] +
    DEGREE_ALPHABET[latitudeDegree];

  if (precision > 0) {
    const scale = 10 ** Math.max(0, precision - 2);
    const divisor = precision === 1 ? 10 : 1 / scale;
    const longitudeMinutes = (longitudeWithinZone - longitudeDegree) * 60;
    const latitudeMinutes = (latitudeWithinZone - latitudeDegree) * 60;
    const longitudeDigits = Math.floor(longitudeMinutes / divisor + 1e-10);
    const latitudeDigits = Math.floor(latitudeMinutes / divisor + 1e-10);
    result += String(longitudeDigits).padStart(precision, "0");
    result += String(latitudeDigits).padStart(precision, "0");
  }
  return result;
}

export function decodeGeoref(value) {
  const source = String(value).toUpperCase().replace(/\s+/g, "");
  const match = source.match(/^([A-HJ-NP-Z]{4})(\d*)$/);
  if (!match || match[2].length % 2 !== 0 || match[2].length > 10) {
    throw new Error("Invalid GEOREF coordinate.");
  }

  const [longitudeZone, latitudeZone, longitudeDegree, latitudeDegree] =
    [...match[1]].map((letter, index) => {
      const alphabet = index < 2 ? ALPHABET : DEGREE_ALPHABET;
      return alphabet.indexOf(letter);
    });
  if (
    longitudeZone < 0 ||
    longitudeZone > 23 ||
    latitudeZone < 0 ||
    latitudeZone > 11 ||
    longitudeDegree < 0 ||
    latitudeDegree < 0
  ) {
    throw new Error("Invalid GEOREF grid letters.");
  }

  const precision = match[2].length / 2;
  const longitudeDigits = match[2].slice(0, precision);
  const latitudeDigits = match[2].slice(precision);
  const stepMinutes = precision === 0 ? 60 : 10 ** (2 - precision);
  const longitudeMinutes =
    precision === 0 ? 0 : Number(longitudeDigits) * stepMinutes;
  const latitudeMinutes =
    precision === 0 ? 0 : Number(latitudeDigits) * stepMinutes;
  if (longitudeMinutes >= 60 || latitudeMinutes >= 60) {
    throw new Error("Invalid GEOREF minute value.");
  }

  return {
    ...validatePoint(
      -90 +
        latitudeZone * 15 +
        latitudeDegree +
        (latitudeMinutes + stepMinutes / 2) / 60,
      -180 +
        longitudeZone * 15 +
        longitudeDegree +
        (longitudeMinutes + stepMinutes / 2) / 60,
    ),
    precision,
    cellDegrees: stepMinutes / 60,
  };
}
