"use client";

import { useMemo, useState } from "react";
import {
  UNIT_CATEGORIES,
  convertUnits,
  getCategory,
} from "@convert-tools/core/units";
import {
  CATEGORY_LABELS,
  COPY,
  UNIT_EXAMPLES,
  UNIT_LABELS,
} from "../config";
import { copyText } from "../common/clipboard";

function unitLabel(unit, language) {
  return language === "en" ? UNIT_LABELS.en[unit.id] ?? unit.label : unit.label;
}

function categoryLabel(category, language) {
  return language === "en"
    ? CATEGORY_LABELS.en[category.id] ?? category.label
    : category.label;
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
  const initialCategory = getCategory("length");
  const [categoryId, setCategoryId] = useState("length");
  const [fromId, setFromId] = useState(initialCategory.defaultFrom);
  const [toId, setToId] = useState(initialCategory.defaultTo);
  const [input, setInput] = useState("1");
  const [copied, setCopied] = useState(false);
  const category = getCategory(categoryId);
  const fromUnit = category.units.find((unit) => unit.id === fromId);
  const toUnit = category.units.find((unit) => unit.id === toId);

  const conversion = useMemo(() => {
    try {
      return {
        ...convertUnits(input, categoryId, fromId, toId, 24),
        error: "",
      };
    } catch {
      return { error: text.invalid };
    }
  }, [input, categoryId, fromId, toId, text.invalid]);

  const examples = useMemo(
    () =>
      UNIT_EXAMPLES[categoryId].map((example) => ({
        ...example,
        output: convertUnits(
          example.value,
          categoryId,
          example.from,
          example.to,
          10,
        ).value,
      })),
    [categoryId],
  );

  function selectCategory(nextId) {
    const next = getCategory(nextId);
    setCategoryId(nextId);
    setFromId(next.defaultFrom);
    setToId(next.defaultTo);
    setInput("1");
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

        <div className="category-tabs" role="tablist" aria-label={text.unitTitle}>
          {UNIT_CATEGORIES.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={categoryId === item.id}
              className={categoryId === item.id ? "active" : ""}
              onClick={() => selectCategory(item.id)}
            >
              {categoryLabel(item, language)}
            </button>
          ))}
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
              units={category.units}
              language={language}
              onChange={setFromId}
            />
          </div>

          <button
            className="swap-button"
            type="button"
            onClick={() => {
              setFromId(toId);
              setToId(fromId);
              setCopied(false);
            }}
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
              units={category.units}
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
      </section>

      <section className="examples-section" aria-labelledby="unit-examples">
        <div>
          <h2 id="unit-examples">{text.examples}</h2>
          <p>{text.examplesHint}</p>
        </div>
        <div className="example-grid">
          {examples.map((example) => {
            const source = category.units.find(
              (unit) => unit.id === example.from,
            );
            const target = category.units.find(
              (unit) => unit.id === example.to,
            );
            return (
              <button
                key={`${example.value}-${example.from}-${example.to}`}
                type="button"
                onClick={() => {
                  setInput(example.value);
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
