import { linearUnit, unitCategory } from "../unit-definition.js";

export const SPEED = unitCategory(
  "speed",
  "Hız",
  "knot",
  "metre-second",
  [
    linearUnit("metre-second", "Metre/saniye", "m/s", "1"),
    linearUnit("kilometre-hour", "Kilometre/saat", "km/h", [5, 18]),
    linearUnit(
      "knot",
      "Knot",
      "kt",
      [463, 900],
      "1 NM/saat; SI karşılığı tam rasyoneldir",
    ),
    linearUnit("mile-hour", "Mil/saat", "mph", "0.44704"),
    linearUnit("foot-second", "Ayak/saniye", "ft/s", "0.3048"),
  ],
);
