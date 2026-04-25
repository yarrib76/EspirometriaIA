from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
MODELS_DIR = BASE_DIR / "models"
REPORTS_DIR = BASE_DIR / "reports"

DATASET_FILENAME = "dataset_espirometria_interpretacion_5000.csv"
DATASET_PATH = RAW_DATA_DIR / DATASET_FILENAME

TARGET_COLUMN = "Patron_Espirometrico"
FEATURE_COLUMNS = [
    "Edad",
    "Genero",
    "Altura_cm",
    "Peso_kg",
    "FVC",
    "FEV1",
    "FEV1_FVC",
    "FVC_pct_pred",
    "FEV1_pct_pred",
    "Post_BD_FVC",
    "Post_BD_FEV1",
    "Post_BD_FEV1_FVC",
    "BD_FEV1_Delta_ml",
    "BD_FEV1_Delta_pct",
    "Fumador",
    "Calidad_Espirometria",
    "Broncodilatador_Realizado",
]
NUMERIC_FEATURES = [
    "Edad",
    "Altura_cm",
    "Peso_kg",
    "FVC",
    "FEV1",
    "FEV1_FVC",
    "FVC_pct_pred",
    "FEV1_pct_pred",
    "Post_BD_FVC",
    "Post_BD_FEV1",
    "Post_BD_FEV1_FVC",
    "BD_FEV1_Delta_ml",
    "BD_FEV1_Delta_pct",
    "Fumador",
    "Calidad_Espirometria",
    "Broncodilatador_Realizado",
]
CATEGORICAL_FEATURES = ["Genero"]
EXPECTED_CLASSES = ["Normal", "Obstructivo", "Restrictivo", "Mixto"]

RANDOM_STATE = 42
TRAIN_SIZE = 0.7
VALIDATION_SIZE = 0.15
TEST_SIZE = 0.15
