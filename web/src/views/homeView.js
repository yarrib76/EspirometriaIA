function renderHomePage() {
  return `
  <!DOCTYPE html>
  <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Generador de Diagnóstico Espirométrico</title>
      <style>
        :root {
          --bg: #f5efe5;
          --panel: rgba(255, 250, 242, 0.92);
          --panel-strong: #fffdf8;
          --text: #22303b;
          --muted: #637381;
          --line: rgba(82, 104, 122, 0.18);
          --primary: #176087;
          --primary-2: #3d8db8;
          --accent: #dd8b38;
          --ok: #1f7a5c;
          --error: #b54545;
          --shadow: 0 22px 55px rgba(34, 48, 59, 0.14);
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: Cambria, Georgia, serif;
          color: var(--text);
          background:
            radial-gradient(circle at top left, rgba(23, 96, 135, 0.18), transparent 30%),
            radial-gradient(circle at bottom right, rgba(221, 139, 56, 0.16), transparent 26%),
            linear-gradient(135deg, #efe3cf, var(--bg) 42%, #f8f4ec);
          min-height: 100vh;
        }

        .page {
          width: min(1180px, calc(100% - 32px));
          margin: 0 auto;
          padding: 28px 0 56px;
        }

        .hero {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 22px;
          align-items: stretch;
        }

        .card {
          background: var(--panel);
          backdrop-filter: blur(10px);
          border: 1px solid var(--line);
          border-radius: 28px;
          box-shadow: var(--shadow);
        }

        .intro {
          padding: 30px;
          position: relative;
          overflow: hidden;
        }

        .intro::after {
          content: "";
          position: absolute;
          inset: auto -50px -50px auto;
          width: 180px;
          height: 180px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(61, 141, 184, 0.22), transparent 68%);
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(23, 96, 135, 0.08);
          color: var(--primary);
          font-size: 0.84rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        h1 {
          margin: 18px 0 14px;
          font-size: clamp(2.2rem, 5vw, 4.2rem);
          line-height: 0.95;
          letter-spacing: -0.03em;
        }

        .intro p {
          margin: 0;
          max-width: 52ch;
          color: var(--muted);
          font-size: 1.02rem;
        }

        .facts {
          margin-top: 26px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .fact {
          padding: 16px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.58);
          border: 1px solid rgba(82, 104, 122, 0.12);
        }

        .fact strong {
          display: block;
          font-size: 1.2rem;
          margin-bottom: 6px;
        }

        .fact span {
          color: var(--muted);
          font-size: 0.92rem;
        }

        .panel {
          padding: 28px;
          display: grid;
          gap: 22px;
        }

        .panel h2,
        .panel h3 {
          margin: 0;
        }

        .subtitle {
          color: var(--muted);
          margin-top: 6px;
        }

        form {
          display: grid;
          gap: 18px;
        }

        .upload-form {
          display: grid;
          gap: 14px;
        }

        .group {
          display: grid;
          gap: 12px;
          padding: 18px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(82, 104, 122, 0.11);
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
          border: 1px solid rgba(82, 104, 122, 0.18);
          border-radius: 14px;
          padding: 12px 14px;
          background: var(--panel-strong);
          color: var(--text);
          transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
        }

        input:focus,
        select:focus {
          outline: none;
          border-color: rgba(23, 96, 135, 0.5);
          box-shadow: 0 0 0 4px rgba(23, 96, 135, 0.1);
          transform: translateY(-1px);
        }

        .actions {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .stack {
          display: grid;
          gap: 12px;
        }

        button {
          border: none;
          border-radius: 16px;
          padding: 14px 22px;
          color: #fff;
          font-weight: 700;
          background: linear-gradient(135deg, var(--primary), var(--primary-2));
          box-shadow: 0 18px 28px rgba(23, 96, 135, 0.24);
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
        }

        button:hover {
          transform: translateY(-1px);
          box-shadow: 0 20px 32px rgba(23, 96, 135, 0.28);
          filter: saturate(1.05);
        }

        button:disabled {
          cursor: wait;
          opacity: 0.75;
        }

        .status {
          font-size: 0.92rem;
          color: var(--muted);
        }

        .upload-status {
          min-height: 20px;
          font-size: 0.92rem;
          color: var(--muted);
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
          transition: width 0.35s ease;
        }

        .raw-box {
          margin: 0;
          padding: 16px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.05);
          color: #d9e5ea;
          overflow: auto;
          font-size: 0.88rem;
        }

        .notice {
          padding: 14px 16px;
          border-radius: 16px;
          background: rgba(23, 96, 135, 0.08);
          border: 1px solid rgba(23, 96, 135, 0.12);
          color: var(--text);
          font-size: 0.93rem;
        }

        .warning-list {
          margin: 0;
          padding-left: 18px;
          color: #ffe0b0;
        }

        @media (max-width: 900px) {
          .hero {
            grid-template-columns: 1fr;
          }

          .facts,
          .grid {
            grid-template-columns: 1fr;
          }
        }
      </style>
    </head>
    <body>
      <main class="page">
        <section class="hero">
          <article class="intro card">
            <span class="eyebrow">Sistema de apoyo diagnóstico</span>
            <h1>Generador de diagnóstico espirométrico</h1>
            <p>
              Ingresá las variables clínicas y funcionales del paciente para consultar el modelo de
              clasificación entrenado con TensorFlow/Keras.
            </p>
            <div class="facts">
              <div class="fact">
                <strong>4 clases</strong>
                <span>Asma, EPOC, Normal y Restrictivo.</span>
              </div>
              <div class="fact">
                <strong>7 entradas</strong>
                <span>Variables no derivadas seleccionadas para el baseline.</span>
              </div>
              <div class="fact">
                <strong>API Python</strong>
                <span>La web consume el endpoint de inferencia del modelo.</span>
              </div>
            </div>
          </article>

          <section class="panel card">
            <div>
              <h2>Formulario clínico</h2>
              <p class="subtitle">Podés cargar un PDF de espirometría o completar los datos manualmente.</p>
            </div>

            <section class="group">
              <div class="group-title">Carga automática desde PDF</div>
              <form id="pdf-form" class="upload-form">
                <label>
                  Informe de espirometría en PDF
                  <input id="pdf-input" name="spirometryPdf" type="file" accept=".pdf,application/pdf" required />
                  <span class="hint">El sistema intentará leer los campos clínicos y completar el formulario.</span>
                </label>
                <div class="actions">
                  <button id="pdf-submit-button" type="submit">Cargar PDF y completar</button>
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
                    <span class="hint">Años cumplidos.</span>
                  </label>
                  <label>
                    Género
                    <select name="Genero" required>
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                    </select>
                    <span class="hint">Se usa como variable categórica.</span>
                  </label>
                  <label>
                    Altura (cm)
                    <input name="Altura_cm" type="number" min="120" max="220" placeholder="Ej. 172" required />
                    <span class="hint">Altura del paciente en centímetros.</span>
                  </label>
                  <label>
                    Peso (kg)
                    <input name="Peso_kg" type="number" min="30" max="250" step="0.1" placeholder="Ej. 81.5" required />
                    <span class="hint">Peso actual expresado en kilogramos.</span>
                  </label>
                </div>
              </section>

              <section class="group">
                <div class="group-title">Parámetros espirométricos</div>
                <div class="grid">
                  <label>
                    FVC
                    <input name="FVC" type="number" min="0.5" max="8" step="0.01" placeholder="Ej. 3.40" required />
                    <span class="hint">Capacidad vital forzada.</span>
                  </label>
                  <label>
                    FEV1
                    <input name="FEV1" type="number" min="0.5" max="8" step="0.01" placeholder="Ej. 2.10" required />
                    <span class="hint">Volumen espiratorio forzado en el primer segundo.</span>
                  </label>
                  <label>
                    Fumador
                    <select name="Fumador" required>
                      <option value="0">No</option>
                      <option value="1">Sí</option>
                    </select>
                    <span class="hint">Variable binaria usada por el modelo.</span>
                  </label>
                </div>
              </section>

              <div class="actions">
                <button id="submit-button" type="submit">Generar diagnóstico</button>
                <span id="status" class="status">Esperando datos para inferir.</span>
              </div>
            </form>
          </section>
        </section>

        <section class="panel card" style="margin-top: 22px;">
          <div>
            <h3>Resultado del modelo</h3>
            <p class="subtitle">La clase predicha aparece destacada junto con la distribución de probabilidades.</p>
          </div>

          <article class="result-card">
            <div class="result-header">
              <div>
                <div class="result-label">Diagnóstico predicho</div>
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
      </main>

      <script>
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

        const fieldNames = ["Edad", "Genero", "Altura_cm", "Peso_kg", "FVC", "FEV1", "Fumador"];

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

        function setSuccessState(body) {
          diagnosis.textContent = body.predicted_class || "Sin clase";
          resultChip.textContent = "Inferencia completada";
          resultChip.className = "chip";
          renderProbabilities(body.probabilities);
          rawResult.textContent = JSON.stringify(body, null, 2);
        }

        function setErrorState(body) {
          diagnosis.textContent = "No se pudo generar el diagnóstico";
          resultChip.textContent = "Error";
          resultChip.className = "chip error";
          probabilities.innerHTML = "<div class='result-label'>Revisá los datos cargados o la conexión con la API ML.</div>";
          rawResult.textContent = JSON.stringify(body, null, 2);
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
            uploadStatus.textContent = "Formulario completado con los datos detectados. Revisá los campos antes de inferir.";
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
          submitButton.textContent = "Generando...";
          status.textContent = "Enviando datos al modelo...";
          resultChip.textContent = "Procesando";
          resultChip.className = "chip";
          diagnosis.textContent = "Analizando caso";
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
            status.textContent = "Diagnóstico generado correctamente.";
          } catch (error) {
            const body = { error: error.message || "Falló la conexión con la web o la API ML." };
            setErrorState(body);
            status.textContent = body.error;
          } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Generar diagnóstico";
          }
        });
      </script>
    </body>
  </html>
  `;
}

module.exports = { renderHomePage };
