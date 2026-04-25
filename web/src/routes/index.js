const express = require("express");
const multer = require("multer");
const predictionController = require("../controllers/predictionController");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const isPdf =
      file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf");
    callback(isPdf ? null : new Error("Solo se permiten archivos PDF."), isPdf);
  },
});
const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const isCsv = file.mimetype === "text/csv" || file.originalname.toLowerCase().endsWith(".csv");
    callback(isCsv ? null : new Error("Solo se permiten archivos CSV."), isCsv);
  },
});

router.get("/", predictionController.renderHome);
router.get("/health", predictionController.health);
router.post("/predict", predictionController.predict);
router.post("/extract-pdf", upload.single("spirometryPdf"), predictionController.extractPdf);
router.post("/train", csvUpload.single("datasetCsv"), predictionController.trainModel);
router.get("/training/latest", predictionController.latestTraining);
router.get("/training/report-image", predictionController.reportImage);

module.exports = router;
