import json
from datetime import datetime
from pathlib import Path

from src.config import MODELS_DIR, REPORTS_DIR


def get_next_experiment_dir(prefix: str = "baseline_dense") -> tuple[Path, Path]:
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    existing = sorted(path.name for path in MODELS_DIR.iterdir() if path.is_dir() and path.name.startswith("exp_"))
    next_index = len(existing) + 1
    experiment_name = f"exp_{next_index:03d}_{prefix}"

    model_dir = MODELS_DIR / experiment_name
    report_dir = REPORTS_DIR / experiment_name
    model_dir.mkdir(parents=True, exist_ok=False)
    report_dir.mkdir(parents=True, exist_ok=False)
    return model_dir, report_dir


def save_json(data: dict, output_path: Path) -> None:
    with output_path.open("w", encoding="utf-8") as handler:
        json.dump(data, handler, indent=2, ensure_ascii=False)


def utc_timestamp() -> str:
    return datetime.utcnow().isoformat() + "Z"
