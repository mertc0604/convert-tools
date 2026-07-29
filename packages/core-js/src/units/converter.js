import {
  addRational,
  divideRational,
  exactFractionDigits,
  formatRational,
  multiplyRational,
  parseDecimal,
  subtractRational,
} from "../exact/rational.js";
import { getCategory, getUnit } from "./registry.js";

export function convertUnits(
  input,
  categoryId,
  fromId,
  toId,
  precision = 24,
) {
  const category = getCategory(categoryId);
  if (!category) {
    throw new Error(`Unknown unit category: ${categoryId}.`);
  }

  const from = getUnit(category, fromId);
  const to = getUnit(category, toId);
  if (!from || !to) {
    throw new Error(`Unknown unit in category ${categoryId}.`);
  }

  const source = parseDecimal(input);
  const base = addRational(
    multiplyRational(source, from.scale),
    from.offset,
  );
  const result = divideRational(
    subtractRational(base, to.offset),
    to.scale,
  );
  const factor = divideRational(from.scale, to.scale);
  const requiredFractionDigits = exactFractionDigits(result);

  return {
    rational: result,
    value: formatRational(result, precision),
    exactDecimal:
      requiredFractionDigits !== null &&
      requiredFractionDigits <= precision,
    terminatingDecimal: requiredFractionDigits !== null,
    requiredFractionDigits,
    factor: formatRational(factor, precision),
    from,
    to,
  };
}

export function convertToAll(input, categoryId, fromId, precision = 18) {
  const category = getCategory(categoryId);
  if (!category) {
    throw new Error(`Unknown unit category: ${categoryId}.`);
  }

  return category.units
    .filter((unit) => unit.id !== fromId)
    .map((unit) => ({
      ...unit,
      ...convertUnits(input, categoryId, fromId, unit.id, precision),
    }));
}
