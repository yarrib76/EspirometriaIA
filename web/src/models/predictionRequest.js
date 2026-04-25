const REQUIRED_FIELDS = [
  "Edad",
  "Genero",
  "Altura_cm",
  "Peso_kg",
  "FVC",
  "FEV1",
  "FVC_pct_pred",
  "FEV1_pct_pred",
];

function calculateRatio(fev1, fvc) {
  if (fvc <= 0) {
    throw new Error("FVC debe ser mayor a cero.");
  }
  return Number((fev1 / fvc).toFixed(4));
}

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
    FVC_pct_pred: Number(payload.FVC_pct_pred),
    FEV1_pct_pred: Number(payload.FEV1_pct_pred),
    Post_BD_FVC:
      payload.Post_BD_FVC === undefined || payload.Post_BD_FVC === "" ? null : Number(payload.Post_BD_FVC),
    Post_BD_FEV1:
      payload.Post_BD_FEV1 === undefined || payload.Post_BD_FEV1 === "" ? null : Number(payload.Post_BD_FEV1),
    Fumador: payload.Fumador === undefined || payload.Fumador === "" ? 0 : Number(payload.Fumador),
    Calidad_Espirometria:
      payload.Calidad_Espirometria === undefined || payload.Calidad_Espirometria === ""
        ? 1
        : Number(payload.Calidad_Espirometria),
  };

  const invalidNumeric = Object.entries(normalized)
    .filter(([, value]) => value !== null && Number.isNaN(value))
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

  if (![0, 1].includes(normalized.Calidad_Espirometria)) {
    return { valid: false, error: "Calidad_Espirometria debe ser 0 o 1." };
  }

  const bronchodilatadorRealizado = normalized.Post_BD_FVC !== null || normalized.Post_BD_FEV1 !== null ? 1 : 0;
  const postFvc = normalized.Post_BD_FVC ?? normalized.FVC;
  const postFev1 = normalized.Post_BD_FEV1 ?? normalized.FEV1;

  normalized.Post_BD_FVC = postFvc;
  normalized.Post_BD_FEV1 = postFev1;
  normalized.Broncodilatador_Realizado = bronchodilatadorRealizado;
  normalized.FEV1_FVC = calculateRatio(normalized.FEV1, normalized.FVC);
  normalized.Post_BD_FEV1_FVC = calculateRatio(postFev1, postFvc);
  normalized.BD_FEV1_Delta_ml = Number(((postFev1 - normalized.FEV1) * 1000).toFixed(1));
  normalized.BD_FEV1_Delta_pct = Number((((postFev1 - normalized.FEV1) / normalized.FEV1) * 100).toFixed(2));

  return { valid: true, payload: normalized };
}

module.exports = { validate, REQUIRED_FIELDS };
