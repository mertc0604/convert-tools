"use client";

import { useState } from "react";
import {
  coordinateResults,
  fromDecimalDegrees,
  fromDdm,
  fromDms,
  fromGars,
  fromGeoref,
  fromMgrs,
  fromUtmUps,
} from "@convert-tools/core/geodesy";
import { copyText } from "../common/clipboard";
import { COORDINATE_FORMATS, COPY, OUTPUT_FORMATS } from "../config";
import CoordinateInputFields from "./CoordinateInputFields";

const INITIAL_VALUES = {
  ddLat: "39.933365",
  ddLon: "32.859742",
  dmsLat: `39°56'00.114"N`,
  dmsLon: `032°51'35.071"E`,
  ddmLat: `39°56.0019'N`,
  ddmLon: `032°51.5845'E`,
  mgrs: "36S VK 88015 20370",
  zone: "36",
  hemisphere: "N",
  easting: "488015.988",
  northing: "4420370.844",
  gars: "426LV22",
  georef: "QJCK51585600",
};

function compactResolution(value, maximumDigits = 12) {
  return Number(value)
    .toFixed(maximumDigits)
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "");
}

function resolutionLabel(key, resolution, text) {
  if (!resolution) return "";
  if (resolution.kind === "grid-cell") {
    return `${compactResolution(resolution.cellMetres)} m ${text.resolutionCell}`;
  }
  if (resolution.kind === "angular-cell") {
    return `${compactResolution(resolution.cellDegrees * 60)}′ ${text.resolutionCell}`;
  }
  if (resolution.kind === "grid-rounding") {
    return `±${compactResolution(resolution.maximumErrorMetresPerAxis)} m ${text.resolutionMaximum}, ${text.resolutionPerAxis}`;
  }
  if (resolution.kind === "angular-rounding") {
    const multiplier = key === "dms" ? 3600 : key === "ddm" ? 60 : 1;
    const symbol = key === "dms" ? "″" : key === "ddm" ? "′" : "°";
    return `±${compactResolution(
      resolution.maximumErrorDegrees * multiplier,
    )}${symbol} ${text.resolutionMaximum}`;
  }
  return "";
}

export default function PositionConverter({ language }) {
  const text = COPY[language];
  const [format, setFormat] = useState("dd");
  const [precision, setPrecision] = useState("5");
  const [values, setValues] = useState(INITIAL_VALUES);
  const [result, setResult] = useState(() =>
    coordinateResults(fromDecimalDegrees("39.933365", "32.859742"), 5),
  );
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [isCurrent, setIsCurrent] = useState(true);

  function setValue(key, value) {
    setValues((current) => ({ ...current, [key]: value }));
    setError("");
    setCopied("");
    setIsCurrent(false);
  }

  function readPoint() {
    if (format === "dd") return fromDecimalDegrees(values.ddLat, values.ddLon);
    if (format === "dms") return fromDms(values.dmsLat, values.dmsLon);
    if (format === "ddm") return fromDdm(values.ddmLat, values.ddmLon);
    if (format === "mgrs") return fromMgrs(values.mgrs);
    if (format === "utm") {
      return fromUtmUps(
        values.zone,
        values.hemisphere,
        values.easting,
        values.northing,
      );
    }
    if (format === "gars") return fromGars(values.gars);
    return fromGeoref(values.georef);
  }

  function handleConvert(event) {
    event?.preventDefault();
    try {
      setResult(coordinateResults(readPoint(), Number(precision)));
      setError("");
      setCopied("");
      setIsCurrent(true);
    } catch {
      setError(text.coordinateInvalid);
      setCopied("");
      setIsCurrent(false);
    }
  }

  function applyExample(nextFormat, nextValues, point) {
    setFormat(nextFormat);
    setValues((current) => ({ ...current, ...nextValues }));
    setResult(coordinateResults(point, Number(precision)));
    setError("");
    setCopied("");
    setIsCurrent(true);
  }

  async function copyOutput(key, value) {
    if (!isCurrent) return;
    await copyText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(""), 1400);
  }

  const sourceNote =
    result.sourceKind === "point"
      ? text.pointSource
      : `${text.cellSource} ${
          result.sourceCellMetres
            ? `${result.sourceCellMetres} m`
            : `${(result.sourceCellDegrees * 60)
                .toFixed(3)
                .replace(/\.?0+$/, "")}′`
        }`;

  return (
    <>
      <form className="coordinate-form" onSubmit={handleConvert}>
        <div className="coordinate-toolbar">
          <label className="field format-field" htmlFor="coordinate-format">
            <span>{text.inputFormat}</span>
            <select
              id="coordinate-format"
              value={format}
              onChange={(event) => {
                setFormat(event.target.value);
                setError("");
                setCopied("");
                setIsCurrent(false);
              }}
            >
              {COORDINATE_FORMATS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field precision-field" htmlFor="mgrs-precision">
            <span>{text.precision}</span>
            <select
              id="mgrs-precision"
              value={precision}
              onChange={(event) => {
                const next = event.target.value;
                setPrecision(next);
                setCopied("");
                if (isCurrent) {
                  setResult(coordinateResults(result, Number(next)));
                }
              }}
            >
              <option value="5">1 m</option>
              <option value="4">10 m</option>
              <option value="3">100 m</option>
              <option value="2">1 km</option>
              <option value="1">10 km</option>
              <option value="0">100 km</option>
            </select>
          </label>
        </div>

        <CoordinateInputFields
          format={format}
          values={values}
          setValue={setValue}
          text={text}
        />
        <div className="form-actions">
          <button className="primary-button" type="submit">
            {text.convert}
          </button>
          <span>{text.wgs84}</span>
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </form>

      {isCurrent && !error && (
        <>
          <div className="output-heading">
            <h2>{text.outputFormats}</h2>
            <span id="coordinate-source-note">{sourceNote}</span>
          </div>
          <div
            className="coordinate-results"
            aria-live="polite"
            aria-describedby="coordinate-source-note"
          >
            {OUTPUT_FORMATS.map(([key, label]) => (
              <article
                className={`coordinate-result ${key === "gars" ? "area-result" : ""}`}
                key={key}
              >
                <div>
                  <span>{label}</span>
                  <button
                    type="button"
                    aria-label={`${text.copy} ${label}`}
                    onClick={() => copyOutput(key, result[key])}
                  >
                    {copied === key ? text.copied : text.copy}
                  </button>
                </div>
                <code>{result[key]}</code>
                <small className="coordinate-resolution">
                  {resolutionLabel(key, result.resolution?.[key], text)}
                </small>
                {key === "gars" && <small>{text.areaSource}</small>}
              </article>
            ))}
          </div>
        </>
      )}

      <div className="coordinate-examples" aria-label={text.examples}>
        <span>{text.examples}</span>
        <button
          type="button"
          onClick={() =>
            applyExample(
              "dd",
              { ddLat: "39.933365", ddLon: "32.859742" },
              fromDecimalDegrees("39.933365", "32.859742"),
            )
          }
        >
          Ankara · DD
        </button>
        <button
          type="button"
          onClick={() =>
            applyExample(
              "mgrs",
              { mgrs: "38S LC 39187 01405" },
              fromMgrs("38SLC3918701405"),
            )
          }
        >
          Ramadi · MGRS
        </button>
        <button
          type="button"
          onClick={() =>
            applyExample(
              "dd",
              { ddLat: "85", ddLon: "0" },
              fromDecimalDegrees("85", "0"),
            )
          }
        >
          85°N · UPS
        </button>
      </div>
    </>
  );
}
