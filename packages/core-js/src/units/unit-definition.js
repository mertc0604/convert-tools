import { toRational } from "../exact/rational.js";

function createUnit(id, label, symbol, scale, offset, detail) {
  return Object.freeze({
    id,
    label,
    symbol,
    scale: toRational(scale),
    offset: toRational(offset),
    ...(detail ? { detail } : {}),
  });
}

export function linearUnit(id, label, symbol, scale, detail) {
  return createUnit(id, label, symbol, scale, "0", detail);
}

export function unitCategory(id, label, defaultFrom, defaultTo, units) {
  return Object.freeze({
    id,
    label,
    defaultFrom,
    defaultTo,
    units: Object.freeze([...units]),
  });
}
