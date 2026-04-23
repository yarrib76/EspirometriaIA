const REQUIRED_FIELDS = [
  "Edad",
  "Genero",
  "Altura_cm",
  "Peso_kg",
  "FVC",
  "FEV1",
  "Fumador",
];

function validate(payload) {
  const missing = REQUIRED_FIELDS.filter((field) => payload[field] === undefined || payload[field] === "");
  if (missing.length > 0) {
    return { valid: false, error: `Faltan campos obligatorios: ${missing.join(", ")}` };
  }

  const normalized = {
    Edad: Number(payload.Edad),
    Genero: String(payload.Genero),
    Altura_cm: Number(payload.Altura_cm),
    Peso_kg: Number(payload.Peso_kg),
    FVC: Number(payload.FVC),
    FEV1: Number(payload.FEV1),
    Fumador: Number(payload.Fumador),
  };

  const invalidNumeric = Object.entries(normalized)
    .filter(([key, value]) => key !== "Genero" && Number.isNaN(value))
    .map(([key]) => key);
  if (invalidNumeric.length > 0) {
    return { valid: false, error: `Los siguientes campos deben ser numéricos: ${invalidNumeric.join(", ")}` };
  }

  if (!["M", "F"].includes(normalized.Genero)) {
    return { valid: false, error: "Genero debe ser 'M' o 'F'." };
  }

  if (![0, 1].includes(normalized.Fumador)) {
    return { valid: false, error: "Fumador debe ser 0 o 1." };
  }

  return { valid: true, payload: normalized };
}

module.exports = { validate, REQUIRED_FIELDS };
