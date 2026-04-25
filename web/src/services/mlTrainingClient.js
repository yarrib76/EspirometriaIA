const fs = require("fs/promises");
const path = require("path");
const { spawn } = require("child_process");

const WEB_DIR = path.resolve(__dirname, "../..");
const PROJECT_ROOT = path.resolve(WEB_DIR, "..");
const ML_DIR = path.resolve(PROJECT_ROOT, "ml");
const RAW_DATA_DIR = path.resolve(ML_DIR, "data", "raw");
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

  return {
    metrics: await readJsonIfExists(path.join(reportDir, "metrics.json")),
    config: await readJsonIfExists(path.join(reportDir, "config.json")),
    artifacts: await readJsonIfExists(path.join(reportDir, "artifacts.json")),
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

module.exports = { uploadDatasetAndTrain };
