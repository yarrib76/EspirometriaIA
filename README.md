# Proyecto Espirometría

Monorepo para interpretación funcional de espirometría.

- `ml/`: entrenamiento, evaluación y servicio de inferencia en Python.
- `web/`: aplicación Node.js con Express para cargar un estudio y obtener patrón funcional e interpretación derivada.

## Primeros pasos

### Python / ML

```bash
cd ml
pip install -r requirements.txt
python -m src.data.generate_synthetic_dataset
python -m src.training.train_baseline
python -m src.inference.service
```

### Node / Web

```bash
cd web
npm install
npm run dev
```

La web ejecuta internamente la inferencia en Python usando `ml/.venv/Scripts/python.exe`. El flujo actual prioriza la interpretación funcional: patrón `Normal`, `Obstructivo`, `Restrictivo` o `Mixto`, junto con severidad y respuesta broncodilatadora.

## Docker

El contenedor levanta solo la app Node.js y ejecuta internamente Python para la inferencia. Si no encuentra un modelo entrenado en `ml/models`, por defecto genera el dataset sintético y entrena el baseline al arrancar.

### Build

```bash
docker build -t espirometria-ia .
```

### Run

```bash
docker run -d ^
  --name espirometria-ia ^
  -p 6060:6060 ^
  -e OPENAI_API_KEY=tu_api_key ^
  -e AUTO_BOOTSTRAP_MODEL=true ^
  espirometria-ia
```

Si ya tenés modelos entrenados y querés reutilizarlos desde el servidor, podés montar volumen sobre `ml/models` y `ml/data/raw`.

En Windows podés usar [develop.cmd](C:/Proyectos/Redes%20Neuronales/Espirometria/develop.cmd) para reconstruir y recrear el contenedor automáticamente en el puerto `6060`.
