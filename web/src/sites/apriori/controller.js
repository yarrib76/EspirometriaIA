const path = require("path");
const aprioriService = require("./aprioriService");
const orderService = require("./orderService");
const recommendationService = require("./recommendationService");
const { renderAprioriHomePage } = require("./homeView");

function renderHome(_req, res) {
  res.type("html").send(renderAprioriHomePage());
}

async function run(req, res) {
  try {
    const result = await aprioriService.runPipeline(req.body.step, req.body.settings);
    return res.json({ ok: true, ...result });
  } catch (error) {
    return res.status(error.statusCode || 400).json({ error: error.message });
  }
}

async function files(_req, res) {
  try {
    return res.json({ files: await aprioriService.listCsvFiles(_req.query.run) });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function runs(_req, res) {
  try {
    return res.json({ runs: await aprioriService.listRuns() });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function reprocess(req, res) {
  try {
    const result = await aprioriService.reprocessRun(req.body.runId, req.body.step, req.body.settings);
    return res.json({ ok: true, ...result });
  } catch (error) {
    return res.status(error.statusCode || 400).json({ error: error.message });
  }
}

async function deleteRuns(_req, res) {
  try {
    return res.json({ ok: true, ...(await aprioriService.deleteAllRuns()) });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }
}

async function runDetail(req, res) {
  try {
    return res.json(await aprioriService.getRun(req.query.run));
  } catch (error) {
    return res.status(404).json({ error: error.message });
  }
}

async function runZip(req, res) {
  try {
    const absolutePath = await aprioriService.resolveRunZip(req.query.run);
    return res.download(absolutePath, path.basename(absolutePath));
  } catch (error) {
    return res.status(404).json({ error: error.message });
  }
}

async function selectSupport(req, res) {
  try {
    const result = await aprioriService.selectSupportForRun(req.body.runId, req.body.settings);
    return res.json({ ok: true, ...result });
  } catch (error) {
    return res.status(error.statusCode || 400).json({ error: error.message });
  }
}

async function preview(req, res) {
  try {
    return res.json(await aprioriService.previewCsv(req.query.file));
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

async function download(req, res) {
  try {
    const absolutePath = aprioriService.resolveCsvPath(req.query.file);
    return res.download(absolutePath, path.basename(absolutePath));
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

function status(_req, res) {
  res.json(aprioriService.getStatus());
}

async function settings(_req, res) {
  try {
    return res.json(await aprioriService.getSettings());
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function saveSettings(req, res) {
  try {
    return res.json({ ok: true, ...(await aprioriService.saveSettings(req.body.settings)) });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

async function resetSettings(_req, res) {
  try {
    return res.json({ ok: true, ...(await aprioriService.resetSettings()) });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function orders(req, res) {
  try {
    return res.json(await orderService.listOrders(req.query));
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

async function orderDetail(req, res) {
  try {
    const result = await orderService.getOrderDetail(req.params.id);
    if (!result.found) return res.status(404).json({ error: "Pedido web no encontrado." });
    return res.json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

async function activateRun(req, res) {
  try {
    const result = await aprioriService.activateRun(req.body.runId);
    return res.json({ ok: true, runId: result.runId, activatedAt: result.activatedAt });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

async function recommend(req, res) {
  try {
    return res.json(await recommendationService.recommend(req.params.id));
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

async function recommendationProducts(req, res) {
  try {
    return res.json(await recommendationService.productsForRecommendation(req.params.id, req.query.category));
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

module.exports = { activateRun, deleteRuns, download, files, orderDetail, orders, preview, recommend, recommendationProducts, renderHome, reprocess, resetSettings, run, runDetail, runs, runZip, saveSettings, selectSupport, settings, status };
