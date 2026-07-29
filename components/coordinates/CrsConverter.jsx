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

  function runTransform(event) {
    event?.preventDefault();
    try {
      setResult(transformCrs(source, target, x, y));
      setError("");
      setCopied(false);
    } catch {
      setError(text.crsInvalid);
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
    } catch {
      setError(text.crsInvalid);
    }
  }

  return (
    <form className="crs-form" onSubmit={runTransform}>
      <div className="field-grid two">
        <TextField
          id="source-crs"
          label={text.sourceCrs}
          value={source}
          onChange={setSource}
          placeholder="EPSG:4326"
        />
        <TextField
          id="target-crs"
          label={text.targetCrs}
          value={target}
          onChange={setTarget}
          placeholder="EPSG:3857"
        />
      </div>
      <div className="field-grid two">
        <TextField
          id="source-x"
          label="X"
          value={x}
          onChange={setX}
          placeholder="32.859742"
          inputMode="decimal"
        />
        <TextField
          id="source-y"
          label="Y"
          value={y}
          onChange={setY}
          placeholder="39.933365"
          inputMode="decimal"
        />
      </div>
      <button className="primary-button" type="submit">
        {text.transform}
      </button>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {!error && (
        <article className="crs-result" aria-live="polite">
          <div>
            <span>
              {result.source} → {result.target}
            </span>
            <button
              type="button"
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
