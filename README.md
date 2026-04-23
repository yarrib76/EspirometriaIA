# Proyecto Espirometría

Monorepo inicial para clasificación de resultados de espirometría.

- `ml/`: entrenamiento, evaluación y servicio de inferencia en Python.
- `web/`: aplicación Node.js con Express en estilo MVC para interactuar con el modelo.

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

La web ejecuta internamente la inferencia en Python usando `ml/.venv/Scripts/python.exe`. Solo necesitás tener el modelo ya entrenado y el entorno virtual de `ml` configurado.
