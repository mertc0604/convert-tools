import { affineUnit, unitCategory } from "../unit-definition.js";

export const TEMPERATURE = unitCategory(
  "temperature",
  "Sıcaklık",
  "celsius",
  "fahrenheit",
  [
    affineUnit("celsius", "Celsius", "°C", "1", "0"),
    affineUnit("kelvin", "Kelvin", "K", "1", "-273.15"),
    affineUnit("fahrenheit", "Fahrenheit", "°F", [5, 9], [-160, 9]),
    affineUnit("rankine", "Rankine", "°R", [5, 9], "-273.15"),
  ],
);
