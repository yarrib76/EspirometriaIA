import json
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns
from sklearn.metrics import classification_report, confusion_matrix


def evaluate_predictions(y_true, y_pred, class_names):
    report = classification_report(y_true, y_pred, target_names=class_names, output_dict=True, zero_division=0)
    matrix = confusion_matrix(y_true, y_pred)
    return report, matrix


def save_metrics(report: dict, output_path: Path) -> None:
    with output_path.open("w", encoding="utf-8") as handler:
        json.dump(report, handler, indent=2, ensure_ascii=False)


def save_confusion_matrix(matrix: np.ndarray, class_names, output_path: Path) -> None:
    plt.figure(figsize=(8, 6))
    sns.heatmap(matrix, annot=True, fmt="d", cmap="Blues", xticklabels=class_names, yticklabels=class_names)
    plt.xlabel("Predicción")
    plt.ylabel("Real")
    plt.title("Matriz de confusión")
    plt.tight_layout()
    plt.savefig(output_path)
    plt.close()
