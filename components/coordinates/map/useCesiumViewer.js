"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createCesiumViewer,
  createMeasurementDataSource,
  fitMeasurement,
  renderMeasurement,
} from "./cesium-adapter";

const CESIUM_MODULE_URL = "/cesium/index.js";

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ??
    false;
}

export default function useCesiumViewer({
  start,
  end,
  points,
  labels,
}) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const dataSourceRef = useRef(null);
  const cesiumRef = useRef(null);
  const positionsRef = useRef([]);
  const latestRef = useRef({ start, end, points, labels });
  const previousPointsRef = useRef(null);
  const [phase, setPhase] = useState("loading");

  useEffect(() => {
    latestRef.current = { start, end, points, labels };
  }, [end, labels, points, start]);

  const updateMap = useCallback((shouldFit) => {
    const Cesium = cesiumRef.current;
    const viewer = viewerRef.current;
    const dataSource = dataSourceRef.current;
    if (!Cesium || !viewer || !dataSource || viewer.isDestroyed()) return;

    const latest = latestRef.current;
    const positions = renderMeasurement(
      Cesium,
      dataSource,
      {
        start: latest.start,
        end: latest.end,
        points: latest.points,
      },
      latest.labels,
    );
    positionsRef.current = positions;
    viewer.scene.requestRender();

    if (shouldFit && positions.length > 0) {
      fitMeasurement(
        Cesium,
        viewer,
        positions,
        prefersReducedMotion() ? 0 : 0.7,
      );
    }
  }, []);

  useEffect(() => {
    let disposed = false;
    let pendingViewer = null;

    async function initialise() {
      try {
        window.CESIUM_BASE_URL = "/cesium/";
        const Cesium = await import(
          /* @vite-ignore */ CESIUM_MODULE_URL
        );
        if (disposed || !containerRef.current) return;

        pendingViewer = await createCesiumViewer(
          Cesium,
          containerRef.current,
        );
        const dataSource = createMeasurementDataSource(Cesium);
        await pendingViewer.dataSources.add(dataSource);

        if (disposed) {
          if (!pendingViewer.isDestroyed()) pendingViewer.destroy();
          return;
        }

        cesiumRef.current = Cesium;
        viewerRef.current = pendingViewer;
        dataSourceRef.current = dataSource;
        previousPointsRef.current = latestRef.current.points;
        updateMap(true);
        setPhase("ready");
      } catch (error) {
        if (pendingViewer && !pendingViewer.isDestroyed()) {
          pendingViewer.destroy();
        }
        if (!disposed) {
          console.error("Cesium map initialization failed.", error);
          setPhase("error");
        }
      }
    }

    initialise();

    return () => {
      disposed = true;
      const viewer = viewerRef.current ?? pendingViewer;
      if (viewer && !viewer.isDestroyed()) viewer.destroy();
      viewerRef.current = null;
      dataSourceRef.current = null;
      cesiumRef.current = null;
      positionsRef.current = [];
    };
  }, [updateMap]);

  useEffect(() => {
    if (phase !== "ready") return;
    const shouldFit = previousPointsRef.current !== points;
    previousPointsRef.current = points;
    updateMap(shouldFit);
  }, [end, labels, phase, points, start, updateMap]);

  const fitPath = useCallback(() => {
    const Cesium = cesiumRef.current;
    const viewer = viewerRef.current;
    if (!Cesium || !viewer || viewer.isDestroyed()) return;
    fitMeasurement(
      Cesium,
      viewer,
      positionsRef.current,
      prefersReducedMotion() ? 0 : 0.7,
    );
  }, []);

  return {
    containerRef,
    fitPath,
    phase,
  };
}
