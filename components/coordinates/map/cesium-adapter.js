const ROUTE_HEIGHT_METRES = 100;
const MINIMUM_CAMERA_RANGE_METRES = 120_000;

function cartesianPosition(Cesium, point) {
  return Cesium.Cartesian3.fromDegrees(
    point.longitude,
    point.latitude,
    ROUTE_HEIGHT_METRES,
  );
}

function pointGraphic(Cesium, color) {
  return {
    color,
    disableDepthTestDistance: Number.POSITIVE_INFINITY,
    outlineColor: Cesium.Color.WHITE,
    outlineWidth: 2,
    pixelSize: 11,
  };
}

function pointLabel(Cesium, text) {
  return {
    backgroundColor: Cesium.Color.fromCssColorString("#17201b").withAlpha(0.9),
    disableDepthTestDistance: Number.POSITIVE_INFINITY,
    fillColor: Cesium.Color.WHITE,
    font: "700 13px Inter, sans-serif",
    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
    pixelOffset: new Cesium.Cartesian2(0, -27),
    showBackground: true,
    text,
    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
  };
}

export async function createCesiumViewer(Cesium, container) {
  const imageryProvider =
    await Cesium.TileMapServiceImageryProvider.fromUrl(
      Cesium.buildModuleUrl("Assets/Textures/NaturalEarthII"),
    );

  const viewer = new Cesium.Viewer(container, {
    animation: false,
    baseLayer: new Cesium.ImageryLayer(imageryProvider),
    baseLayerPicker: false,
    fullscreenButton: false,
    geocoder: false,
    homeButton: false,
    infoBox: false,
    navigationHelpButton: false,
    scene3DOnly: true,
    sceneModePicker: false,
    selectionIndicator: false,
    terrainProvider: new Cesium.EllipsoidTerrainProvider(),
    timeline: false,
  });

  viewer.scene.requestRenderMode = true;
  viewer.scene.maximumRenderTimeChange = Number.POSITIVE_INFINITY;
  viewer.scene.globe.depthTestAgainstTerrain = false;
  viewer.canvas.tabIndex = -1;
  viewer.canvas.setAttribute("aria-hidden", "true");

  return viewer;
}

export function createMeasurementDataSource(Cesium) {
  return new Cesium.CustomDataSource("convert-geodesic-measurement");
}

export function renderMeasurement(
  Cesium,
  dataSource,
  { start, end, points },
  labels,
) {
  dataSource.entities.removeAll();

  if (!start || !end || !Array.isArray(points) || points.length === 0) {
    return [];
  }

  const positions = points.map((point) => cartesianPosition(Cesium, point));
  const samePoint =
    start.latitude === end.latitude && start.longitude === end.longitude;
  const startColor = Cesium.Color.fromCssColorString("#176b46");
  const endColor = Cesium.Color.fromCssColorString("#b86620");

  dataSource.entities.add({
    id: "measurement-start",
    position: cartesianPosition(Cesium, start),
    point: pointGraphic(Cesium, startColor),
    label: pointLabel(
      Cesium,
      samePoint ? `${labels.start} / ${labels.end}` : labels.start,
    ),
  });

  if (!samePoint) {
    dataSource.entities.add({
      id: "measurement-end",
      position: cartesianPosition(Cesium, end),
      point: pointGraphic(Cesium, endColor),
      label: pointLabel(Cesium, labels.end),
    });
  }

  if (positions.length > 1 && !samePoint) {
    dataSource.entities.add({
      id: "measurement-route",
      polyline: {
        arcType: Cesium.ArcType.NONE,
        depthFailMaterial: Cesium.Color.fromCssColorString("#f5f7f6"),
        material: Cesium.Color.fromCssColorString("#176b46"),
        positions,
        width: 4,
      },
    });
  }

  return positions;
}

export function fitMeasurement(
  Cesium,
  viewer,
  positions,
  duration = 0.7,
) {
  if (!viewer || viewer.isDestroyed() || positions.length === 0) return;

  const sphere = Cesium.BoundingSphere.fromPoints(positions);
  const range = Math.max(
    MINIMUM_CAMERA_RANGE_METRES,
    sphere.radius * 2.8,
  );

  viewer.camera.flyToBoundingSphere(sphere, {
    duration,
    offset: new Cesium.HeadingPitchRange(
      0,
      -Math.PI / 2,
      range,
    ),
  });
}
