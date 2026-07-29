export interface Rational {
  readonly n: bigint;
  readonly d: bigint;
}

export interface JsonRational {
  readonly numerator: string;
  readonly denominator: string;
}

export type RationalComponent = string | number | bigint;
export type RationalInput =
  | string
  | number
  | bigint
  | Rational
  | JsonRational
  | readonly [RationalComponent, RationalComponent];

export interface UnitDefinition {
  readonly id: string;
  readonly label: string;
  readonly symbol: string;
  readonly scale: Rational;
  readonly offset: Rational;
  readonly detail?: string;
}

export interface UnitCategory {
  readonly id: string;
  readonly label: string;
  readonly defaultFrom: string;
  readonly defaultTo: string;
  readonly units: readonly UnitDefinition[];
}

export interface UnitConversion {
  readonly rational: Rational;
  readonly value: string;
  readonly exactValue: JsonRational;
  readonly exactMetres: JsonRational | null;
  readonly exactFactor: JsonRational;
  readonly exactDecimal: boolean;
  readonly rounded: boolean;
  readonly terminatingDecimal: boolean;
  readonly requiredFractionDigits: number | null;
  readonly precision: number;
  readonly roundingMode: "HALF_UP";
  readonly factor: string;
  readonly from: UnitDefinition;
  readonly to: UnitDefinition;
}

export interface LengthConversion extends UnitConversion {
  readonly exactMetres: JsonRational;
}

export interface GeoPoint {
  readonly latitude: number | string;
  readonly longitude: number | string;
}

export interface NumericGeoPoint {
  readonly latitude: number;
  readonly longitude: number;
}

export interface Ellipsoid {
  readonly id: string;
  readonly a: number;
  readonly b: number;
  readonly f: number;
}

export interface GeodesicOptions {
  readonly ellipsoid?: Ellipsoid;
  readonly tolerance?: number;
  readonly maxIterations?: number;
}

export interface GeodesicResult {
  readonly distanceMetres: number;
  readonly initialBearingDegrees: number | null;
  readonly finalBearingDegrees: number | null;
  readonly azimuthDefined: boolean;
  readonly ambiguous: boolean;
  readonly ellipsoid: string;
  readonly algorithm: "ellipsoidal";
  readonly solver:
    | "identity"
    | "vincenty-inverse"
    | "vincenty-direct-shooting";
  readonly iterations: number;
}

export interface DirectGeodesicResult extends NumericGeoPoint {
  readonly finalBearingDegrees: number;
  readonly ellipsoid: string;
  readonly algorithm: "vincenty-direct";
  readonly iterations: number;
}

export interface PolylineMeasurement {
  readonly distanceMetres: number;
  readonly segmentCount: number;
  readonly ellipsoid: string;
  readonly algorithm: "ellipsoidal-segments";
  readonly segments: readonly GeodesicResult[];
}

export const UNIT_CATEGORIES: readonly UnitCategory[];
export const WGS84: Readonly<Ellipsoid & {
  readonly utmScale: number;
  readonly upsScale: number;
}>;

export function parseDecimal(input: string | number | bigint): Rational;
export function toRational(input: RationalInput): Rational;
export function rationalToJson(input: RationalInput): JsonRational;
export function formatRational(
  value: RationalInput,
  maximumFractionDigits?: number,
): string;
export function getCategory(categoryId: string): UnitCategory | undefined;
export function getUnit(
  category: UnitCategory | undefined,
  unitId: string,
): UnitDefinition | undefined;
export function convertUnits(
  input: RationalInput,
  categoryId: string,
  fromId: string,
  toId: string,
  precision?: number,
): UnitConversion;
export function convertLength(
  input: RationalInput,
  fromId: string,
  toId: string,
  precision?: number,
): LengthConversion;
export function convertToAll(
  input: RationalInput,
  categoryId: string,
  fromId: string,
  precision?: number,
): readonly UnitConversion[];

export function inverseGeodesic(
  start: GeoPoint,
  end: GeoPoint,
  options?: GeodesicOptions,
): GeodesicResult;
export function directGeodesic(
  start: GeoPoint,
  initialBearingDegrees: number | string,
  distanceMetres: number | string,
  options?: GeodesicOptions,
): DirectGeodesicResult;
export function measureGeodesicPolyline(
  points: readonly GeoPoint[],
  options?: GeodesicOptions,
): PolylineMeasurement;

export function fromDecimalDegrees(
  latitude: string | number,
  longitude: string | number,
): NumericGeoPoint;
export function fromDms(
  latitude: string,
  longitude: string,
): NumericGeoPoint;
export function fromDdm(
  latitude: string,
  longitude: string,
): NumericGeoPoint;
export function fromMgrs(value: string): NumericGeoPoint;
export function fromGars(value: string): NumericGeoPoint;
export function fromGeoref(value: string): NumericGeoPoint;
export function fromUtmUps(
  zone: string | number,
  hemisphere: "N" | "S" | string,
  easting: string | number,
  northing: string | number,
): NumericGeoPoint;

export function coordinateResults(
  point: GeoPoint,
  mgrsPrecision?: number,
): {
  readonly latitude: number;
  readonly longitude: number;
  readonly dd: string;
  readonly dms: string;
  readonly ddm: string;
  readonly mgrs: string;
  readonly utmUps: string;
  readonly gars: string;
  readonly georef: string;
  readonly resolution: {
    readonly dd: {
      readonly kind: "angular-rounding";
      readonly stepDegrees: number;
      readonly maximumErrorDegrees: number;
    };
    readonly dms: {
      readonly kind: "angular-rounding";
      readonly stepDegrees: number;
      readonly maximumErrorDegrees: number;
    };
    readonly ddm: {
      readonly kind: "angular-rounding";
      readonly stepDegrees: number;
      readonly maximumErrorDegrees: number;
    };
    readonly mgrs: {
      readonly kind: "grid-cell";
      readonly cellMetres: number;
      readonly decodedPoint: "cell-center";
      readonly maximumCenterOffsetMetres: number;
    };
    readonly utmUps: {
      readonly kind: "grid-rounding";
      readonly stepMetres: number;
      readonly maximumErrorMetresPerAxis: number;
    };
    readonly gars: {
      readonly kind: "angular-cell";
      readonly cellDegrees: number;
      readonly decodedPoint: "cell-center";
      readonly maximumCenterOffsetDegreesPerAxis: number;
    };
    readonly georef: {
      readonly kind: "angular-cell";
      readonly cellDegrees: number;
      readonly decodedPoint: "cell-center";
      readonly maximumCenterOffsetDegreesPerAxis: number;
    };
  };
  readonly sourceKind: string;
  readonly sourceCellMetres?: number;
  readonly sourceCellDegrees?: number;
};

export function transformCrs(
  source: string | number,
  target: string | number,
  x: string | number,
  y: string | number,
): {
  readonly source: string;
  readonly target: string;
  readonly x: number;
  readonly y: number;
  readonly formattedX: string;
  readonly formattedY: string;
};

export const SUPPORTED_CRS: readonly string[];
export function normalizeEpsg(value: string | number): string;

export function encodeMgrs(
  latitude: number,
  longitude: number,
  precision?: number,
): string;
export function decodeMgrs(value: string, center?: boolean): NumericGeoPoint;
export function encodeGars(longitude: number, latitude: number): string;
export function decodeGars(value: string): NumericGeoPoint;
export function encodeGeoref(
  longitude: number,
  latitude: number,
  precision?: number,
): string;
export function decodeGeoref(value: string): NumericGeoPoint;
export function formatDms(
  value: number,
  axis: "latitude" | "longitude",
  secondDigits?: number,
): string;
export function formatDdm(
  value: number,
  axis: "latitude" | "longitude",
  minuteDigits?: number,
): string;

export function utmUpsForward(
  latitude: number,
  longitude: number,
): {
  readonly zone: number;
  readonly north: boolean;
  readonly easting: number;
  readonly northing: number;
};
export function utmUpsInverse(
  zone: number,
  north: boolean,
  easting: number,
  northing: number,
): NumericGeoPoint;
