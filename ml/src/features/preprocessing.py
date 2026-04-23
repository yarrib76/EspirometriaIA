from dataclasses import dataclass
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, OneHotEncoder, StandardScaler

from src.config import CATEGORICAL_FEATURES, NUMERIC_FEATURES


@dataclass
class PreparedData:
    # Matrices listas para entrar al modelo.
    x_train: np.ndarray
    x_val: np.ndarray
    x_test: np.ndarray
    # Etiquetas codificadas como enteros.
    y_train: np.ndarray
    y_val: np.ndarray
    y_test: np.ndarray
    # Artefactos necesarios para reproducir el mismo preprocesado en inferencia.
    preprocessor: Pipeline
    label_encoder: LabelEncoder


def build_preprocessor() -> Pipeline:
    # Estandariza variables numéricas y aplica one-hot encoding a Genero.
    transformer = ColumnTransformer(
        transformers=[
            ("numeric", StandardScaler(), NUMERIC_FEATURES),
            ("categorical", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL_FEATURES),
        ]
    )
    return Pipeline([("transformer", transformer)])


def fit_transform_features(
    x_train: pd.DataFrame,
    x_val: pd.DataFrame,
    x_test: pd.DataFrame,
    y_train: pd.Series,
    y_val: pd.Series,
    y_test: pd.Series,
) -> PreparedData:
    # Define el pipeline de transformación de X y el codificador de y.
    preprocessor = build_preprocessor()
    label_encoder = LabelEncoder()

    # Ajusta el preprocesado solo con train y reutiliza esa transformación en val/test.
    x_train_processed = preprocessor.fit_transform(x_train)
    x_val_processed = preprocessor.transform(x_val)
    x_test_processed = preprocessor.transform(x_test)

    # Convierte las clases de texto a índices enteros para clasificación multiclase.
    y_train_encoded = label_encoder.fit_transform(y_train)
    y_val_encoded = label_encoder.transform(y_val)
    y_test_encoded = label_encoder.transform(y_test)

    return PreparedData(
        x_train=x_train_processed.astype(np.float32),
        x_val=x_val_processed.astype(np.float32),
        x_test=x_test_processed.astype(np.float32),
        y_train=y_train_encoded.astype(np.int32),
        y_val=y_val_encoded.astype(np.int32),
        y_test=y_test_encoded.astype(np.int32),
        preprocessor=preprocessor,
        label_encoder=label_encoder,
    )


def transform_inference_input(preprocessor: Pipeline, payload: dict[str, Any]) -> np.ndarray:
    # Aplica el mismo pipeline de entrenamiento a un caso nuevo de inferencia.
    dataframe = pd.DataFrame([payload])
    transformed = preprocessor.transform(dataframe)
    return transformed.astype(np.float32)


def save_preprocessing_artifacts(preprocessor: Pipeline, label_encoder: LabelEncoder, output_dir) -> None:
    # Guarda el pipeline y el encoder para reutilizarlos junto al modelo entrenado.
    joblib.dump(preprocessor, output_dir / "preprocessor.joblib")
    joblib.dump(label_encoder, output_dir / "label_encoder.joblib")


def load_preprocessing_artifacts(model_dir):
    # Recupera los artefactos necesarios para predecir con datos nuevos.
    preprocessor = joblib.load(model_dir / "preprocessor.joblib")
    label_encoder = joblib.load(model_dir / "label_encoder.joblib")
    return preprocessor, label_encoder
