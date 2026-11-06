const aprioriService = require("./aprioriService");
const orderService = require("./orderService");

function parseCategorySet(value, field) {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error();
    return parsed.map(String);
  } catch (_error) {
    throw new Error(`La regla activa contiene un ${field} inválido.`);
  }
}

function numeric(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function recommend(orderId) {
  const active = await aprioriService.getActiveRules();
  const catalogRunId = active.manifest.settings.catalogRunId;
  const orderData = await orderService.getOrderCategories(orderId, catalogRunId);
  if (!orderData.found) throw new Error("Pedido web no encontrado.");

  const present = new Set(orderData.categories);
  const grouped = new Map();
  for (const source of active.rules) {
    const antecedent = parseCategorySet(source.antecedente, "antecedente");
    const consequents = parseCategorySet(source.consecuente, "consecuente");
    if (consequents.length !== 1 || !antecedent.every((category) => present.has(category))) continue;
    const consequent = consequents[0];
    if (present.has(consequent)) continue;
    const rule = {
      antecedent,
      consequent,
      support: numeric(source.soporte),
      confidence: numeric(source.confianza),
      lift: numeric(source.lift),
      invoiceCount: numeric(source.cantidad_facturas),
    };
    if (!grouped.has(consequent)) grouped.set(consequent, []);
    grouped.get(consequent).push(rule);
  }

  const recommendations = [...grouped.entries()].map(([category, rules]) => {
    rules.sort((a, b) => b.confidence - a.confidence || b.lift - a.lift || b.support - a.support);
    return { category, bestRule: rules[0], rules };
  });
  recommendations.sort((a, b) => b.bestRule.confidence - a.bestRule.confidence || b.bestRule.lift - a.bestRule.lift || b.bestRule.support - a.bestRule.support);

  return {
    order: orderData.order,
    activeRun: {
      id: active.runId,
      catalogRunId,
      support: active.manifest.settings.selectionSupport,
      confidence: active.manifest.settings.selectionConfidence,
      lift: active.manifest.settings.selectionLift,
    },
    presentCategories: orderData.categories,
    unmappedItems: orderData.unmappedItems,
    recommendations: recommendations.slice(0, 10),
  };
}

async function productsForRecommendation(orderId, category) {
  const result = await recommend(orderId);
  if (!result.recommendations.some((item) => item.category === category)) {
    throw new Error("La categoría no es una recomendación aplicable para este pedido.");
  }
  const products = await orderService.getCategoryProducts(result.activeRun.catalogRunId, category, 10);
  return { activeRun: result.activeRun, ...products };
}

module.exports = { productsForRecommendation, recommend };
