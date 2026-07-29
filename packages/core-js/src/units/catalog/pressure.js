import { linearUnit, unitCategory } from "../unit-definition.js";

export const PRESSURE = unitCategory(
  "pressure",
  "Basınç",
  "bar",
  "kilopascal",
  [
    linearUnit("pascal", "Pascal", "Pa", "1"),
    linearUnit("kilopascal", "Kilopascal", "kPa", "1000"),
    linearUnit("hectopascal", "Hektopascal", "hPa", "100"),
    linearUnit("bar", "Bar", "bar", "100000"),
    linearUnit("atmosphere", "Standart atmosfer", "atm", "101325"),
    linearUnit("psi", "Pound/inç kare", "psi", "6894.757293168361336722673"),
  ],
);
