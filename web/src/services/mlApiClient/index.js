const path = require("path");
const { spawn } = require("child_process");

const WEB_DIR = path.resolve(__dirname, "../../..");
const PROJECT_ROOT = path.resolve(WEB_DIR, "..");
const ML_DIR = path.resolve(PROJECT_ROOT, "ml");
const DEFAULT_PYTHON = path.resolve(ML_DIR, ".venv", "Scripts", "python.exe");
const PYTHON_BIN = process.env.ML_PYTHON_BIN || DEFAULT_PYTHON;
const PREDICT_MODULE = "src.inference.predict_cli";

function runPythonPrediction(payload) {
  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON_BIN, ["-m", PREDICT_MODULE], {
      cwd: ML_DIR,
      env: {
        ...process.env,
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
        const error = new Error(stderr.trim() || "Falló la inferencia interna en Python.");
        error.statusCode = 502;
        reject(error);
        return;
      }

      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        const parseError = new Error(`La salida de Python no fue JSON válido: ${error.message}`);
        parseError.statusCode = 502;
        reject(parseError);
      }
    });

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });
}

async function predict(payload) {
  return runPythonPrediction(payload);
}

module.exports = { predict };
