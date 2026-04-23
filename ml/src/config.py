from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
MODELS_DIR = BASE_DIR / "models"
REPORTS_DIR = BASE_DIR / "reports"

DATASET_FILENAME = "dataset_espirometria_5000.csv"
DATASET_PATH = RAW_DATA_DIR / DATASET_FILENAME

TARGET_COLUMN = "Diagnostico"
FEATURE_COLUMNS = [
    "Edad",
    "Genero",
    "Altura_cm",
    "Peso_kg",
    "FVC",
    "FEV1",
    "Fumador",
]
NUMERIC_FEATURES = [
    "Edad",
    "Altura_cm",
    "Peso_kg",
    "FVC",
    "FEV1",
    "Fumador",
]
CATEGORICAL_FEATURES = ["Genero"]
EXPECTED_CLASSES = ["Normal", "EPOC", "Asma", "Restrictivo"]

RANDOM_STATE = 42
TRAIN_SIZE = 0.7
VALIDATION_SIZE = 0.15
TEST_SIZE = 0.15
