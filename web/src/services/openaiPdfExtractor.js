const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const OPENAI_FILES_API_URL = "https://api.openai.com/v1/files";
const OPENAI_MODEL = process.env.OPENAI_PDF_MODEL || "gpt-4o-mini";
const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const EXTRACTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "Edad",
    "Genero",
    "Altura_cm",
    "Peso_kg",
    "FVC",
    "FEV1",
    "FVC_pct_pred",
    "FEV1_pct_pred",
    "Post_BD_FVC",
    "Post_BD_FEV1",
    "Fumador",
    "Calidad_Espirometria",
    "warnings",
  ],
  properties: {
    Edad: { anyOf: [{ type: "integer" }, { type: "null" }] },
    Genero: { anyOf: [{ type: "string", enum: ["M", "F"] }, { type: "null" }] },
    Altura_cm: { anyOf: [{ type: "number" }, { type: "null" }] },
    Peso_kg: { anyOf: [{ type: "number" }, { type: "null" }] },
    FVC: { anyOf: [{ type: "number" }, { type: "null" }] },
    FEV1: { anyOf: [{ type: "number" }, { type: "null" }] },
    FVC_pct_pred: { anyOf: [{ type: "number" }, { type: "null" }] },
    FEV1_pct_pred: { anyOf: [{ type: "number" }, { type: "null" }] },
    Post_BD_FVC: { anyOf: [{ type: "number" }, { type: "null" }] },
    Post_BD_FEV1: { anyOf: [{ type: "number" }, { type: "null" }] },
    Fumador: { anyOf: [{ type: "integer", enum: [0, 1] }, { type: "null" }] },
    Calidad_Espirometria: { anyOf: [{ type: "integer", enum: [0, 1] }, { type: "null" }] },
    warnings: {
      type: "array",
      items: { type: "string" },
    },
  },
};

function ensureApiKey() {
  if (!process.env.OPENAI_API_KEY) {
    const error = new Error("Falta OPENAI_API_KEY en web/.env.");
    error.statusCode = 500;
    throw error;
  }
}

function getResponseText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text;
  }

  const output = Array.isArray(data.output) ? data.output : [];
  const texts = [];

  for (const item of output) {
    const content = Array.isArray(item.content) ? item.content : [];
    for (const piece of content) {
      if (typeof piece.text === "string" && piece.text.trim()) {
        texts.push(piece.text);
      }
    }
  }

  return texts.join("\n").trim();
}

function normalizeExtractedFields(fields) {
  const normalized = {
    Edad: fields.Edad === null ? "" : String(fields.Edad),
    Genero: fields.Genero === null ? "" : String(fields.Genero),
    Altura_cm: fields.Altura_cm === null ? "" : String(fields.Altura_cm),
    Peso_kg: fields.Peso_kg === null ? "" : String(fields.Peso_kg),
    FVC: fields.FVC === null ? "" : String(fields.FVC),
    FEV1: fields.FEV1 === null ? "" : String(fields.FEV1),
    FVC_pct_pred: fields.FVC_pct_pred === null ? "" : String(fields.FVC_pct_pred),
    FEV1_pct_pred: fields.FEV1_pct_pred === null ? "" : String(fields.FEV1_pct_pred),
    Post_BD_FVC: fields.Post_BD_FVC === null ? "" : String(fields.Post_BD_FVC),
    Post_BD_FEV1: fields.Post_BD_FEV1 === null ? "" : String(fields.Post_BD_FEV1),
    Fumador: fields.Fumador === null ? "" : String(fields.Fumador),
    Calidad_Espirometria: fields.Calidad_Espirometria === null ? "" : String(fields.Calidad_Espirometria),
  };

  const missing = Object.entries(normalized)
    .filter(([, value]) => value === "")
    .map(([key]) => key);

  return {
    fields: normalized,
    missingFields: missing,
  };
}

function isPdf(file) {
  return file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf");
}

function isImage(file) {
  return IMAGE_MIME_TYPES.has(file.mimetype);
}

async function buildPdfInputContent(file) {
  const uploadForm = new FormData();
  uploadForm.append("purpose", "user_data");
  uploadForm.append(
    "file",
    new Blob([file.buffer], { type: file.mimetype || "application/pdf" }),
    file.originalname
  );

  const uploadResponse = await fetch(OPENAI_FILES_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: uploadForm,
  });

  const uploadData = await uploadResponse.json().catch(() => ({}));
  if (!uploadResponse.ok) {
    const message =
      uploadData.error?.message || uploadData.error || "OpenAI no pudo subir el archivo.";
    const error = new Error(message);
    error.statusCode = uploadResponse.status;
    throw error;
  }

  const fileId = uploadData.id;
  if (!fileId) {
    const error = new Error("OpenAI no devolvió un file_id para el archivo.");
    error.statusCode = 502;
    throw error;
  }

  return {
    type: "input_file",
    file_id: fileId,
  };
}

function buildImageInputContent(file) {
  const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
  return {
    type: "input_image",
    image_url: dataUrl,
  };
}

async function buildClinicalFileContent(file) {
  if (isPdf(file)) {
    return buildPdfInputContent(file);
  }

  if (isImage(file)) {
    return buildImageInputContent(file);
  }

  const error = new Error("Formato no soportado. Subí un PDF o una imagen JPG, PNG o WEBP.");
  error.statusCode = 400;
  throw error;
}

async function extractFieldsFromPdf(file) {
  ensureApiKey();
  const clinicalFileContent = await buildClinicalFileContent(file);

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "Extrae únicamente variables clínicas para un formulario de espirometría. " +
                "Devuelve solo JSON que cumpla el schema. Si un dato no está presente o no es confiable, usa null y agrega una advertencia en warnings. " +
                "Normaliza Genero a 'M' o 'F'. Normaliza Fumador a 0 o 1. " +
                "Si el informe permite inferir que la maniobra es aceptable, usa Calidad_Espirometria=1; si explícitamente no es aceptable, usa 0; si no se informa, usa null. " +
                "Nunca uses columnas LLN, LIN, límite inferior, Teór., teórico, predicho, Z-score o %Teór. como valores medidos de FVC o FEV1. " +
                "No inventes valores.",
            },
          ],
        },
        {
          role: "user",
          content: [
            clinicalFileContent,
            {
              type: "input_text",
              text:
                "Lee esta espirometría en PDF o imagen y completa Edad, Genero, Altura_cm, Peso_kg, FVC, FEV1, FVC_pct_pred, FEV1_pct_pred, Post_BD_FVC, Post_BD_FEV1, Fumador y Calidad_Espirometria. " +
                "Para FVC y FEV1 usa el valor medido basal/prebroncodilatador, preferentemente la columna Best o el mejor valor entre PRE #1, PRE #2 y PRE #3. " +
                "Para FVC_pct_pred y FEV1_pct_pred usa el porcentaje del predicho asociado al valor basal/pre, normalmente la columna %Teór. o %Pred. " +
                "Para Post_BD_FVC y Post_BD_FEV1 usa exclusivamente la columna POST o postbroncodilatación, no las columnas PRE. " +
                "Si aparecen columnas LLN/LIN, Teór./Predicho, Best, PRE y POST, interpreta LLN/LIN como límite inferior normal y Teór./Predicho como referencia; no los cargues como FVC ni FEV1. " +
                "Si no existen valores postbroncodilatador, devuelve null en esos campos.",
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "spirometry_file_extraction",
          strict: true,
          schema: EXTRACTION_SCHEMA,
        },
      },
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      data.error?.message || data.error || "OpenAI no pudo procesar el archivo de espirometría.";
    const error = new Error(message);
    error.statusCode = response.status;
    throw error;
  }

  const responseText = getResponseText(data);
  if (!responseText) {
    const error = new Error("OpenAI no devolvió un cuerpo JSON utilizable.");
    error.statusCode = 502;
    throw error;
  }

  let extracted;
  try {
    extracted = JSON.parse(responseText);
  } catch (error) {
    const parseError = new Error(`No se pudo parsear la respuesta estructurada de OpenAI: ${error.message}`);
    parseError.statusCode = 502;
    throw parseError;
  }

  const normalized = normalizeExtractedFields(extracted);

  return {
    extracted: normalized.fields,
    missingFields: normalized.missingFields,
    warnings: Array.isArray(extracted.warnings) ? extracted.warnings : [],
    rawModelResponse: extracted,
  };
}

module.exports = { extractFieldsFromPdf };
