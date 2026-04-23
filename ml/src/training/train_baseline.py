import json
from pathlib import Path

import tensorflow as tf

from src.config import DATASET_PATH
from src.data.dataset import load_dataset, split_dataset
from src.evaluation.metrics import evaluate_predictions, save_confusion_matrix, save_metrics
from src.features.preprocessing import fit_transform_features, save_preprocessing_artifacts
from src.models.baseline_dense import build_baseline_dense
from src.utils.io import get_next_experiment_dir, save_json, utc_timestamp


def run_training(csv_path: Path = DATASET_PATH) -> tuple[Path, Path]:
    # Verifica que exista el CSV de entrada antes de iniciar el pipeline.
    if not csv_path.exists():
        raise FileNotFoundError(
            f"No se encontró el dataset en {csv_path}. "
            "Generalo con `python -m src.data.generate_synthetic_dataset` o copiá el CSV a data/raw/."
        )

    # Carga el dataset y valida columnas/clases esperadas.
    dataframe = load_dataset(csv_path)
    # Separa en entrenamiento, validación y prueba con muestreo estratificado (divide la población en grupos homogéneos).
    splits = split_dataset(dataframe)
    # Aplica encoding y escalado, y transforma la etiqueta a enteros.
    prepared = fit_transform_features(
        splits.x_train,
        splits.x_val,
        splits.x_test,
        splits.y_train,
        splits.y_val,
        splits.y_test,
    )

    # Construye la red baseline: 1 capa oculta de 2 neuronas + salida softmax.
    model = build_baseline_dense(
        input_dim=prepared.x_train.shape[1],
        output_classes=len(prepared.label_encoder.classes_),
    )

    # Detiene el entrenamiento si la pérdida de validación deja de mejorar.
    early_stopping = tf.keras.callbacks.EarlyStopping(
        monitor="val_loss",
        patience=10,
        restore_best_weights=True,
    )

    # Entrena el modelo sobre train y monitorea desempeño en validation.
    history = model.fit(
        prepared.x_train,
        prepared.y_train,
        validation_data=(prepared.x_val, prepared.y_val),
        epochs=100,
        batch_size=32,
        callbacks=[early_stopping],
        verbose=1,
    )

    # Evalúa el modelo final en los tres subconjuntos para comparar generalización.
    train_loss, train_accuracy = model.evaluate(prepared.x_train, prepared.y_train, verbose=0)
    val_loss, val_accuracy = model.evaluate(prepared.x_val, prepared.y_val, verbose=0)
    test_loss, test_accuracy = model.evaluate(prepared.x_test, prepared.y_test, verbose=0)

    # Genera predicciones sobre test para calcular métricas por clase.
    predictions = model.predict(prepared.x_test, verbose=0)
    y_pred = predictions.argmax(axis=1)
    class_names = prepared.label_encoder.classes_.tolist()
    classification, confusion = evaluate_predictions(prepared.y_test, y_pred, class_names)

    # Crea una carpeta única por experimento y guarda modelo + preprocesado.
    model_dir, report_dir = get_next_experiment_dir()
    model.save(model_dir / "model.keras")
    model.export(model_dir / "saved_model")
    save_preprocessing_artifacts(prepared.preprocessor, prepared.label_encoder, model_dir)

    # Serializa el historial de entrenamiento para analizar evolución por época.
    history_payload = {key: [float(value) for value in values] for key, values in history.history.items()}
    # Resume métricas finales y metadatos de la corrida.
    metrics_payload = {
        "timestamp": utc_timestamp(),
        "dataset_path": str(csv_path),
        "input_dim": int(prepared.x_train.shape[1]),
        "classes": class_names,
        "train": {"loss": float(train_loss), "accuracy": float(train_accuracy)},
        "validation": {"loss": float(val_loss), "accuracy": float(val_accuracy)},
        "test": {"loss": float(test_loss), "accuracy": float(test_accuracy)},
        "classification_report": classification,
    }
    # Guarda la configuración principal para reproducir este experimento.
    config_payload = {
        "model_name": "baseline_dense",
        "hidden_layers": [2],
        "activation": "relu",
        "output_activation": "softmax",
        "loss": "sparse_categorical_crossentropy",
        "optimizer": "adam",
        "epochs": 100,
        "batch_size": 32,
    }

    # Exporta reportes numéricos y visuales del experimento.
    save_metrics(metrics_payload, report_dir / "metrics.json")
    save_confusion_matrix(confusion, class_names, report_dir / "confusion_matrix.png")
    save_json(history_payload, report_dir / "history.json")
    save_json(config_payload, report_dir / "config.json")
    save_json({"model_dir": str(model_dir), "report_dir": str(report_dir)}, report_dir / "artifacts.json")

    return model_dir, report_dir


if __name__ == "__main__":
    model_output, report_output = run_training()
    print(json.dumps({"model_dir": str(model_output), "report_dir": str(report_output)}, indent=2))
