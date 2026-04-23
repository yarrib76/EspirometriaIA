const express = require("express");
const routes = require("./routes");

function createApp() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(routes);
  app.use((error, _req, res, _next) => {
    if (error) {
      return res.status(400).json({ error: error.message || "La solicitud no pudo ser procesada." });
    }

    return res.status(500).json({ error: "Error inesperado." });
  });

  return app;
}

module.exports = { createApp };
