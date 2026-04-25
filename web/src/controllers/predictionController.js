const predictionRequest = require("../models/predictionRequest");
const mlApiClient = require("../services/mlApiClient");
const mlTrainingClient = require("../services/mlTrainingClient");
const openaiPdfExtractor = require("../services/openaiPdfExtractor");
const { renderHomePage } = require("../views/homeView");

async function renderHome(req, res) {
  res.type("html").send(renderHomePage());
}

async function health(req, res) {
  res.json({ status: "ok", web: "up", inference_mode: "internal_python" });
}

async function predict(req, res) {
  const validation = predictionRequest.validate(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  try {
    const result = await mlApiClient.predict(validation.payload);
    return res.json(result);
  } catch (error) {
    return res.status(error.statusCode || 502).json({
      error: error.message || "No se pudo obtener una predicción desde la inferencia interna de Python.",
    });
  }
}

async function extractPdf(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: "Debes subir un archivo PDF." });
  }

  try {
    const result = await openaiPdfExtractor.extractFieldsFromPdf(req.file);
    return res.json(result);
  } catch (error) {
    return res.status(error.statusCode || 502).json({
      error: error.message || "No se pudo extraer información desde el PDF.",
    });
  }
}

async function trainModel(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: "Debes subir un archivo CSV para entrenar." });
  }

  try {
    const result = await mlTrainingClient.uploadDatasetAndTrain(req.file);
    return res.json(result);
  } catch (error) {
    return res.status(error.statusCode || 502).json({
      error: error.message || "No se pudo completar el entrenamiento del modelo.",
    });
  }
}

async function latestTraining(req, res) {
  try {
    const result = await mlTrainingClient.getLatestTraining();
    return res.json(result);
  } catch (error) {
    return res.status(error.statusCode || 502).json({
      error: error.message || "No se pudo obtener el ultimo entrenamiento.",
    });
  }
}

module.exports = {
  renderHome,
  health,
  predict,
  extractPdf,
  trainModel,
  latestTraining,
};
