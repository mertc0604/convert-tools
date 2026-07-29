import { linearUnit, unitCategory } from "../unit-definition.js";

export const AREA = unitCategory(
  "area",
  "Alan",
  "square-nautical-mile",
  "square-kilometre",
  [
    linearUnit("square-metre", "Metrekare", "m²", "1"),
    linearUnit("hectare", "Hektar", "ha", "10000"),
    linearUnit("square-kilometre", "Kilometrekare", "km²", "1000000"),
    linearUnit("square-foot", "Ayak kare", "ft²", "0.09290304"),
    linearUnit("acre", "Akre", "ac", "4046.8564224"),
    linearUnit(
      "square-nautical-mile",
      "Deniz mili kare",
      "NM²",
      "3429904",
    ),
  ],
);
