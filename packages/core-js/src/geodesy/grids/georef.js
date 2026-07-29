import { pointFromValues, validatePoint } from "../core/numbers.js";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DEGREE_ALPHABET = ALPHABET.slice(0, 15);

export function encodeGeoref(longitudeValue, latitudeValue, precision = 4) {
  const { latitude, longitude } = pointFromValues(latitudeValue, longitudeValue);
  if (!Number.isInteger(precision) || precision < 0 || precision > 5) {
    throw new Error("GEOREF precision must be between 0 and 5.");
  }

  const safeLongitude = longitude === 180 ? -180 : longitude;
  const shiftedLongitude = safeLongitude + 180;
  const shiftedLatitude = latitude + 90;
  const longitudeZone = Math.floor(shiftedLongitude / 15);
  const latitudeZone = Math.min(11, Math.floor(shiftedLatitude / 15));
  const longitudeWithinZone = shiftedLongitude - longitudeZone * 15;
  const latitudeWithinZone = shiftedLatitude - latitudeZone * 15;
  const longitudeDegree = Math.floor(longitudeWithinZone);
  const latitudeDegree = Math.min(14, Math.floor(latitudeWithinZone));

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
    const maximumDigits = Math.floor(60 / divisor) - 1;
    const longitudeDigits = Math.min(
      maximumDigits,
      Math.floor(longitudeMinutes / divisor + 1e-10),
    );
    const latitudeDigits = Math.min(
      maximumDigits,
      Math.floor(latitudeMinutes / divisor + 1e-10),
    );
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
