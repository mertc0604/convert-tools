"use client";

import { useState } from "react";
import { inverseGeodesic } from "@convert-tools/core/geodesy";
import { convertLength } from "@convert-tools/core/length";
import { COPY } from "../config";
import TextField from "../common/TextField";

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
];

function convertedDistance(distanceMetres, unit, precision) {
  return convertLength(
    String(distanceMetres),
    "metre",
    unit,
    precision,
  ).value;
}

function calculate(values) {
  const result = inverseGeodesic(
    {
      latitude: values.startLatitude,
      longitude: values.startLongitude,
    },
    {
      latitude: values.endLatitude,
      longitude: values.endLongitude,
    },
  );

  return {
    ...result,
    metres: convertedDistance(result.distanceMetres, "metre", 3),
    kilometres: convertedDistance(result.distanceMetres, "kilometre", 9),
    nauticalMiles: convertedDistance(
      result.distanceMetres,
      "nautical-mile",
      9,
    ),
  };
}

export default function DistanceCalculator({ language }) {
  const text = COPY[language];
  const [values, setValues] = useState(EXAMPLES[0]);
  const [result, setResult] = useState(() => calculate(EXAMPLES[0]));
  const [error, setError] = useState("");

  function setValue(key, value) {
    setValues((current) => ({ ...current, [key]: value }));
    setResult(null);
    setError("");
  }

  function measure(event) {
    event?.preventDefault();
    try {
      setResult(calculate(values));
      setError("");
    } catch {
      setResult(null);
      setError(text.distanceInvalid);
    }
  }

  function applyExample(example) {
    setValues(example);
    setResult(calculate(example));
    setError("");
  }

  return (
    <form className="crs-form" onSubmit={measure}>
      <div className="distance-point-heading">{text.startPoint}</div>
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

      <div className="distance-point-heading">{text.endPoint}</div>
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

      <button className="primary-button" type="submit">
        {text.measure}
      </button>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {!error && result && (
        <>
          <div className="coordinate-results distance-results" aria-live="polite">
            <article className="coordinate-result">
              <div>
                <span>{text.metres}</span>
              </div>
              <code>{result.metres} m</code>
            </article>
            <article className="coordinate-result">
              <div>
                <span>{text.kilometres}</span>
              </div>
              <code>{result.kilometres} km</code>
            </article>
            <article className="coordinate-result">
              <div>
                <span>{text.nauticalMiles}</span>
              </div>
              <code>{result.nauticalMiles} NM</code>
            </article>
            <article className="coordinate-result">
              <div>
                <span>{text.bearings}</span>
              </div>
              <code>
                {result.azimuthDefined
                  ? `${result.initialBearingDegrees.toFixed(6)}° → ${result.finalBearingDegrees.toFixed(6)}°`
                  : "—"}
              </code>
            </article>
          </div>
          <p className="axis-note">{text.distanceModel}</p>
        </>
      )}

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
    </form>
  );
}
