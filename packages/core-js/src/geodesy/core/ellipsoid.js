import { DEGREE, RADIAN } from "./numbers.js";

export const WGS84 = Object.freeze({
  id: "WGS84",
  a: 6378137,
  f: 1 / 298.257223563,
  b: 6356752.314245179,
  utmScale: 0.9996,
  upsScale: 0.994,
});

const eccentricitySquared = WGS84.f * (2 - WGS84.f);
const eccentricity = Math.sqrt(eccentricitySquared);

export const WGS84_DERIVED = Object.freeze({
  e: eccentricity,
  e2: eccentricitySquared,
  ep2: eccentricitySquared / (1 - eccentricitySquared),
});

export function meridionalArc(latitudeRadians) {
  const { a } = WGS84;
  const { e2 } = WGS84_DERIVED;
  const e4 = e2 * e2;
  const e6 = e4 * e2;

  return (
    a *
    ((1 - e2 / 4 - (3 * e4) / 64 - (5 * e6) / 256) * latitudeRadians -
      ((3 * e2) / 8 + (3 * e4) / 32 + (45 * e6) / 1024) *
        Math.sin(2 * latitudeRadians) +
      ((15 * e4) / 256 + (45 * e6) / 1024) *
        Math.sin(4 * latitudeRadians) -
      ((35 * e6) / 3072) * Math.sin(6 * latitudeRadians))
  );
}

export function conformalTangent(tangentLatitude) {
  const { e } = WGS84_DERIVED;
  const hypotenuse = Math.hypot(1, tangentLatitude);
  const eccentricTerm = Math.sinh(
    e * Math.atanh((e * tangentLatitude) / hypotenuse),
  );
  return (
    Math.hypot(1, eccentricTerm) * tangentLatitude -
    eccentricTerm * hypotenuse
  );
}

export function inverseConformalTangent(conformalTangentValue) {
  const { e2 } = WGS84_DERIVED;
  const oneMinusE2 = 1 - e2;
  const e = Math.sqrt(e2);
  let tangentLatitude =
    Math.abs(conformalTangentValue) > 70
      ? conformalTangentValue * Math.exp(e * Math.atanh(e))
      : conformalTangentValue / oneMinusE2;

  for (let iteration = 0; iteration < 6; iteration += 1) {
    const estimated = conformalTangent(tangentLatitude);
    const delta =
      ((conformalTangentValue - estimated) *
        (1 + oneMinusE2 * tangentLatitude * tangentLatitude)) /
      (oneMinusE2 *
        Math.hypot(1, tangentLatitude) *
        Math.hypot(1, estimated));
    tangentLatitude += delta;
    if (Math.abs(delta) < 1e-14 * Math.max(1, Math.abs(tangentLatitude))) break;
  }
  return tangentLatitude;
}

export { DEGREE, RADIAN };
