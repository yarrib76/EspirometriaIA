function renderHomePage() {
  return `
  <!DOCTYPE html>
  <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Intérprete de Espirometría</title>
      <style>
        :root {
          --bg: #efe6d7;
          --panel: rgba(255, 251, 245, 0.92);
          --panel-strong: #fffdf8;
          --text: #1f2b33;
          --muted: #65727d;
          --line: rgba(75, 96, 112, 0.16);
          --primary: #0f5f7d;
          --primary-soft: rgba(15, 95, 125, 0.12);
          --accent: #d68133;
          --ok: #1f7a5c;
          --error: #af4343;
          --sidebar: #183341;
          --sidebar-soft: #24495d;
          --shadow: 0 24px 55px rgba(31, 43, 51, 0.14);
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          min-height: 100vh;
          font-family: Cambria, Georgia, serif;
          color: var(--text);
          background:
            radial-gradient(circle at top left, rgba(15, 95, 125, 0.18), transparent 28%),
            radial-gradient(circle at bottom right, rgba(214, 129, 51, 0.14), transparent 30%),
            linear-gradient(140deg, #e7dac4, var(--bg) 42%, #f8f3ea);
        }

        .layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          min-height: 100vh;
        }

        .sidebar {
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent),
            linear-gradient(180deg, var(--sidebar), #102630);
          color: #eef6f8;
          padding: 28px 20px;
          display: grid;
          align-content: start;
          gap: 24px;
          border-right: 1px solid rgba(255, 255, 255, 0.08);
        }

        .brand {
          display: grid;
          gap: 10px;
          padding-bottom: 22px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .brand-badge {
          display: inline-flex;
          width: fit-content;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          font-size: 0.82rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .brand h1 {
          margin: 0;
          font-size: 1.85rem;
          line-height: 1.05;
        }

        .brand p {
          margin: 0;
          color: rgba(238, 246, 248, 0.74);
          font-size: 0.96rem;
        }

        .menu {
          display: grid;
          gap: 10px;
        }

        .menu button {
          width: 100%;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.04);
          color: inherit;
          border-radius: 18px;
          padding: 16px;
          cursor: pointer;
          text-align: left;
          transition: background 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
        }

        .menu button:hover {
          transform: translateX(2px);
          background: rgba(255, 255, 255, 0.08);
        }

        .menu button.active {
          background: linear-gradient(135deg, rgba(214, 129, 51, 0.28), rgba(15, 95, 125, 0.3));
          border-color: rgba(255, 255, 255, 0.18);
        }

        .menu strong {
          display: block;
          font-size: 1rem;
          margin-bottom: 4px;
        }

        .menu span {
          display: block;
          color: rgba(238, 246, 248, 0.72);
          font-size: 0.88rem;
        }

        .content {
          padding: 28px;
        }

        .screen {
          display: none;
          gap: 22px;
        }

        .screen.active {
          display: grid;
        }

        .hero,
        .card {
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: 28px;
          box-shadow: var(--shadow);
        }

        .hero {
          padding: 28px 30px;
          position: relative;
          overflow: hidden;
        }

        .hero::after {
          content: "";
          position: absolute;
          right: -30px;
          bottom: -30px;
          width: 170px;
          height: 170px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(15, 95, 125, 0.16), transparent 68%);
        }

        .eyebrow {
          display: inline-flex;
          padding: 7px 12px;
          border-radius: 999px;
          background: var(--primary-soft);
          color: var(--primary);
          font-size: 0.82rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        h2, h3, h4 {
          margin: 0;
        }

        .hero h2 {
          margin-top: 14px;
          font-size: clamp(2rem, 4vw, 3.3rem);
          line-height: 0.95;
          letter-spacing: -0.03em;
        }

        .hero p {
          margin: 12px 0 0;
          color: var(--muted);
          max-width: 60ch;
        }

        .facts {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-top: 22px;
        }

        .fact {
          padding: 16px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.62);
          border: 1px solid rgba(75, 96, 112, 0.12);
        }

        .fact strong {
          display: block;
          margin-bottom: 6px;
        }

        .fact span {
          color: var(--muted);
          font-size: 0.92rem;
        }

        .split {
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 22px;
        }

        .card {
          padding: 26px;
          display: grid;
          gap: 18px;
        }

        .subtitle {
          color: var(--muted);
          margin-top: 6px;
        }

        form {
          display: grid;
          gap: 16px;
        }

        .group {
          display: grid;
          gap: 12px;
          padding: 18px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(75, 96, 112, 0.11);
        }

        .group-title {
          font-size: 0.9rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--primary);
          font-weight: 700;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        label {
          display: grid;
          gap: 6px;
          font-size: 0.95rem;
        }

        .hint {
          font-size: 0.82rem;
          color: var(--muted);
        }

        input,
        select,
        button {
          font: inherit;
        }

        input,
        select {
          width: 100%;
          border: 1px solid rgba(75, 96, 112, 0.18);
          border-radius: 14px;
          padding: 12px 14px;
          background: var(--panel-strong);
          color: var(--text);
        }

        input:focus,
        select:focus {
          outline: none;
          border-color: rgba(15, 95, 125, 0.48);
          box-shadow: 0 0 0 4px rgba(15, 95, 125, 0.08);
        }

        .actions {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .primary-button {
          border: none;
          border-radius: 16px;
          padding: 14px 22px;
          color: #fff;
          font-weight: 700;
          background: linear-gradient(135deg, var(--primary), #3d8db8);
          box-shadow: 0 18px 28px rgba(15, 95, 125, 0.22);
          cursor: pointer;
        }

        .primary-button:hover {
          filter: saturate(1.05);
        }

        .primary-button:disabled {
          cursor: wait;
          opacity: 0.75;
        }

        .status,
        .upload-status,
        .train-status {
          min-height: 20px;
          color: var(--muted);
          font-size: 0.92rem;
        }

        .result-card {
          display: grid;
          gap: 18px;
          padding: 24px;
          border-radius: 24px;
          background: linear-gradient(180deg, rgba(19, 37, 49, 0.98), rgba(17, 27, 35, 0.96));
          color: #edf4f6;
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: start;
          flex-wrap: wrap;
        }

        .result-label {
          font-size: 0.82rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #9eb8c6;
        }

        .diagnosis {
          font-size: clamp(1.8rem, 4vw, 3rem);
          margin: 4px 0 0;
        }

        .chip {
          align-self: start;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 0.84rem;
          background: rgba(31, 122, 92, 0.18);
          color: #96e2c7;
          border: 1px solid rgba(150, 226, 199, 0.22);
        }

        .chip.error {
          background: rgba(181, 69, 69, 0.16);
          color: #ffbbbb;
          border-color: rgba(255, 187, 187, 0.22);
        }

        .probabilities {
          display: grid;
          gap: 12px;
        }

        .bar-row {
          display: grid;
          gap: 6px;
        }

        .bar-top {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          font-size: 0.92rem;
        }

        .bar-track {
          width: 100%;
          height: 12px;
          border-radius: 999px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.08);
        }

        .bar-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, var(--accent), #ffd08e);
        }

        .notice {
          padding: 14px 16px;
          border-radius: 16px;
          background: rgba(15, 95, 125, 0.08);
          border: 1px solid rgba(15, 95, 125, 0.12);
          color: var(--text);
          font-size: 0.93rem;
        }

        .warning-list {
          margin: 0;
          padding-left: 18px;
        }

        .raw-box {
          margin: 0;
          padding: 16px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.05);
          color: #d9e5ea;
          overflow: auto;
          font-size: 0.88rem;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .train-card {
          display: grid;
          gap: 16px;
          padding: 24px;
          border-radius: 24px;
          background: linear-gradient(180deg, rgba(26, 41, 49, 0.98), rgba(16, 28, 35, 0.96));
          color: #edf4f6;
        }

        .metric-list {
          display: grid;
          gap: 12px;
        }

        .metric-item {
          padding: 14px 16px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.05);
        }

        .metric-item strong {
          display: block;
          margin-bottom: 4px;
        }

        @media (max-width: 1100px) {
          .split,
          .facts {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 900px) {
          .layout {
            grid-template-columns: 1fr;
          }

          .sidebar {
            border-right: none;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          }

          .grid {
            grid-template-columns: 1fr;
          }
        }
      </style>
    </head>
    <body>
      <main class="layout">
        <aside class="sidebar">
          <section class="brand">
            <span class="brand-badge">Plataforma clínica</span>
            <h1>Espirometría IA</h1>
            <p>Entrená el modelo con tu dataset o usá el módulo de diagnóstico funcional.</p>
          </section>

          <nav class="menu">
            <button type="button" class="menu-button active" data-target="training-screen">
              <strong>Entrenamiento</strong>
              <span>Cargá un dataset CSV y generá una nueva corrida del modelo.</span>
            </button>
            <button type="button" class="menu-button" data-target="diagnosis-screen">
              <strong>Diagnóstico</strong>
              <span>Usá el formulario actual para interpretar un estudio de espirometría.</span>
            </button>
          </nav>
        </aside>

        <section class="content">
          <section id="training-screen" class="screen active">
            <article class="hero">
              <span class="eyebrow">Entrenamiento del modelo</span>
              <h2>Subí un dataset y lanzá una nueva corrida</h2>
              <p>
                El sistema guarda el CSV en el workspace de ML y ejecuta el pipeline de entrenamiento
                para producir un nuevo modelo y su carpeta de reportes.
              </p>
              <div class="facts">
                <div class="fact">
                  <strong>Entrada CSV</strong>
                  <span>Archivo estructurado con las columnas esperadas del intérprete funcional.</span>
                </div>
                <div class="fact">
                  <strong>Entrenamiento local</strong>
                  <span>La web invoca el entorno Python interno configurado en <code>ml/.venv</code>.</span>
                </div>
                <div class="fact">
                  <strong>Salida versionada</strong>
                  <span>Cada corrida genera una nueva carpeta en <code>ml/models</code> y <code>ml/reports</code>.</span>
                </div>
              </div>
            </article>

            <section class="split">
              <section class="card">
                <div>
                  <h3>Cargar dataset</h3>
                  <p class="subtitle">Subí un archivo CSV y ejecutá el entrenamiento desde esta pantalla.</p>
                </div>

                <form id="training-form">
                  <section class="group">
                    <div class="group-title">Dataset</div>
                    <label>
                      Archivo CSV
                      <input id="dataset-input" name="datasetCsv" type="file" accept=".csv,text/csv" required />
                      <span class="hint">El archivo se copiará a <code>ml/data/raw</code> antes de entrenar.</span>
                    </label>
                  </section>

                  <div class="actions">
                    <button id="train-submit-button" class="primary-button" type="submit">Cargar y entrenar</button>
                    <span id="train-status" class="train-status">Esperando dataset para iniciar el entrenamiento.</span>
                  </div>
                </form>
              </section>

              <section class="card">
                <div>
                  <h3>Resultado del entrenamiento</h3>
                  <p class="subtitle">Se informan dataset cargado, modelo generado y rutas de salida.</p>
                </div>

                <article class="train-card">
                  <div class="metric-list" id="training-summary">
                    <div class="metric-item">
                      <strong>Sin corridas en esta sesión</strong>
                      <span>Subí un CSV y ejecutá el entrenamiento para ver el resultado aquí.</span>
                    </div>
                  </div>

                  <div>
                    <div class="result-label">Respuesta cruda</div>
                    <pre id="training-raw-result" class="raw-box">Todavía no hay respuesta del entrenamiento.</pre>
                  </div>
                </article>
              </section>
            </section>
          </section>

          <section id="diagnosis-screen" class="screen">
            <article class="hero">
              <span class="eyebrow">Sistema de interpretación funcional</span>
              <h2>Intérprete de espirometría</h2>
              <p>
                Ingresá variables pre y post broncodilatador para estimar el patrón funcional,
                revisar severidad y apoyar la interpretación según criterios del algoritmo.
              </p>
              <div class="facts">
                <div class="fact">
                  <strong>4 patrones</strong>
                  <span>Normal, obstructivo, restrictivo y mixto.</span>
                </div>
                <div class="fact">
                  <strong>Pre y post-BD</strong>
                  <span>Incluye porcentajes predichos y respuesta broncodilatadora.</span>
                </div>
                <div class="fact">
                  <strong>Salida clínica</strong>
                  <span>Devuelve patrón, severidad y notas de interpretación.</span>
                </div>
              </div>
            </article>

            <section class="split">
              <section class="card">
                <div>
                  <h3>Formulario clínico-funcional</h3>
                  <p class="subtitle">Podés cargar un PDF de espirometría o completar los datos manualmente.</p>
                </div>

                <section class="group">
                  <div class="group-title">Carga automática desde PDF</div>
                  <form id="pdf-form">
                    <label>
                      Informe de espirometría en PDF
                      <input id="pdf-input" name="spirometryPdf" type="file" accept=".pdf,application/pdf" required />
                      <span class="hint">El sistema intentará leer valores basales, porcentajes predichos y post-BD.</span>
                    </label>
                    <div class="actions">
                      <button id="pdf-submit-button" class="primary-button" type="submit">Cargar PDF y completar</button>
                      <span id="upload-status" class="upload-status">Sin PDF cargado.</span>
                    </div>
                  </form>
                </section>

                <form id="prediction-form">
                  <section class="group">
                    <div class="group-title">Datos del paciente</div>
                    <div class="grid">
                      <label>
                        Edad
                        <input name="Edad" type="number" min="18" max="100" placeholder="Ej. 55" required />
                      </label>
                      <label>
                        Género
                        <select name="Genero" required>
                          <option value="M">Masculino</option>
                          <option value="F">Femenino</option>
                        </select>
                      </label>
                      <label>
                        Altura (cm)
                        <input name="Altura_cm" type="number" min="120" max="220" placeholder="Ej. 172" required />
                      </label>
                      <label>
                        Peso (kg)
                        <input name="Peso_kg" type="number" min="30" max="250" step="0.1" placeholder="Ej. 81.5" required />
                      </label>
                    </div>
                  </section>

                  <section class="group">
                    <div class="group-title">Parámetros espirométricos</div>
                    <div class="grid">
                      <label>
                        FVC
                        <input name="FVC" type="number" min="0.5" max="8" step="0.01" placeholder="Ej. 3.40" required />
                      </label>
                      <label>
                        FEV1
                        <input name="FEV1" type="number" min="0.5" max="8" step="0.01" placeholder="Ej. 2.10" required />
                      </label>
                      <label>
                        FVC % del predicho
                        <input name="FVC_pct_pred" type="number" min="10" max="160" step="0.1" placeholder="Ej. 78.0" required />
                      </label>
                      <label>
                        FEV1 % del predicho
                        <input name="FEV1_pct_pred" type="number" min="10" max="160" step="0.1" placeholder="Ej. 61.0" required />
                      </label>
                    </div>
                  </section>

                  <section class="group">
                    <div class="group-title">Calidad y broncodilatador</div>
                    <div class="grid">
                      <label>
                        Calidad aceptable
                        <select name="Calidad_Espirometria">
                          <option value="1">Sí</option>
                          <option value="0">No</option>
                        </select>
                      </label>
                      <label>
                        Fumador
                        <select name="Fumador">
                          <option value="0">No</option>
                          <option value="1">Sí</option>
                        </select>
                      </label>
                      <label>
                        FVC post-BD
                        <input name="Post_BD_FVC" type="number" min="0.5" max="8" step="0.01" placeholder="Opcional" />
                      </label>
                      <label>
                        FEV1 post-BD
                        <input name="Post_BD_FEV1" type="number" min="0.5" max="8" step="0.01" placeholder="Opcional" />
                      </label>
                    </div>
                  </section>

                  <div class="actions">
                    <button id="submit-button" class="primary-button" type="submit">Interpretar espirometría</button>
                    <span id="status" class="status">Esperando datos para interpretar.</span>
                  </div>
                </form>
              </section>

              <section class="card">
                <div>
                  <h3>Resultado del sistema</h3>
                  <p class="subtitle">Se muestra el patrón estimado junto con la interpretación derivada.</p>
                </div>

                <article class="result-card">
                  <div class="result-header">
                    <div>
                      <div class="result-label">Patrón estimado</div>
                      <div id="diagnosis" class="diagnosis">Esperando inferencia</div>
                    </div>
                    <div id="result-chip" class="chip">Sin ejecución</div>
                  </div>

                  <div id="probabilities" class="probabilities"></div>
                  <div id="warnings-box" class="notice" style="display: none;"></div>

                  <div>
                    <div class="result-label">Respuesta cruda</div>
                    <pre id="raw-result" class="raw-box">Todavía no hay respuesta del servidor.</pre>
                  </div>
                </article>
              </section>
            </section>
          </section>
        </section>
      </main>

      <script>
        const menuButtons = Array.from(document.querySelectorAll(".menu-button"));
        const screens = Array.from(document.querySelectorAll(".screen"));

        const trainingForm = document.getElementById("training-form");
        const datasetInput = document.getElementById("dataset-input");
        const trainSubmitButton = document.getElementById("train-submit-button");
        const trainStatus = document.getElementById("train-status");
        const trainingSummary = document.getElementById("training-summary");
        const trainingRawResult = document.getElementById("training-raw-result");

        const form = document.getElementById("prediction-form");
        const pdfForm = document.getElementById("pdf-form");
        const pdfInput = document.getElementById("pdf-input");
        const pdfSubmitButton = document.getElementById("pdf-submit-button");
        const uploadStatus = document.getElementById("upload-status");
        const submitButton = document.getElementById("submit-button");
        const status = document.getElementById("status");
        const diagnosis = document.getElementById("diagnosis");
        const resultChip = document.getElementById("result-chip");
        const probabilities = document.getElementById("probabilities");
        const rawResult = document.getElementById("raw-result");
        const warningsBox = document.getElementById("warnings-box");

        const fieldNames = [
          "Edad",
          "Genero",
          "Altura_cm",
          "Peso_kg",
          "FVC",
          "FEV1",
          "FVC_pct_pred",
          "FEV1_pct_pred",
          "Post_BD_FVC",
          "Post_BD_FEV1",
          "Fumador",
          "Calidad_Espirometria",
        ];

        function activateScreen(targetId) {
          for (const button of menuButtons) {
            button.classList.toggle("active", button.dataset.target === targetId);
          }

          for (const screen of screens) {
            screen.classList.toggle("active", screen.id === targetId);
          }
        }

        menuButtons.forEach((button) => {
          button.addEventListener("click", () => activateScreen(button.dataset.target));
        });

        function renderProbabilities(probabilityMap) {
          const entries = Object.entries(probabilityMap || {}).sort((a, b) => b[1] - a[1]);
          if (entries.length === 0) {
            probabilities.innerHTML = "<div class='result-label'>Sin probabilidades disponibles.</div>";
            return;
          }

          probabilities.innerHTML = entries
            .map(([label, value]) => {
              const percent = (Number(value) * 100).toFixed(2);
              return \`
                <div class="bar-row">
                  <div class="bar-top">
                    <span>\${label}</span>
                    <strong>\${percent}%</strong>
                  </div>
                  <div class="bar-track">
                    <div class="bar-fill" style="width: \${percent}%"></div>
                  </div>
                </div>
              \`;
            })
            .join("");
        }

        function renderWarnings(title, warnings, missingFields) {
          const rows = [];
          if (title) {
            rows.push("<strong>" + title + "</strong>");
          }
          if (Array.isArray(warnings) && warnings.length > 0) {
            rows.push("<ul class='warning-list'>" + warnings.map((item) => "<li>" + item + "</li>").join("") + "</ul>");
          }
          if (Array.isArray(missingFields) && missingFields.length > 0) {
            rows.push("<div>Campos faltantes o no detectados: " + missingFields.join(", ") + "</div>");
          }

          if (rows.length === 0) {
            warningsBox.style.display = "none";
            warningsBox.innerHTML = "";
            return;
          }

          warningsBox.style.display = "block";
          warningsBox.innerHTML = rows.join("");
        }

        function setSuccessState(body) {
          diagnosis.textContent = body.predicted_class || "Sin patrón";
          resultChip.textContent = "Inferencia completada";
          resultChip.className = "chip";
          renderProbabilities(body.probabilities);
          rawResult.textContent = JSON.stringify(body, null, 2);
          renderWarnings(
            "Interpretación derivada",
            body.interpretation?.notes || [],
            body.interpretation?.acceptable_quality === false ? ["La maniobra no es aceptable"] : []
          );
        }

        function setErrorState(body) {
          diagnosis.textContent = "No se pudo interpretar";
          resultChip.textContent = "Error";
          resultChip.className = "chip error";
          probabilities.innerHTML = "<div class='result-label'>Revisá los datos cargados o la conexión con la API ML.</div>";
          rawResult.textContent = JSON.stringify(body, null, 2);
          renderWarnings("", [], []);
        }

        function populateForm(fields) {
          for (const field of fieldNames) {
            if (fields[field] !== undefined) {
              const input = form.elements.namedItem(field);
              if (input) {
                input.value = fields[field];
              }
            }
          }
        }

        function renderTrainingSummary(body) {
          const rows = [
            { label: "Dataset cargado", value: body.dataset_path || "No informado" },
            { label: "Modelo generado", value: body.model_dir || "No informado" },
            { label: "Reportes", value: body.report_dir || "No informado" },
          ];

          trainingSummary.innerHTML = rows
            .map((row) => \`
              <div class="metric-item">
                <strong>\${row.label}</strong>
                <span>\${row.value}</span>
              </div>
            \`)
            .join("");
        }

        trainingForm.addEventListener("submit", async (event) => {
          event.preventDefault();
          const file = datasetInput.files[0];
          if (!file) {
            trainStatus.textContent = "Seleccioná un CSV antes de entrenar.";
            return;
          }

          const formData = new FormData();
          formData.append("datasetCsv", file);

          trainSubmitButton.disabled = true;
          trainSubmitButton.textContent = "Entrenando...";
          trainStatus.textContent = "Copiando dataset y ejecutando el entrenamiento en Python.";
          trainingRawResult.textContent = JSON.stringify({ dataset: file.name }, null, 2);

          try {
            const response = await fetch("/train", {
              method: "POST",
              body: formData,
            });
            const body = await response.json();

            if (!response.ok) {
              trainStatus.textContent = body.error || "No se pudo completar el entrenamiento.";
              trainingRawResult.textContent = JSON.stringify(body, null, 2);
              return;
            }

            renderTrainingSummary(body);
            trainingRawResult.textContent = JSON.stringify(body, null, 2);
            trainStatus.textContent = "Entrenamiento finalizado correctamente.";
          } catch (error) {
            const body = { error: error.message || "Falló la conexión durante el entrenamiento." };
            trainStatus.textContent = body.error;
            trainingRawResult.textContent = JSON.stringify(body, null, 2);
          } finally {
            trainSubmitButton.disabled = false;
            trainSubmitButton.textContent = "Cargar y entrenar";
          }
        });

        pdfForm.addEventListener("submit", async (event) => {
          event.preventDefault();
          const file = pdfInput.files[0];
          if (!file) {
            uploadStatus.textContent = "Seleccioná un PDF antes de continuar.";
            return;
          }

          const formData = new FormData();
          formData.append("spirometryPdf", file);

          pdfSubmitButton.disabled = true;
          pdfSubmitButton.textContent = "Leyendo PDF...";
          uploadStatus.textContent = "Enviando PDF a OpenAI para extraer los campos.";
          renderWarnings("", [], []);

          try {
            const response = await fetch("/extract-pdf", {
              method: "POST",
              body: formData,
            });
            const body = await response.json();

            if (!response.ok) {
              uploadStatus.textContent = body.error || "No se pudo procesar el PDF.";
              rawResult.textContent = JSON.stringify(body, null, 2);
              renderWarnings("La extracción falló.", [], []);
              return;
            }

            populateForm(body.extracted || {});
            uploadStatus.textContent = "Formulario completado con los datos detectados. Revisá los campos antes de interpretar.";
            rawResult.textContent = JSON.stringify(body, null, 2);
            renderWarnings("Extracción completada.", body.warnings || [], body.missingFields || []);
          } catch (error) {
            uploadStatus.textContent = error.message || "Falló la conexión durante la carga del PDF.";
            rawResult.textContent = JSON.stringify({ error: error.message }, null, 2);
            renderWarnings("La extracción falló.", [], []);
          } finally {
            pdfSubmitButton.disabled = false;
            pdfSubmitButton.textContent = "Cargar PDF y completar";
          }
        });

        form.addEventListener("submit", async (event) => {
          event.preventDefault();

          const formData = new FormData(form);
          const payload = Object.fromEntries(formData.entries());

          submitButton.disabled = true;
          submitButton.textContent = "Interpretando...";
          status.textContent = "Enviando datos al sistema...";
          resultChip.textContent = "Procesando";
          resultChip.className = "chip";
          diagnosis.textContent = "Interpretando estudio";
          probabilities.innerHTML = "<div class='result-label'>Calculando probabilidades...</div>";
          rawResult.textContent = JSON.stringify(payload, null, 2);

          try {
            const response = await fetch("/predict", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            const body = await response.json();

            if (!response.ok) {
              setErrorState(body);
              status.textContent = body.error || "La solicitud fue rechazada.";
              return;
            }

            setSuccessState(body);
            status.textContent = "Interpretación generada correctamente.";
          } catch (error) {
            const body = { error: error.message || "Falló la conexión con la web o la API ML." };
            setErrorState(body);
            status.textContent = body.error;
          } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Interpretar espirometría";
          }
        });
      </script>
    </body>
  </html>
  `;
}

module.exports = { renderHomePage };
