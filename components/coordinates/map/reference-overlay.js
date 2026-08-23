const APP_BASE_URL = import.meta.env.BASE_URL;
const BOUNDARIES_URL = `${APP_BASE_URL}map-data/world-boundaries.geojson`;
const LABELS_URL = `${APP_BASE_URL}map-data/world-labels.geojson`;
const COUNTRY_LABEL_MINIMUM_DISTANCE_METRES = 1_200_000;

function cityMaximumDistance(rank) {
  if (rank <= 0) return 20_000_000;
  if (rank === 1) return 12_000_000;
  if (rank === 2) return 6_000_000;
  return 3_000_000;
}

function labelGraphic(Cesium, properties) {
  const isCountry = properties.kind === "country";
  const maximumDistance = isCountry
    ? 30_000_000
    : cityMaximumDistance(properties.rank);

  return {
    distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
      isCountry ? COUNTRY_LABEL_MINIMUM_DISTANCE_METRES : 0,
      maximumDistance,
    ),
    fillColor: Cesium.Color.WHITE.withAlpha(isCountry ? 0.78 : 0.95),
    font: isCountry
      ? "600 12px Inter, sans-serif"
      : "700 12px Inter, sans-serif",
    outlineColor: Cesium.Color.fromCssColorString("#101713"),
    outlineWidth: 3,
    pixelOffset: new Cesium.Cartesian2(7, -8),
    scaleByDistance: new Cesium.NearFarScalar(
      100_000,
      1,
      maximumDistance,
      0.7,
    ),
    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
    text: isCountry ? properties.name.toUpperCase() : properties.name,
  };
}

function pointGraphic(Cesium, properties) {
  if (properties.kind === "country") return undefined;

  return {
    color: Cesium.Color.fromCssColorString("#f4f7f5").withAlpha(0.9),
    distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
      0,
      cityMaximumDistance(properties.rank),
    ),
    outlineColor: Cesium.Color.fromCssColorString("#17201b"),
    outlineWidth: 1,
    pixelSize: properties.rank <= 1 ? 5 : 4,
  };
}

async function loadLabels(Cesium) {
  const response = await fetch(LABELS_URL);
  if (!response.ok) {
    throw new Error(`Reference labels failed to load (${response.status}).`);
  }

  const geoJson = await response.json();
  const dataSource = new Cesium.CustomDataSource(
    "convert-natural-earth-labels",
  );

  for (const feature of geoJson.features) {
    const [longitude, latitude] = feature.geometry.coordinates;
    const properties = feature.properties;

    dataSource.entities.add({
      label: labelGraphic(Cesium, properties),
      point: pointGraphic(Cesium, properties),
      position: Cesium.Cartesian3.fromDegrees(longitude, latitude, 150),
    });
  }

  return dataSource;
}

export async function addReferenceOverlay(Cesium, viewer) {
  const [boundaries, labels] = await Promise.all([
    Cesium.GeoJsonDataSource.load(BOUNDARIES_URL, {
      clampToGround: false,
      stroke: Cesium.Color.WHITE.withAlpha(0.58),
      strokeWidth: 1,
    }),
    loadLabels(Cesium),
  ]);

  boundaries.name = "convert-natural-earth-boundaries";
  await viewer.dataSources.add(boundaries);
  await viewer.dataSources.add(labels);
}
