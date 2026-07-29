"use client";

import { useState } from "react";
import { sampleGeodesicPath } from "@convert-tools/core/geodesy";
import { convertLength } from "@convert-tools/core/length";
import { COPY } from "../config";
import TextField from "../common/TextField";
import GeodesicMap from "./map/GeodesicMap";

const EXAMPLES = [
  {
    label: { tr: "Ankara → İstanbul", en: "Ankara → Istanbul" },
    startLatitude: "39.933365",
    startLongitude: "32.859742",
    endLatitude: "41.008238",
    endLongitude: "28.978359",
  },
  {
    label: { tr: "Antimeridyen", en: "Antimeridian" },
    startLatitude: "10",
    startLongitude: "179.9",
    endLatitude: "10",
    endLongitude: "-179.9",
  },
  {
    label: { tr: "Kutup yakını", en: "Near the pole" },
    startLatitude: "89.9",
    startLongitude: "0",
    endLatitude: "89.9",
    endLongitude: "90",
  },
  {
    label: {
      tr: "Ekvator → Kuzey Kutbu",
      en: "Equator → North Pole",
    },
    startLatitude: "0",
    startLongitude: "0",
    endLatitude: "90",
    endLongitude: "0",
  },
];

function convertedDistance(distanceMetres, unit, precision) {
  return convertLength(
    String(distanceMetres),
    "metre",
    unit,
    precision,
  ).value;
}

function calculateMeasurement(values) {
  const path = sampleGeodesicPath(
    {
      latitude: values.startLatitude,
      longitude: values.startLongitude,
    },
    {
      latitude: values.endLatitude,
      longitude: values.endLongitude,
    },
    {
      maxSegmentMetres: 25_000,
      maxPoints: 2_049,
    },
  );
  const start = path.points[0];
  const end = path.points[path.points.length - 1];

  return {
    start,
    end,
    path,
    metres: convertedDistance(path.distanceMetres, "metre", 3),
    kilometres: convertedDistance(path.distanceMetres, "kilometre", 9),
    nauticalMiles: convertedDistance(
      path.distanceMetres,
      "nautical-mile",
      9,
    ),
  };
}

export default function DistanceCalculator({ language }) {
  const text = COPY[language];
  const [values, setValues] = useState(EXAMPLES[0]);
  const [measurement, setMeasurement] = useState(() =>
    calculateMeasurement(EXAMPLES[0]),
  );
  const [error, setError] = useState(false);
  const [status, setStatus] = useState("ready");

  function setValue(key, value) {
    setValues((current) => ({ ...current, [key]: value }));
    setMeasurement(null);
    setError(false);
    setStatus("cleared");
  }

  function measure(event) {
    event?.preventDefault();
    try {
      setMeasurement(calculateMeasurement(values));
      setError(false);
      setStatus("ready");
    } catch {
      setMeasurement(null);
      setError(true);
      setStatus("error");
    }
  }

  function applyExample(example) {
    setValues(example);
    setMeasurement(calculateMeasurement(example));
    setError(false);
    setStatus("ready");
  }

  return (
    <>
      <div className="measurement-workspace">
        <div className="measurement-controls">
          <form className="crs-form distance-form" onSubmit={measure}>
            <fieldset className="distance-fieldset">
              <legend>{text.startPoint}</legend>
              <div className="field-grid two">
                <TextField
                  id="distance-start-latitude"
                  label={text.startLatitude}
                  value={values.startLatitude}
                  onChange={(value) => setValue("startLatitude", value)}
                  inputMode="decimal"
                />
                <TextField
                  id="distance-start-longitude"
                  label={text.startLongitude}
                  value={values.startLongitude}
                  onChange={(value) => setValue("startLongitude", value)}
                  inputMode="decimal"
                />
              </div>
            </fieldset>

            <fieldset className="distance-fieldset">
              <legend>{text.endPoint}</legend>
              <div className="field-grid two">
                <TextField
                  id="distance-end-latitude"
                  label={text.endLatitude}
                  value={values.endLatitude}
                  onChange={(value) => setValue("endLatitude", value)}
                  inputMode="decimal"
                />
                <TextField
                  id="distance-end-longitude"
                  label={text.endLongitude}
                  value={values.endLongitude}
                  onChange={(value) => setValue("endLongitude", value)}
                  inputMode="decimal"
                />
              </div>
            </fieldset>

            <div className="distance-form-actions">
              <button className="primary-button" type="submit">
                {text.measure}
              </button>
              <span>{text.coordinateRange}</span>
            </div>
            {error && (
              <p className="form-error" role="alert">
                {text.distanceInvalid}
              </p>
            )}
          </form>

          {!error && measurement && (
            <section
              className="distance-output"
              aria-labelledby="distance-output-title"
            >
              <h2 className="sr-only" id="distance-output-title">
                {text.measurementResult}
              </h2>
              <div className="coordinate-results distance-results">
                <article className="coordinate-result">
                  <div>
                    <span>{text.metres}</span>
                  </div>
                  <code>{measurement.metres} m</code>
                </article>
                <article className="coordinate-result">
                  <div>
                    <span>{text.kilometres}</span>
                  </div>
                  <code>{measurement.kilometres} km</code>
                </article>
                <article className="coordinate-result">
                  <div>
                    <span>{text.nauticalMiles}</span>
                  </div>
                  <code>{measurement.nauticalMiles} NM</code>
                </article>
                <article className="coordinate-result">
                  <div>
                    <span>{text.bearings}</span>
                  </div>
                  <code>
                    {measurement.path.azimuthDefined
                      ? `${measurement.path.initialBearingDegrees.toFixed(6)}° → ${measurement.path.finalBearingDegrees.toFixed(6)}°`
                      : "—"}
                  </code>
                </article>
              </div>
              {measurement.path.ambiguous && (
                <p className="distance-warning" role="note">
                  {text.ambiguousPath}
                </p>
              )}
              <details className="calculation-details">
                <summary>{text.calculationDetails}</summary>
                <dl>
                  <div>
                    <dt>{text.mapModel}</dt>
                    <dd>WGS 84 · {text.shortestGeodesic}</dd>
                  </div>
                  <div>
                    <dt>{text.solver}</dt>
                    <dd>{measurement.path.solver}</dd>
                  </div>
                  <div>
                    <dt>{text.iterations}</dt>
                    <dd>{measurement.path.iterations}</dd>
                  </div>
                  <div>
                    <dt>{text.mapSegments}</dt>
                    <dd>{measurement.path.segmentCount}</dd>
                  </div>
                  <div>
                    <dt>Google Maps</dt>
                    <dd>{text.googleSphereDifference}</dd>
                  </div>
                </dl>
              </details>
              <p className="axis-note">{text.distanceModel}</p>
            </section>
          )}

          <p className="sr-only" role="status" aria-live="polite">
            {status === "ready"
              ? text.measurementReady
              : status === "cleared"
                ? text.measurementCleared
                : ""}
          </p>
        </div>

        <GeodesicMap
          language={language}
          start={measurement?.start ?? null}
          end={measurement?.end ?? null}
          points={measurement?.path.points ?? []}
          distanceMetres={measurement?.path.distanceMetres ?? null}
        />
      </div>

      <div className="coordinate-examples" aria-label={text.examples}>
        <span>{text.examples}</span>
        {EXAMPLES.map((example) => (
          <button
            key={example.label.en}
            type="button"
            onClick={() => applyExample(example)}
          >
            {example.label[language]}
          </button>
        ))}
      </div>
    </>
  );
}
