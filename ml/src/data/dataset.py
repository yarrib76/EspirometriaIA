from dataclasses import dataclass
from pathlib import Path

import pandas as pd
from sklearn.model_selection import train_test_split

from src.config import (
    EXPECTED_CLASSES,
    FEATURE_COLUMNS,
    RANDOM_STATE,
    TARGET_COLUMN,
    TEST_SIZE,
    VALIDATION_SIZE,
)


@dataclass
class DatasetSplits:
    x_train: pd.DataFrame
    x_val: pd.DataFrame
    x_test: pd.DataFrame
    y_train: pd.Series
    y_val: pd.Series
    y_test: pd.Series


def load_dataset(csv_path: Path) -> pd.DataFrame:
    dataframe = pd.read_csv(csv_path)
    validate_dataset(dataframe)
    return dataframe


def validate_dataset(dataframe: pd.DataFrame) -> None:
    required_columns = FEATURE_COLUMNS + [TARGET_COLUMN]
    missing_columns = [column for column in required_columns if column not in dataframe.columns]
    if missing_columns:
        raise ValueError(f"Faltan columnas obligatorias en el dataset: {missing_columns}")

    observed_classes = sorted(dataframe[TARGET_COLUMN].dropna().unique().tolist())
    expected_sorted = sorted(EXPECTED_CLASSES)
    if observed_classes != expected_sorted:
        raise ValueError(
            "Las clases observadas en Diagnostico no coinciden con las esperadas. "
            f"Esperadas={expected_sorted}, observadas={observed_classes}"
        )


def split_dataset(dataframe: pd.DataFrame) -> DatasetSplits:
    features = dataframe[FEATURE_COLUMNS].copy()
    target = dataframe[TARGET_COLUMN].copy()

    x_train, x_temp, y_train, y_temp = train_test_split(
        features,
        target,
        test_size=(TEST_SIZE + VALIDATION_SIZE),
        random_state=RANDOM_STATE,
        stratify=target,
    )

    validation_ratio = VALIDATION_SIZE / (TEST_SIZE + VALIDATION_SIZE)
    x_val, x_test, y_val, y_test = train_test_split(
        x_temp,
        y_temp,
        test_size=(1 - validation_ratio),
        random_state=RANDOM_STATE,
        stratify=y_temp,
    )

    return DatasetSplits(
        x_train=x_train.reset_index(drop=True),
        x_val=x_val.reset_index(drop=True),
        x_test=x_test.reset_index(drop=True),
        y_train=y_train.reset_index(drop=True),
        y_val=y_val.reset_index(drop=True),
        y_test=y_test.reset_index(drop=True),
    )
