import {
  inverseGeodesic,
  measureGeodesicPolyline,
  type GeodesicResult,
} from "@convert-tools/core/geodesy";
import {
  convertLength,
  convertUnits,
  type JsonRational,
  type LengthConversion,
  type UnitConversion,
} from "@convert-tools/core/units";

const unitResult: UnitConversion = convertUnits(
  "1",
  "length",
  "nautical-mile",
  "metre",
);
const exactLength: JsonRational = unitResult.exactValue;
const reversedLength: LengthConversion = convertLength(
  exactLength,
  "metre",
  "nautical-mile",
);
const inverseResult: GeodesicResult = inverseGeodesic(
  { latitude: 39.933365, longitude: 32.859742 },
  { latitude: 41.008238, longitude: 28.978359 },
);
const polylineDistance: number = measureGeodesicPolyline([
  { latitude: 0, longitude: 0 },
  { latitude: 0, longitude: 1 },
]).distanceMetres;

void unitResult;
void exactLength;
void reversedLength;
void inverseResult;
void polylineDistance;
