# ML Spirometry Interpreter

Proyecto Python para entrenar, evaluar y servir un intérprete funcional de espirometría con TensorFlow/Keras.

## Estructura

- `data/raw/`: CSV originales.
- `data/processed/`: artefactos o datasets intermedios.
- `src/data/`: carga, validacion y split del dataset.
- `src/features/`: preprocesado y transformacion.
- `src/models/`: arquitecturas Keras.
- `src/training/`: scripts de entrenamiento por experimento.
- `src/evaluation/`: metricas y reportes.
- `src/inference/`: servicio HTTP para prediccion.
- `models/`: modelos y artefactos persistidos por corrida.
- `reports/`: metricas, matrices de confusion y configuraciones.

## Flujo recomendado

1. Generar o copiar el CSV a `data/raw/dataset_espirometria_5000.csv`.
2. Entrenar el baseline:

```bash
python -m src.training.train_baseline
```

3. Levantar la API de inferencia:

```bash
python -m src.inference.service
```

## Variables de entrada

- `Edad`
- `Genero`
- `Altura_cm`
- `Peso_kg`
- `FVC`
- `FEV1`
- `FEV1_FVC`
- `FVC_pct_pred`
- `FEV1_pct_pred`
- `Post_BD_FVC`
- `Post_BD_FEV1`
- `Post_BD_FEV1_FVC`
- `BD_FEV1_Delta_ml`
- `BD_FEV1_Delta_pct`
- `Fumador`
- `Calidad_Espirometria`
- `Broncodilatador_Realizado`

Etiqueta:

- `Patron_Espirometrico`
