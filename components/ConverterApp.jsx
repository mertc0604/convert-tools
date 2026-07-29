"use client";

import { useEffect, useState } from "react";
import { COPY } from "./config";
import CoordinateConverter from "./coordinates/CoordinateConverter";
import UnitConverter from "./units/UnitConverter";

export default function ConverterApp() {
  const [language, setLanguage] = useState("tr");
  const [tool, setTool] = useState("units");
  const text = COPY[language];

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <main className="page-shell">
      <header className="site-header">
        <a className="brand" href="#converter" aria-label="Convert">
          <span className="brand-symbol" aria-hidden="true">
            ↔
          </span>
          <span>CONVERT</span>
        </a>
        <div className="language-switch" aria-label={text.language}>
          <button
            type="button"
            className={language === "tr" ? "active" : ""}
            onClick={() => setLanguage("tr")}
            aria-pressed={language === "tr"}
            aria-label="Türkçe"
          >
            TR
          </button>
          <button
            type="button"
            className={language === "en" ? "active" : ""}
            onClick={() => setLanguage("en")}
            aria-pressed={language === "en"}
            aria-label="English"
          >
            EN
          </button>
        </div>
      </header>

      <nav className="tool-switch" id="converter" aria-label="Convert">
        <button
          type="button"
          className={tool === "units" ? "active" : ""}
          aria-pressed={tool === "units"}
          onClick={() => setTool("units")}
        >
          {text.units}
        </button>
        <button
          type="button"
          className={tool === "coordinates" ? "active" : ""}
          aria-pressed={tool === "coordinates"}
          onClick={() => setTool("coordinates")}
        >
          {text.coordinates}
        </button>
      </nav>

      {tool === "units" ? (
        <UnitConverter language={language} />
      ) : (
        <CoordinateConverter language={language} />
      )}
    </main>
  );
}
