"use client";

import { useMemo } from "react";
import { COPY } from "../../config";
import useCesiumViewer from "./useCesiumViewer";

function coordinateText(point) {
  if (!point) return "—";
  return `${point.latitude.toFixed(8)}°, ${point.longitude.toFixed(8)}°`;
}

export default function GeodesicMap({
  language,
  start,
  end,
  points,
  distanceMetres,
}) {
  const text = COPY[language];
  const labels = useMemo(
    () => ({ start: "A", end: "B" }),
    [],
  );
  const { containerRef, fitPath, phase } = useCesiumViewer({
    start,
    end,
    points,
    labels,
  });
  const hasMeasurement =
    Boolean(start && end) && Array.isArray(points) && points.length > 0;
  const summary = hasMeasurement
    ? `${text.mapStart}: ${coordinateText(start)}. ${
        text.mapEnd
      }: ${coordinateText(end)}. ${text.mapDistance}: ${Number(
        distanceMetres,
      ).toFixed(3)} m.`
    : text.mapEmpty;

  return (
    <section
      className="geodesic-map-panel"
      aria-labelledby="geodesic-map-title"
    >
      <div className="geodesic-map-heading">
        <div>
          <h2 id="geodesic-map-title">{text.mapTitle}</h2>
          <p>{text.mapVisualOnly}</p>
        </div>
        <button
          className="secondary-button map-fit-button"
          type="button"
          onClick={fitPath}
          disabled={phase !== "ready" || !hasMeasurement}
        >
          {text.mapFit}
        </button>
      </div>

      <div className="map-model-badges" aria-label={text.mapModel}>
        <span>WGS 84</span>
        <span>{text.mapNoTerrain}</span>
      </div>

      <div className="geodesic-map-frame">
        <div className="geodesic-map-image" role="img" aria-label={summary}>
          <div
            className="geodesic-map-canvas"
            ref={containerRef}
            aria-hidden="true"
          />
        </div>
        {phase === "loading" && (
          <div className="map-state-overlay" aria-hidden="true">
            {text.mapLoading}
          </div>
        )}
        {phase === "error" && (
          <div className="map-state-overlay map-error">
            {text.mapUnavailable}
          </div>
        )}
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {phase === "loading"
          ? text.mapLoading
          : phase === "error"
            ? text.mapUnavailable
            : summary}
      </p>
    </section>
  );
}
