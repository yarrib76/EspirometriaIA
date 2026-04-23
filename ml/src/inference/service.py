import os
from pathlib import Path

import tensorflow as tf
from flask import Flask, jsonify, request

from src.config import FEATURE_COLUMNS, MODELS_DIR
from src.features.preprocessing import load_preprocessing_artifacts, transform_inference_input


def get_latest_model_dir() -> Path:
    experiment_dirs = sorted([path for path in MODELS_DIR.iterdir() if path.is_dir() and path.name.startswith("exp_")])
    if not experiment_dirs:
        raise FileNotFoundError("No hay modelos entrenados en ml/models.")
    return experiment_dirs[-1]


def create_app(model_dir: Path | None = None) -> Flask:
    env_model_dir = os.getenv("MODEL_DIR")
    selected_model_dir = model_dir or (Path(env_model_dir) if env_model_dir else get_latest_model_dir())
    if not selected_model_dir.exists():
        raise FileNotFoundError(f"El directorio del modelo no existe: {selected_model_dir}")

    model = tf.keras.models.load_model(selected_model_dir / "model.keras")
    preprocessor, label_encoder = load_preprocessing_artifacts(selected_model_dir)

    app = Flask(__name__)

    @app.get("/health")
    def health():
        return jsonify({"status": "ok", "model_dir": str(selected_model_dir)})

    @app.post("/predict")
    def predict():
        payload = request.get_json(silent=True) or {}
        missing = [field for field in FEATURE_COLUMNS if field not in payload]
        if missing:
            return jsonify({"error": f"Faltan campos obligatorios: {missing}"}), 400

        try:
            transformed = transform_inference_input(preprocessor, payload)
            probabilities = model.predict(transformed, verbose=0)[0]
        except Exception as error:
            return jsonify({"error": f"Payload inválido o no compatible con el modelo: {error}"}), 400

        predicted_index = int(probabilities.argmax())
        class_names = label_encoder.classes_.tolist()
        probability_map = {class_name: float(probabilities[idx]) for idx, class_name in enumerate(class_names)}

        return jsonify(
            {
                "predicted_class": class_names[predicted_index],
                "probabilities": probability_map,
            }
        )

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=8000, debug=True)
