const { execFile } = require("child_process");
const fs = require("fs/promises");
const path = require("path");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);
const APRIORI_ROOT = path.resolve(__dirname, "../../../../apriori");
const CURRENT_ROOTS = [path.join(APRIORI_ROOT, "data"), path.join(APRIORI_ROOT, "reports")];
const RUNS_ROOT = path.join(APRIORI_ROOT, "runs");
const ACTIVE_RUN_FILE = path.join(RUNS_ROOT, "active_run.json");
const ALLOWED_FILE_ROOTS = [...CURRENT_ROOTS, RUNS_ROOT];
let activeRun = null;

function numberInRange(value, name, minimum, maximum, fallback) {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(`${name} debe estar entre ${minimum} y ${maximum}.`);
  }
  return parsed;
}

function integerInRange(value, name, minimum, maximum, fallback) {
  const parsed = numberInRange(value, name, minimum, maximum, fallback);
  if (!Number.isInteger(parsed)) throw new Error(`${name} debe ser un número entero.`);
  return parsed;
}

function normalizeSupports(value) {
  const source = Array.isArray(value) ? value : String(value || "1,2,3,4,5").split(",");
  const supports = [...new Set(source.map(Number))].sort((a, b) => a - b);
  if (supports.length === 0 || supports.some((item) => !Number.isInteger(item) || item < 1 || item > 100)) {
    throw new Error("Los soportes deben ser porcentajes enteros entre 1 y 100.");
  }
  return supports;
}

function normalizeSettings(input = {}) {
  const supports = normalizeSupports(input.supports);
  const selectionSupport = integerInRange(input.selectionSupport, "Soporte de selección", 1, 100, 3);
  if (!supports.includes(selectionSupport)) {
    throw new Error("El soporte de selección debe estar incluido entre los soportes a analizar.");
  }
  return {
    invoiceLimit: integerInRange(input.invoiceLimit, "Cantidad de facturas", 1, 100000, 1500),
    catalogRunId: integerInRange(input.catalogRunId, "ID de catálogo", 1, 2147483647, 970),
    supports,
    ruleConfidence: numberInRange(input.ruleConfidence, "Confianza de reglas", 0, 100, 30) / 100,
    ruleLift: numberInRange(input.ruleLift, "Lift de reglas", 0, 1000, 1),
    selectionSupport,
    selectionConfidence: numberInRange(input.selectionConfidence, "Confianza de selección", 0, 100, 40) / 100,
    selectionLift: numberInRange(input.selectionLift, "Lift de selección", 0, 1000, 1.2),
    maxRules: integerInRange(input.maxRules, "Máximo de reglas", 1, 1000, 20),
    maxPerConsequent: integerInRange(input.maxPerConsequent, "Máximo por consecuente", 1, 100, 2),
  };
}

function pythonEnvironment() {
  const required = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) throw new Error(`Faltan variables de conexión: ${missing.join(", ")}.`);
  return { ...process.env, DB_PORT: process.env.DB_PORT || "3306" };
}

async function runPython(scriptName, args = [], needsDatabase = false) {
  const python = process.env.APRIORI_PYTHON_BIN || "python";
  try {
    const result = await execFileAsync(python, [path.join(APRIORI_ROOT, "src", scriptName), ...args.map(String)], {
      cwd: APRIORI_ROOT,
      env: needsDatabase ? pythonEnvironment() : process.env,
      windowsHide: true,
      timeout: 10 * 60 * 1000,
      maxBuffer: 10 * 1024 * 1024,
    });
    return { step: scriptName, output: result.stdout.trim(), warnings: result.stderr.trim() };
  } catch (error) {
    const details = String(error.stderr || error.message || "Error desconocido")
      .trim()
      .split(/\r?\n/)
      .filter(Boolean)
      .at(-1);
    throw new Error(`Falló ${scriptName}: ${details}`);
  }
}

function currentPaths() {
  return {
    extraction: path.join(APRIORI_ROOT, "data", "extracted", "transacciones_categorias.csv"),
    matrix: path.join(APRIORI_ROOT, "data", "processed", "matriz_binaria.csv"),
    itemsets: path.join(APRIORI_ROOT, "reports", "itemsets"),
    rules: path.join(APRIORI_ROOT, "reports", "rules"),
  };
}

function runPaths(runDirectory) {
  return {
    extraction: path.join(runDirectory, "data", "extracted", "transacciones_categorias.csv"),
    matrix: path.join(runDirectory, "data", "processed", "matriz_binaria.csv"),
    itemsets: path.join(runDirectory, "reports", "itemsets"),
    rules: path.join(runDirectory, "reports", "rules"),
  };
}

async function executeStep(step, settings, outputs = currentPaths()) {
  switch (step) {
    case "extract":
      return runPython("extract_transactions.py", ["--invoice-limit", settings.invoiceLimit, "--catalog-run-id", settings.catalogRunId, "--output", outputs.extraction], true);
    case "matrix":
      return runPython("build_binary_matrix.py", ["--input", outputs.extraction, "--output", outputs.matrix]);
    case "itemsets":
      return runPython("generate_frequent_itemsets.py", ["--input", outputs.matrix, "--output-dir", outputs.itemsets, "--supports", ...settings.supports]);
    case "rules":
      return runPython("generate_association_rules.py", ["--itemsets-dir", outputs.itemsets, "--output-dir", outputs.rules, "--matrix", outputs.matrix, "--supports", ...settings.supports, "--min-confidence", settings.ruleConfidence, "--min-lift", settings.ruleLift]);
    case "select": {
      const code = String(settings.selectionSupport).padStart(2, "0");
      return runPython("select_candidate_rules.py", ["--input", path.join(outputs.rules, `reglas_soporte_${code}.csv`), "--evaluated-output", path.join(outputs.rules, "reglas_evaluadas.csv"), "--selected-output", path.join(outputs.rules, "reglas_seleccionadas.csv"), "--min-confidence", settings.selectionConfidence, "--min-lift", settings.selectionLift, "--max-rules", settings.maxRules, "--max-per-consequent", settings.maxPerConsequent]);
    }
    default:
      throw new Error("Etapa de procesamiento desconocida.");
  }
}

function createRunId(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}_${values.hour}-${values.minute}-${values.second}-${String(date.getMilliseconds()).padStart(3, "0")}`;
}

function parseDelimited(text, delimiter = ";") {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') { field += '"'; index += 1; } else quoted = !quoted;
    } else if (char === delimiter && !quoted) { row.push(field); field = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field); if (row.some((value) => value !== "")) rows.push(row); row = []; field = "";
    } else field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

async function readCsvRows(filePath) {
  const text = (await fs.readFile(filePath, "utf8")).replace(/^\uFEFF/, "");
  return parseDelimited(text);
}

function rowsToObjects(rows) {
  if (!rows.length) return [];
  const headers = rows[0];
  return rows.slice(1).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index]])));
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

async function buildSummary(settings, outputs) {
  const extraction = await readCsvRows(outputs.extraction);
  const matrix = await readCsvRows(outputs.matrix);
  const invoices = new Set(extraction.slice(1).map((row) => row[0]));
  const itemsets = {}, rules = {}, supportComparison = [];
  for (const support of settings.supports) {
    const code = String(support).padStart(2, "0");
    const itemsetRows = await readCsvRows(path.join(outputs.itemsets, `apriori_itemsets_frecuentes_soporte_${code}.csv`));
    const ruleRows = await readCsvRows(path.join(outputs.rules, `reglas_soporte_${code}.csv`));
    itemsets[support] = Math.max(0, itemsetRows.length - 1);
    rules[support] = Math.max(0, ruleRows.length - 1);
    const header = ruleRows[0] || [];
    const confidenceIndex = header.indexOf("confianza");
    const liftIndex = header.indexOf("lift");
    const consequentIndex = header.indexOf("consecuente");
    const antecedentSizeIndex = header.indexOf("cantidad_antecedente");
    const rows = ruleRows.slice(1);
    const confidences = rows.map((row) => Number(row[confidenceIndex])).filter(Number.isFinite);
    const lifts = rows.map((row) => Number(row[liftIndex])).filter(Number.isFinite);
    const eligibleRows = rows.filter((row) => Number(row[confidenceIndex]) >= settings.selectionConfidence && Number(row[liftIndex]) >= settings.selectionLift);
    supportComparison.push({
      support,
      minimumInvoices: Math.ceil(matrix.length > 1 ? (matrix.length - 1) * support / 100 : 0),
      itemsets: itemsets[support],
      rules: rules[support],
      eligibleRules: eligibleRows.length,
      distinctConsequents: new Set(eligibleRows.map((row) => row[consequentIndex])).size,
      medianConfidence: median(confidences),
      medianLift: median(lifts),
      strongRules: rows.filter((row) => Number(row[confidenceIndex]) >= 0.6 && Number(row[liftIndex]) >= 1.5).length,
      maximumAntecedentSize: rows.length ? Math.max(...rows.map((row) => Number(row[antecedentSizeIndex]) || 0)) : 0,
    });
  }
  const selected = await readCsvRows(path.join(outputs.rules, "reglas_seleccionadas.csv"));
  const evaluated = await readCsvRows(path.join(outputs.rules, "reglas_evaluadas.csv"));
  const eligibleIndex = evaluated[0].indexOf("elegible");
  return {
    requestedInvoices: settings.invoiceLimit,
    categorizedInvoices: invoices.size,
    excludedInvoices: settings.invoiceLimit - invoices.size,
    normalizedRows: extraction.length - 1,
    categoryCount: Math.max(0, matrix[0].length - 1),
    matrixRows: matrix.length - 1,
    itemsetsBySupport: itemsets,
    rulesBySupport: rules,
    supportComparison,
    evaluatedRules: evaluated.length - 1,
    eligibleRules: eligibleIndex >= 0 ? evaluated.slice(1).filter((row) => row[eligibleIndex] === "True").length : null,
    selectedRules: selected.length - 1,
  };
}

async function writeManifest(runDirectory, manifest) {
  await fs.writeFile(path.join(runDirectory, "resumen_corrida.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

async function runHistoricalPipeline(settings) {
  const runId = createRunId();
  const runDirectory = path.join(RUNS_ROOT, runId);
  const outputs = runPaths(runDirectory);
  const startedAt = new Date().toISOString();
  const manifest = { id: runId, status: "running", startedAt, finishedAt: null, settings, summary: null, results: [], zipName: `auditoria_apriori_${runId}.zip` };
  await fs.mkdir(runDirectory, { recursive: true });
  await writeManifest(runDirectory, manifest);
  activeRun = { step: "all", runId, startedAt };
  try {
    for (const step of ["extract", "matrix", "itemsets", "rules", "select"]) {
      manifest.results.push(await executeStep(step, settings, outputs));
      await writeManifest(runDirectory, manifest);
    }
    manifest.summary = await buildSummary(settings, outputs);
    manifest.status = "completed";
    manifest.finishedAt = new Date().toISOString();
    await writeManifest(runDirectory, manifest);
    await runPython("package_audit.py", ["--run-dir", runDirectory, "--output", path.join(runDirectory, manifest.zipName)]);
    return { historical: true, runId, settings, summary: manifest.summary, results: manifest.results };
  } catch (error) {
    manifest.status = "failed";
    manifest.finishedAt = new Date().toISOString();
    manifest.error = error.message;
    await writeManifest(runDirectory, manifest);
    throw error;
  } finally {
    activeRun = null;
  }
}

async function runPipeline(step, input) {
  if (activeRun) { const error = new Error("Ya hay un procesamiento Apriori en ejecución."); error.statusCode = 409; throw error; }
  const settings = normalizeSettings(input);
  if (step === "all") return runHistoricalPipeline(settings);
  activeRun = { step, startedAt: new Date().toISOString() };
  try { return { historical: false, settings, results: [await executeStep(step, settings)] }; }
  finally { activeRun = null; }
}

async function selectSupportForRun(runId, input = {}) {
  if (activeRun) { const error = new Error("Ya hay un procesamiento Apriori en ejecución."); error.statusCode = 409; throw error; }
  const manifest = await getRun(validateRunId(runId));
  if (manifest.status !== "completed") throw new Error("Solo se puede seleccionar soporte en una corrida completada.");
  const selectionSupport = integerInRange(input.selectionSupport, "Soporte de selección", 1, 100, manifest.settings.selectionSupport);
  if (!manifest.settings.supports.includes(selectionSupport)) throw new Error("El soporte elegido no pertenece a esta corrida.");
  const settings = {
    ...manifest.settings,
    selectionSupport,
    selectionConfidence: numberInRange(input.selectionConfidence, "Confianza de selección", 0, 100, manifest.settings.selectionConfidence * 100) / 100,
    selectionLift: numberInRange(input.selectionLift, "Lift de selección", 0, 1000, manifest.settings.selectionLift),
    maxRules: integerInRange(input.maxRules, "Máximo de reglas", 1, 1000, manifest.settings.maxRules),
    maxPerConsequent: integerInRange(input.maxPerConsequent, "Máximo por consecuente", 1, 100, manifest.settings.maxPerConsequent),
  };
  const runDirectory = path.join(RUNS_ROOT, runId);
  const outputs = runPaths(runDirectory);
  activeRun = { step: "select", runId, startedAt: new Date().toISOString() };
  try {
    const result = await executeStep("select", settings, outputs);
    manifest.settings = settings;
    manifest.results = manifest.results.filter((item) => item.step !== "select_candidate_rules.py");
    manifest.results.push(result);
    manifest.summary = await buildSummary(settings, outputs);
    manifest.updatedAt = new Date().toISOString();
    await writeManifest(runDirectory, manifest);
    await runPython("package_audit.py", ["--run-dir", runDirectory, "--output", path.join(runDirectory, manifest.zipName)]);
    return { runId, settings, summary: manifest.summary, result };
  } finally {
    activeRun = null;
  }
}

async function walkCsvFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walkCsvFiles(absolutePath)));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith(".csv")) {
      const stats = await fs.stat(absolutePath);
      files.push({ id: path.relative(APRIORI_ROOT, absolutePath).split(path.sep).join("/"), name: entry.name, size: stats.size, modifiedAt: stats.mtime.toISOString() });
    }
  }
  return files;
}

function validateRunId(runId) {
  if (typeof runId !== "string" || !/^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}-\d{3}$/.test(runId)) throw new Error("Identificador de corrida inválido.");
  return runId;
}

async function listCsvFiles(runId) {
  const roots = runId ? [path.join(RUNS_ROOT, validateRunId(runId))] : CURRENT_ROOTS;
  const groups = await Promise.all(roots.map(async (directory) => { try { return await walkCsvFiles(directory); } catch (error) { if (error.code === "ENOENT") return []; throw error; } }));
  return groups.flat().sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
}

function resolveAllowedPath(fileId, extension) {
  if (typeof fileId !== "string" || !fileId.toLowerCase().endsWith(extension)) throw new Error("Archivo inválido.");
  const absolutePath = path.resolve(APRIORI_ROOT, fileId);
  const allowed = ALLOWED_FILE_ROOTS.some((root) => { const relative = path.relative(root, absolutePath); return relative && !relative.startsWith("..") && !path.isAbsolute(relative); });
  if (!allowed) throw new Error("El archivo solicitado está fuera del directorio permitido.");
  return absolutePath;
}

function resolveCsvPath(fileId) { return resolveAllowedPath(fileId, ".csv"); }

async function previewCsv(fileId, limit = 50) {
  const rows = await readCsvRows(resolveCsvPath(fileId));
  if (!rows.length) return { columns: [], rows: [], totalRows: 0 };
  return { columns: rows[0], rows: rows.slice(1, limit + 1), totalRows: rows.length - 1 };
}

async function listRuns() {
  let entries;
  try { entries = await fs.readdir(RUNS_ROOT, { withFileTypes: true }); } catch (error) { if (error.code === "ENOENT") return []; throw error; }
  const runs = [];
  const activeRunId = await getActiveRunId();
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    try {
      const manifest = JSON.parse(await fs.readFile(path.join(RUNS_ROOT, entry.name, "resumen_corrida.json"), "utf8"));
      runs.push({ id: manifest.id, status: manifest.status, startedAt: manifest.startedAt, finishedAt: manifest.finishedAt, settings: manifest.settings, summary: manifest.summary, active: manifest.id === activeRunId });
    } catch (_error) { /* Una carpeta incompleta no se publica. */ }
  }
  return runs.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

async function getActiveRunId() {
  try {
    const value = JSON.parse(await fs.readFile(ACTIVE_RUN_FILE, "utf8"));
    return value.runId || null;
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function activateRun(runId) {
  const manifest = await getRun(validateRunId(runId));
  if (manifest.status !== "completed") throw new Error("Solo se puede activar una corrida completada.");
  const selectedRules = path.join(RUNS_ROOT, runId, "reports", "rules", "reglas_seleccionadas.csv");
  await fs.access(selectedRules);
  await fs.mkdir(RUNS_ROOT, { recursive: true });
  const active = { runId, activatedAt: new Date().toISOString() };
  await fs.writeFile(ACTIVE_RUN_FILE, `${JSON.stringify(active, null, 2)}\n`, "utf8");
  return { ...active, manifest };
}

async function getActiveRules() {
  const runId = await getActiveRunId();
  if (!runId) throw new Error("No hay una corrida activa para Pedidos.");
  const manifest = await getRun(runId);
  if (manifest.status !== "completed") throw new Error("La corrida activa no está completada.");
  const rows = await readCsvRows(path.join(RUNS_ROOT, runId, "reports", "rules", "reglas_seleccionadas.csv"));
  return { runId, manifest, rules: rowsToObjects(rows) };
}

async function getRun(runId) {
  validateRunId(runId);
  return JSON.parse(await fs.readFile(path.join(RUNS_ROOT, runId, "resumen_corrida.json"), "utf8"));
}

async function resolveRunZip(runId) {
  const manifest = await getRun(runId);
  if (!manifest.zipName) throw new Error("La corrida no tiene ZIP de auditoría.");
  const zipPath = path.join(RUNS_ROOT, runId, manifest.zipName);
  await fs.access(zipPath);
  return zipPath;
}

function getStatus() { return { running: Boolean(activeRun), activeRun }; }

module.exports = { activateRun, getActiveRules, getActiveRunId, getRun, getStatus, listCsvFiles, listRuns, previewCsv, resolveCsvPath, resolveRunZip, runPipeline, selectSupportForRun };
