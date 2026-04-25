import json
import os
import sys
from pathlib import Path

import tensorflow as tf

from src.clinical.interpretation import build_interpretation_summary, enrich_payload
from src.config import MODELS_DIR
from src.features.preprocessing import load_preprocessing_artifacts, transform_inference_input


def get_latest_model_dir() -> Path:
    experiment_dirs = sorted([path for path in MODELS_DIR.iterdir() if path.is_dir() and path.name.startswith("exp_")])
    if not experiment_dirs:
        raise FileNotFoundError("No hay modelos entrenados en ml/models.")
    return experiment_dirs[-1]


def get_model_dir() -> Path:
    env_model_dir = os.getenv("MODEL_DIR")
    return Path(env_model_dir) if env_model_dir else get_latest_model_dir()


def load_payload() -> dict:
    raw_input = sys.stdin.read().strip()
    if not raw_input:
        raise ValueError("No se recibió payload JSON por stdin.")

    return json.loads(raw_input)


def predict(payload: dict) -> dict:
    model_dir = get_model_dir()
    if not model_dir.exists():
        raise FileNotFoundError(f"El directorio del modelo no existe: {model_dir}")

    model = tf.keras.models.load_model(model_dir / "model.keras")
    preprocessor, label_encoder = load_preprocessing_artifacts(model_dir)
    enriched_payload = enrich_payload(payload)
    interpretation = build_interpretation_summary(enriched_payload)

    if not interpretation["acceptable_quality"]:
        return {
            "predicted_class": "No interpretable",
            "probabilities": {},
            "interpretation": interpretation,
            "model_dir": str(model_dir),
        }

    transformed = transform_inference_input(preprocessor, enriched_payload)
    probabilities = model.predict(transformed, verbose=0)[0]

    class_names = label_encoder.classes_.tolist()
    predicted_index = int(probabilities.argmax())

    return {
        "predicted_class": class_names[predicted_index],
        "probabilities": {class_name: float(probabilities[idx]) for idx, class_name in enumerate(class_names)},
        "interpretation": interpretation,
        "model_dir": str(model_dir),
    }


def main() -> int:
    try:
        payload = load_payload()
        result = predict(payload)
        print(json.dumps(result, ensure_ascii=False))
        return 0
    except Exception as error:
        print(json.dumps({"error": str(error)}, ensure_ascii=False), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
