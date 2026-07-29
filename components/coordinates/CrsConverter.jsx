"use client";

import { useState } from "react";
import { transformCrs } from "@convert-tools/core/geodesy";
import { copyText } from "../common/clipboard";
import TextField from "../common/TextField";
import { COPY } from "../config";

const CRS_EXAMPLES = [
  {
    label: "4326 → 3857",
    source: "EPSG:4326",
    target: "EPSG:3857",
    x: "32.859742",
    y: "39.933365",
  },
  {
    label: "4326 → UTM 36N",
    source: "EPSG:4326",
    target: "EPSG:32636",
    x: "32.859742",
    y: "39.933365",
  },
  {
    label: "4326 → UPS North",
    source: "EPSG:4326",
    target: "EPSG:5041",
    x: "0",
    y: "85",
  },
];

export default function CrsConverter({ language }) {
  const text = COPY[language];
  const [source, setSource] = useState("EPSG:4326");
  const [target, setTarget] = useState("EPSG:3857");
  const [x, setX] = useState("32.859742");
  const [y, setY] = useState("39.933365");
  const [result, setResult] = useState(() =>
    transformCrs("EPSG:4326", "EPSG:3857", "32.859742", "39.933365"),
  );
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [isCurrent, setIsCurrent] = useState(true);

  function runTransform(event) {
    event?.preventDefault();
    try {
      setResult(transformCrs(source, target, x, y));
      setError("");
      setCopied(false);
      setIsCurrent(true);
    } catch {
      setError(text.crsInvalid);
      setIsCurrent(false);
    }
  }

  function reverseResult() {
    if (error || !isCurrent) return;
    try {
      const nextSource = target;
      const nextTarget = source;
      const nextX = String(result.x);
      const nextY = String(result.y);
      const nextResult = transformCrs(
        nextSource,
        nextTarget,
        nextX,
        nextY,
      );
      setSource(nextSource);
      setTarget(nextTarget);
      setX(nextX);
      setY(nextY);
      setResult(nextResult);
      setError("");
      setCopied(false);
      setIsCurrent(true);
    } catch {
      setError(text.crsInvalid);
      setIsCurrent(false);
    }
  }

  function applyExample(example) {
    setSource(example.source);
    setTarget(example.target);
    setX(example.x);
    setY(example.y);
    try {
      setResult(
        transformCrs(
          example.source,
          example.target,
          example.x,
          example.y,
        ),
      );
      setError("");
      setCopied(false);
      setIsCurrent(true);
    } catch {
      setError(text.crsInvalid);
      setIsCurrent(false);
    }
  }

  return (
    <form className="crs-form" onSubmit={runTransform}>
      <div className="field-grid two">
        <TextField
          id="source-crs"
          label={text.sourceCrs}
          value={source}
          onChange={(value) => {
            setSource(value);
            setCopied(false);
            setIsCurrent(false);
          }}
          placeholder="EPSG:4326"
        />
        <TextField
          id="target-crs"
          label={text.targetCrs}
          value={target}
          onChange={(value) => {
            setTarget(value);
            setCopied(false);
            setIsCurrent(false);
          }}
          placeholder="EPSG:3857"
        />
      </div>
      <div className="field-grid two">
        <TextField
          id="source-x"
          label="X"
          value={x}
          onChange={(value) => {
            setX(value);
            setCopied(false);
            setIsCurrent(false);
          }}
          placeholder="32.859742"
          inputMode="decimal"
        />
        <TextField
          id="source-y"
          label="Y"
          value={y}
          onChange={(value) => {
            setY(value);
            setCopied(false);
            setIsCurrent(false);
          }}
          placeholder="39.933365"
          inputMode="decimal"
        />
      </div>
      <div className="crs-actions">
        <button className="primary-button" type="submit">
          {text.transform}
        </button>
        <button
          className="secondary-button"
          type="button"
          onClick={reverseResult}
          disabled={Boolean(error) || !isCurrent}
        >
          {text.swapCrs}
        </button>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {!error && isCurrent && (
        <article className="crs-result" aria-live="polite">
          <div>
            <span>
              {result.source} → {result.target}
            </span>
            <button
              type="button"
              aria-label={`${text.copy} ${result.target}`}
              onClick={async () => {
                await copyText(`${result.formattedX}, ${result.formattedY}`);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1400);
              }}
            >
              {copied ? text.copied : text.copy}
            </button>
          </div>
          <code>X {result.formattedX}</code>
          <code>Y {result.formattedY}</code>
        </article>
      )}

      <div className="coordinate-examples" aria-label={text.examples}>
        <span>{text.examples}</span>
        {CRS_EXAMPLES.map((example) => (
          <button
            key={example.label}
            type="button"
            onClick={() => applyExample(example)}
          >
            {example.label}
          </button>
        ))}
      </div>
      <p className="axis-note">
        {text.axisNote} {text.availableEpsg}
      </p>
    </form>
  );
}
