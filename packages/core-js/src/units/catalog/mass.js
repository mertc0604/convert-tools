import { linearUnit, unitCategory } from "../unit-definition.js";

export const MASS = unitCategory(
  "mass",
  "Kütle",
  "kilogram",
  "pound",
  [
    linearUnit("milligram", "Miligram", "mg", "0.000001"),
    linearUnit("gram", "Gram", "g", "0.001"),
    linearUnit("kilogram", "Kilogram", "kg", "1"),
    linearUnit("tonne", "Metrik ton", "t", "1000"),
    linearUnit("ounce", "Ons", "oz", "0.028349523125"),
    linearUnit(
      "pound",
      "Pound",
      "lb",
      "0.45359237",
      "Uluslararası avoirdupois pound, tam",
    ),
  ],
);
