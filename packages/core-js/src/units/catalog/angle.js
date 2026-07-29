import { linearUnit, unitCategory } from "../unit-definition.js";

export const ANGLE = unitCategory(
  "angle",
  "Açı",
  "degree",
  "nato-mil",
  [
    linearUnit("degree", "Derece", "°", "1"),
    linearUnit("gon", "Gon / grad", "gon", "0.9"),
    linearUnit("nato-mil", "NATO mil", "mil", "0.05625", "6400 mil = 360°"),
    linearUnit(
      "wp-mil",
      "6000'lik mil",
      "mil (6000)",
      "0.06",
      "6000 mil = 360°; NATO mil ile karıştırmayın",
    ),
    linearUnit("minute-angle", "Açı dakikası", "MOA", [1, 60]),
    linearUnit("arc-second", "Açı saniyesi", "arcsec", [1, 3600]),
  ],
);
