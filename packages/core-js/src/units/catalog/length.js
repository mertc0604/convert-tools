import { linearUnit, unitCategory } from "../unit-definition.js";

export const LENGTH = unitCategory(
  "length",
  "Uzunluk",
  "nautical-mile",
  "metre",
  [
    linearUnit("millimetre", "Milimetre", "mm", "0.001"),
    linearUnit("centimetre", "Santimetre", "cm", "0.01"),
    linearUnit("metre", "Metre", "m", "1", "SI temel uzunluk birimi"),
    linearUnit("kilometre", "Kilometre", "km", "1000"),
    linearUnit("inch", "İnç", "in", "0.0254", "Uluslararası inç, tam"),
    linearUnit("foot", "Ayak", "ft", "0.3048", "Uluslararası ayak, tam"),
    linearUnit("yard", "Yarda", "yd", "0.9144", "Uluslararası yarda, tam"),
    linearUnit("mile", "Mil", "mi", "1609.344", "Kara mili, tam"),
    linearUnit(
      "nautical-mile",
      "Deniz mili",
      "NM",
      "1852",
      "Uluslararası deniz mili, tam",
    ),
  ],
);
