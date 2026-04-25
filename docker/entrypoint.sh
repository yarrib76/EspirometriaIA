#!/bin/sh
set -e

APP_ROOT="/app"
ML_DIR="$APP_ROOT/ml"
WEB_DIR="$APP_ROOT/web"

mkdir -p "$ML_DIR/data/raw" "$ML_DIR/models" "$ML_DIR/reports"

MODEL_COUNT=$(find "$ML_DIR/models" -maxdepth 1 -type d -name 'exp_*' | wc -l | tr -d ' ')

if [ "$MODEL_COUNT" = "0" ]; then
  if [ "${AUTO_BOOTSTRAP_MODEL:-true}" = "true" ]; then
    echo "No se encontró un modelo entrenado. Generando dataset y entrenando baseline..."
    if [ ! -f "$ML_DIR/data/raw/dataset_espirometria_5000.csv" ]; then
      python3 -m src.data.generate_synthetic_dataset
    fi
    python3 -m src.training.train_baseline
  else
    echo "No se encontró un modelo entrenado en $ML_DIR/models y AUTO_BOOTSTRAP_MODEL=false"
    exit 1
  fi
fi

cd "$WEB_DIR"
exec node src/server.js
