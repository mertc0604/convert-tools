export default function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  inputMode = "text",
}) {
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete="off"
        spellCheck="false"
      />
    </label>
  );
}
