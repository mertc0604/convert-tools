"use client";

import { useState } from "react";
import { COPY } from "../config";
import CrsConverter from "./CrsConverter";
import DistanceCalculator from "./DistanceCalculator";
import PositionConverter from "./PositionConverter";

export default function CoordinateConverter({ language }) {
  const text = COPY[language];
  const [mode, setMode] = useState("formats");

  return (
    <>
      <section
        className="converter-card coordinate-card"
        aria-labelledby="coordinate-title"
      >
        <div className="card-heading">
          <h1 id="coordinate-title">{text.coordinateTitle}</h1>
          <p>{text.coordinateSubtitle}</p>
        </div>
        <div
          className="subtabs"
          role="tablist"
          aria-label={text.coordinateTitle}
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "formats"}
            className={mode === "formats" ? "active" : ""}
            onClick={() => setMode("formats")}
          >
            {text.positionFormats}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "crs"}
            className={mode === "crs" ? "active" : ""}
            onClick={() => setMode("crs")}
          >
            {text.crs}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "distance"}
            className={mode === "distance" ? "active" : ""}
            onClick={() => setMode("distance")}
          >
            {text.distance}
          </button>
        </div>
        {mode === "formats" ? (
          <PositionConverter language={language} />
        ) : mode === "crs" ? (
          <CrsConverter language={language} />
        ) : (
          <DistanceCalculator language={language} />
        )}
      </section>
      <footer>{text.coordinateFooter}</footer>
    </>
  );
}
