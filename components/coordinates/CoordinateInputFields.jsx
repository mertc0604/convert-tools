import TextField from "../common/TextField";

export default function CoordinateInputFields({
  format,
  values,
  setValue,
  text,
}) {
  if (format === "dd") {
    return (
      <div className="field-grid two">
        <TextField
          id="dd-lat"
          label={text.latitude}
          value={values.ddLat}
          onChange={(value) => setValue("ddLat", value)}
          placeholder="39.933365"
          inputMode="decimal"
        />
        <TextField
          id="dd-lon"
          label={text.longitude}
          value={values.ddLon}
          onChange={(value) => setValue("ddLon", value)}
          placeholder="32.859742"
          inputMode="decimal"
        />
      </div>
    );
  }

  if (format === "dms" || format === "ddm") {
    return (
      <div className="field-grid two">
        <TextField
          id={`${format}-lat`}
          label={text.latitude}
          value={values[`${format}Lat`]}
          onChange={(value) => setValue(`${format}Lat`, value)}
          placeholder={
            format === "dms" ? `39°56'00.114"N` : `39°56.0019'N`
          }
        />
        <TextField
          id={`${format}-lon`}
          label={text.longitude}
          value={values[`${format}Lon`]}
          onChange={(value) => setValue(`${format}Lon`, value)}
          placeholder={
            format === "dms" ? `032°51'35.071"E` : `032°51.5845'E`
          }
        />
      </div>
    );
  }

  if (format === "utm") {
    return (
      <div className="field-grid four">
        <TextField
          id="utm-zone"
          label={text.zone}
          value={values.zone}
          onChange={(value) => setValue("zone", value)}
          placeholder="36"
          inputMode="numeric"
        />
        <label className="field" htmlFor="utm-hemisphere">
          <span>{text.hemisphere}</span>
          <select
            id="utm-hemisphere"
            value={values.hemisphere}
            onChange={(event) => setValue("hemisphere", event.target.value)}
          >
            <option value="N">N</option>
            <option value="S">S</option>
          </select>
        </label>
        <TextField
          id="utm-easting"
          label={text.easting}
          value={values.easting}
          onChange={(value) => setValue("easting", value)}
          placeholder="488015.988"
          inputMode="decimal"
        />
        <TextField
          id="utm-northing"
          label={text.northing}
          value={values.northing}
          onChange={(value) => setValue("northing", value)}
          placeholder="4420370.844"
          inputMode="decimal"
        />
      </div>
    );
  }

  const placeholders = {
    mgrs: "36S VK 88015 20370",
    gars: "426LV22",
    georef: "QJCK51585600",
  };
  return (
    <TextField
      id={`${format}-coordinate`}
      label={text.coordinateValue}
      value={values[format]}
      onChange={(value) => setValue(format, value)}
      placeholder={placeholders[format]}
    />
  );
}
