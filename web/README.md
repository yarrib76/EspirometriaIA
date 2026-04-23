# Web Spirometry App

Aplicacion Node.js con Express organizada en estilo MVC. Node invoca internamente un proceso de Python para ejecutar la inferencia, por lo que no hace falta levantar una API Python aparte.

## Variables de entorno

- `OPENAI_API_KEY`: API key para extracción de datos desde PDF.
- `OPENAI_PDF_MODEL`: modelo multimodal para leer PDF. Default `gpt-4o-mini`.
- `ML_PYTHON_BIN`: ruta al ejecutable de Python que tiene TensorFlow y dependencias instaladas. Default `../ml/.venv/Scripts/python.exe`.

## Endpoints

- `GET /`: formulario web de prueba.
- `GET /health`: estado de la app web.
- `POST /extract-pdf`: sube una espirometría en PDF y devuelve campos extraídos para autocompletar el formulario.
- `POST /predict`: valida la entrada y ejecuta la inferencia interna en Python.
