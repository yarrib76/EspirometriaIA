const fs = require("fs/promises");
const path = require("path");
const { spawn } = require("child_process");

const WEB_DIR = path.resolve(__dirname, "../..");
const PROJECT_ROOT = path.resolve(WEB_DIR, "..");
const ML_DIR = path.resolve(PROJECT_ROOT, "ml");
const RAW_DATA_DIR = path.resolve(ML_DIR, "data", "raw");
const MODELS_DIR = path.resolve(ML_DIR, "models");
const REPORTS_DIR = path.resolve(ML_DIR, "reports");
const DEFAULT_PYTHON = path.resolve(ML_DIR, ".venv", "Scripts", "python.exe");
const PYTHON_BIN = process.env.ML_PYTHON_BIN || DEFAULT_PYTHON;
const TRAIN_MODULE = "src.training.train_baseline";
const DEFAULT_DATASET_NAME = "dataset_espirometria_interpretacion_5000.csv";

function extractJsonObject(text) {
  const trimmed = String(text || "").trim();
  const start = trimmed.lastIndexOf("{");
  if (start === -1) {
    throw new Error("La salida del entrenamiento no contiene JSON.");
  }

  const candidate = trimmed.slice(start);
  return JSON.parse(candidate);
}

async function persistDataset(file) {
  if (!file) {
    throw new Error("Debes adjuntar un dataset CSV.");
  }

  await fs.mkdir(RAW_DATA_DIR, { recursive: true });
  const safeName = file.originalname.toLowerCase().endsWith(".csv") ? DEFAULT_DATASET_NAME : `${DEFAULT_DATASET_NAME}.csv`;
  const outputPath = path.join(RAW_DATA_DIR, safeName);
  await fs.writeFile(outputPath, file.buffer);
  return outputPath;
}

function runTraining(csvPath) {
  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON_BIN, ["-m", TRAIN_MODULE, csvPath], {
      cwd: ML_DIR,
      env: {
        ...process.env,
        TRAIN_VERBOSE: "0",
      },
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(new Error(`No se pudo iniciar Python desde ${PYTHON_BIN}: ${error.message}`));
    });

    child.on("close", (code) => {
      if (code !== 0) {
        const error = new Error(stderr.trim() || "Falló el entrenamiento interno en Python.");
        error.statusCode = 502;
        reject(error);
        return;
      }

      try {
        resolve(extractJsonObject(stdout));
      } catch (error) {
        const parseError = new Error(`La salida del entrenamiento no fue JSON válido: ${error.message}`);
        parseError.statusCode = 502;
        reject(parseError);
      }
    });
  });
}

async function readJsonIfExists(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch (_error) {
    return null;
  }
}

async function loadTrainingReport(reportDir) {
  if (!reportDir) {
    return null;
  }

  const confusionMatrixPath = path.join(reportDir, "confusion_matrix.png");

  return {
    metrics: await readJsonIfExists(path.join(reportDir, "metrics.json")),
    config: await readJsonIfExists(path.join(reportDir, "config.json")),
    artifacts: await readJsonIfExists(path.join(reportDir, "artifacts.json")),
    confusion_matrix_url: `/training/report-image?path=${encodeURIComponent(confusionMatrixPath)}`,
  };
}

async function getReportImagePath(imagePath) {
  const resolvedPath = path.resolve(String(imagePath || ""));
  const resolvedReportsDir = path.resolve(REPORTS_DIR);

  if (!resolvedPath.startsWith(resolvedReportsDir) || path.basename(resolvedPath) !== "confusion_matrix.png") {
    throw new Error("Imagen de reporte inválida.");
  }

  await fs.access(resolvedPath);
  return resolvedPath;
}

async function listExperimentDirs(baseDir) {
  try {
    const entries = await fs.readdir(baseDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory() && entry.name.startsWith("exp_"))
      .map((entry) => path.join(baseDir, entry.name))
      .sort();
  } catch (_error) {
    return [];
  }
}

async function getLatestTraining() {
  const reportDirs = await listExperimentDirs(REPORTS_DIR);
  const modelDirs = await listExperimentDirs(MODELS_DIR);
  const reportDir = reportDirs.at(-1) || null;
  const modelDir = modelDirs.at(-1) || null;

  if (!reportDir && !modelDir) {
    return {
      has_training: false,
      training_report: null,
    };
  }

  const report = await loadTrainingReport(reportDir);
  return {
    has_training: true,
    dataset_path: report?.metrics?.dataset_path || null,
    model_dir: modelDir,
    report_dir: reportDir,
    training_report: report,
  };
}

async function uploadDatasetAndTrain(file) {
  const datasetPath = await persistDataset(file);
  const training = await runTraining(datasetPath);
  const trainingReport = await loadTrainingReport(training.report_dir);
  return {
    dataset_path: datasetPath,
    ...training,
    training_report: trainingReport,
  };
}

module.exports = { getLatestTraining, getReportImagePath, uploadDatasetAndTrain };
