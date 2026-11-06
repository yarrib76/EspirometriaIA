const express = require("express");
const multer = require("multer");
const predictionController = require("../controllers/predictionController");
const aprioriController = require("../sites/apriori/controller");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const lowerName = file.originalname.toLowerCase();
    const allowedMimeTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
    const isSupported =
      allowedMimeTypes.has(file.mimetype) ||
      lowerName.endsWith(".pdf") ||
      lowerName.endsWith(".jpg") ||
      lowerName.endsWith(".jpeg") ||
      lowerName.endsWith(".png") ||
      lowerName.endsWith(".webp");
    callback(isSupported ? null : new Error("Solo se permiten archivos PDF o imágenes JPG, PNG o WEBP."), isSupported);
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

router.get("/", aprioriController.renderHome);
router.post("/api/apriori/run", aprioriController.run);
router.get("/api/apriori/files", aprioriController.files);
router.get("/api/apriori/preview", aprioriController.preview);
router.get("/api/apriori/download", aprioriController.download);
router.get("/api/apriori/status", aprioriController.status);
router.get("/api/apriori/settings", aprioriController.settings);
router.put("/api/apriori/settings", aprioriController.saveSettings);
router.delete("/api/apriori/settings", aprioriController.resetSettings);
router.get("/api/apriori/runs", aprioriController.runs);
router.get("/api/apriori/run-detail", aprioriController.runDetail);
router.get("/api/apriori/run-zip", aprioriController.runZip);
router.post("/api/apriori/select-support", aprioriController.selectSupport);
router.get("/api/apriori/orders", aprioriController.orders);
router.get("/api/apriori/orders/:id/items", aprioriController.orderDetail);
router.post("/api/apriori/activate-run", aprioriController.activateRun);
router.get("/api/apriori/orders/:id/recommendations", aprioriController.recommend);
router.get("/api/apriori/orders/:id/recommendations/products", aprioriController.recommendationProducts);
router.get("/espirometria", predictionController.renderSpirometryHome);
router.get("/health", predictionController.health);
router.post("/predict", predictionController.predict);
router.post("/extract-pdf", upload.single("spirometryPdf"), predictionController.extractPdf);
router.post("/train", csvUpload.single("datasetCsv"), predictionController.trainModel);
router.get("/training/latest", predictionController.latestTraining);
router.get("/training/report-image", predictionController.reportImage);

module.exports = router;
