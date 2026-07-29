"use client";

import { useMemo, useState } from "react";
import { convertLength, getCategory } from "@convert-tools/core/length";
import {
  COPY,
  LENGTH_EXAMPLES,
  LENGTH_UNIT_LABELS,
} from "../config";
import { copyText } from "../common/clipboard";

const LENGTH_CATEGORY_ID = "length";
const LENGTH_CATEGORY = getCategory(LENGTH_CATEGORY_ID);

function unitLabel(unit, language) {
  return language === "en"
    ? LENGTH_UNIT_LABELS.en[unit.id] ?? unit.label
    : unit.label;
}

function UnitSelect({ id, label, value, units, language, onChange }) {
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {units.map((unit) => (
          <option key={unit.id} value={unit.id}>
            {unitLabel(unit, language)} ({unit.symbol})
          </option>
        ))}
      </select>
    </label>
  );
}

export default function UnitConverter({ language }) {
  const text = COPY[language];
  const [fromId, setFromId] = useState(LENGTH_CATEGORY.defaultFrom);
  const [toId, setToId] = useState(LENGTH_CATEGORY.defaultTo);
  const [input, setInput] = useState("1");
  const [exactInput, setExactInput] = useState(null);
  const [copied, setCopied] = useState(false);
  const fromUnit = LENGTH_CATEGORY.units.find((unit) => unit.id === fromId);
  const toUnit = LENGTH_CATEGORY.units.find((unit) => unit.id === toId);

  const conversion = useMemo(() => {
    try {
      return {
        ...convertLength(
          exactInput ?? input,
          fromId,
          toId,
          24,
        ),
        error: "",
      };
    } catch {
      return { error: text.invalid };
    }
  }, [input, exactInput, fromId, toId, text.invalid]);

  const examples = useMemo(
    () =>
      LENGTH_EXAMPLES.map((example) => ({
        ...example,
        output: convertLength(
          example.value,
          example.from,
          example.to,
          10,
        ).value,
      })),
    [],
  );

  function swapUnits() {
    if (conversion.error) return;
    setInput(conversion.value);
    setExactInput(conversion.exactValue ?? conversion.rational);
    setFromId(toId);
    setToId(fromId);
    setCopied(false);
  }

  async function handleCopy() {
    if (conversion.error) return;
    await copyText(conversion.value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <>
      <section className="converter-card" aria-labelledby="unit-title">
        <div className="card-heading">
          <h1 id="unit-title">{text.unitTitle}</h1>
          <p>{text.unitSubtitle}</p>
        </div>

        <div className="conversion-layout">
          <div className="conversion-side">
            <label className="value-label" htmlFor="conversion-value">
              {text.value}
            </label>
            <div className="value-field">
              <input
                id="conversion-value"
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  setExactInput(null);
                  setCopied(false);
                }}
                inputMode="decimal"
                spellCheck="false"
                autoComplete="off"
              />
              <span>{fromUnit.symbol}</span>
            </div>
            <UnitSelect
              id="from-unit"
              label={text.from}
              value={fromId}
              units={LENGTH_CATEGORY.units}
              language={language}
              onChange={(nextId) => {
                setFromId(nextId);
                setExactInput(null);
              }}
            />
          </div>

          <button
            className="swap-button"
            type="button"
            onClick={swapUnits}
            disabled={Boolean(conversion.error)}
            aria-label={text.swap}
            title={text.swap}
          >
            ⇄
          </button>

          <div className="conversion-side result-side" aria-live="polite">
            <span className="value-label">{text.result}</span>
            {conversion.error ? (
              <div className="result-error" role="alert">
                {conversion.error}
              </div>
            ) : (
              <div className="result-value">
                <strong>{conversion.value}</strong>
                <span>{toUnit.symbol}</span>
                <button type="button" onClick={handleCopy}>
                  {copied ? text.copied : text.copy}
                </button>
              </div>
            )}
            <UnitSelect
              id="to-unit"
              label={text.to}
              value={toId}
              units={LENGTH_CATEGORY.units}
              language={language}
              onChange={setToId}
            />
          </div>
        </div>

        {!conversion.error && (
          <div className="conversion-meta">
            <span>{conversion.exactDecimal ? text.exact : text.rounded}</span>
            <code>
              {text.rate}: 1 {fromUnit.symbol} = {conversion.factor}{" "}
              {toUnit.symbol}
            </code>
          </div>
        )}
        <p className="swap-precision-note">{text.swapPrecision}</p>
      </section>

      <section className="examples-section" aria-labelledby="unit-examples">
        <div>
          <h2 id="unit-examples">{text.examples}</h2>
          <p>{text.examplesHint}</p>
        </div>
        <div className="example-grid">
          {examples.map((example) => {
            const source = LENGTH_CATEGORY.units.find(
              (unit) => unit.id === example.from,
            );
            const target = LENGTH_CATEGORY.units.find(
              (unit) => unit.id === example.to,
            );
            return (
              <button
                key={`${example.value}-${example.from}-${example.to}`}
                type="button"
                onClick={() => {
                  setInput(example.value);
                  setExactInput(null);
                  setFromId(example.from);
                  setToId(example.to);
                  setCopied(false);
                }}
              >
                <span>
                  {example.value} {source.symbol}
                </span>
                <span aria-hidden="true">→</span>
                <strong>
                  {example.output} {target.symbol}
                </strong>
              </button>
            );
          })}
        </div>
      </section>

      <footer>{text.unitFooter}</footer>
    </>
  );
}
