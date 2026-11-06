const { execFile } = require("child_process");
const path = require("path");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);
const APRIORI_ROOT = path.resolve(__dirname, "../../../../apriori");

function databaseEnvironment() {
  const required = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) throw new Error(`Faltan variables de conexión: ${missing.join(", ")}.`);
  return { ...process.env, DB_PORT: process.env.DB_PORT || "3306" };
}

function integer(value, fallback, minimum, maximum) {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(`El valor debe ser un entero entre ${minimum} y ${maximum}.`);
  }
  return parsed;
}

async function query(args) {
  const python = process.env.APRIORI_PYTHON_BIN || "python";
  try {
    const result = await execFileAsync(
      python,
      [path.join(APRIORI_ROOT, "src", "query_orders.py"), ...args.map(String)],
      {
        cwd: APRIORI_ROOT,
        env: databaseEnvironment(),
        windowsHide: true,
        timeout: 30 * 1000,
        maxBuffer: 5 * 1024 * 1024,
      }
    );
    return JSON.parse(result.stdout);
  } catch (error) {
    const detail = String(error.stderr || error.message || "Error desconocido")
      .trim()
      .split(/\r?\n/)
      .filter(Boolean)
      .at(-1);
    throw new Error(`No se pudieron consultar los pedidos: ${detail}`);
  }
}

async function listOrders(input) {
  const page = integer(input.page, 1, 1, 1000000);
  const pageSize = integer(input.pageSize, 10, 5, 100);
  const search = String(input.search || "").trim().slice(0, 100);
  return query(["list", "--page", page, "--page-size", pageSize, "--search", search]);
}

async function getOrderDetail(orderId) {
  const id = integer(orderId, null, 1, 2147483647);
  return query(["detail", "--order-id", id]);
}

async function getOrderCategories(orderId, catalogRunId) {
  const id = integer(orderId, null, 1, 2147483647);
  const catalog = integer(catalogRunId, null, 1, 2147483647);
  return query(["categories", "--order-id", id, "--catalog-run-id", catalog]);
}

async function getCategoryProducts(catalogRunId, category, minimumStock = 10) {
  const catalog = integer(catalogRunId, null, 1, 2147483647);
  const stock = integer(minimumStock, 10, 0, 1000000);
  const normalizedCategory = String(category || "").trim();
  if (!normalizedCategory || normalizedCategory.length > 255) throw new Error("Categoría inválida.");
  return query(["products", "--catalog-run-id", catalog, "--category", normalizedCategory, "--min-stock", stock]);
}

module.exports = { getCategoryProducts, getOrderCategories, getOrderDetail, listOrders };
