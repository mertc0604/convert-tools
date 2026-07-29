import {
  ANGLE,
  AREA,
  LENGTH,
  MASS,
  PRESSURE,
  SPEED,
  TEMPERATURE,
} from "./catalog/index.js";

export const UNIT_CATEGORIES = Object.freeze([
  LENGTH,
  SPEED,
  AREA,
  ANGLE,
  MASS,
  PRESSURE,
  TEMPERATURE,
]);

const CATEGORIES_BY_ID = new Map(
  UNIT_CATEGORIES.map((category) => [category.id, category]),
);

export function getCategory(categoryId) {
  return CATEGORIES_BY_ID.get(categoryId);
}

export function getUnit(category, unitId) {
  return category?.units.find((unit) => unit.id === unitId);
}
