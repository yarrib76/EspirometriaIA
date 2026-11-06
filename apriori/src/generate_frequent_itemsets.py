"""Genera itemsets frecuentes para distintos umbrales de soporte."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import pandas as pd
from mlxtend.frequent_patterns import apriori


PROJECT_DIR = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = PROJECT_DIR / "data" / "processed" / "matriz_binaria.csv"
DEFAULT_OUTPUT_DIR = PROJECT_DIR / "reports" / "itemsets"
DEFAULT_SUPPORTS = (1, 2, 3, 4, 5)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Genera itemsets frecuentes con soportes mínimos del 1 al 5 por ciento."
    )
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT, help="Matriz binaria de entrada.")
    parser.add_argument(
        "--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR, help="Directorio para los reportes."
    )
    parser.add_argument(
        "--supports",
        type=int,
        nargs="+",
        default=DEFAULT_SUPPORTS,
        help="Soportes mínimos expresados como porcentajes enteros (default: 1 2 3 4 5).",
    )
    args = parser.parse_args()
    invalid = [value for value in args.supports if value <= 0 or value > 100]
    if invalid:
        parser.error("Los soportes deben estar entre 1 y 100")
    return args


def load_binary_matrix(input_path: Path) -> tuple[pd.Series, pd.DataFrame]:
    if not input_path.is_file():
        raise FileNotFoundError(f"No existe la matriz binaria: {input_path}")

    matrix = pd.read_csv(
        input_path, encoding="utf-8-sig", sep=";", dtype={"NroFactura": "string"}
    )
    if "NroFactura" not in matrix.columns:
        raise ValueError("La matriz no contiene la columna NroFactura")
    if matrix.empty:
        raise ValueError("La matriz binaria no contiene facturas")
    if matrix["NroFactura"].isna().any() or matrix["NroFactura"].duplicated().any():
        raise ValueError("NroFactura contiene valores nulos o duplicados")

    invoice_numbers = matrix.pop("NroFactura")
    invalid_values = set(pd.unique(matrix.to_numpy().ravel())).difference({0, 1, False, True})
    if invalid_values:
        raise ValueError(f"La matriz contiene valores distintos de 0 y 1: {invalid_values}")
    if matrix.columns.duplicated().any():
        raise ValueError("La matriz contiene columnas de categorías duplicadas")

    return invoice_numbers, matrix.astype(bool)


def serialize_itemsets(itemsets: pd.DataFrame, transaction_count: int) -> pd.DataFrame:
    report = itemsets.copy()
    report["categorias_lista"] = report["itemsets"].map(lambda value: sorted(value, key=str.casefold))
    report["itemset"] = report["categorias_lista"].map(
        lambda value: json.dumps(value, ensure_ascii=False)
    )
    report["cantidad_categorias"] = report["categorias_lista"].map(len)
    report["cantidad_facturas"] = report["support"].mul(transaction_count).round().astype(int)
    report["soporte_porcentaje"] = report["support"].mul(100)
    report["orden_alfabetico"] = report["categorias_lista"].map(lambda value: " | ".join(value))
    report = report.sort_values(
        ["support", "cantidad_categorias", "orden_alfabetico"],
        ascending=[False, True, True],
        kind="stable",
    )
    return report[
        ["itemset", "cantidad_categorias", "cantidad_facturas", "support", "soporte_porcentaje"]
    ].rename(columns={"support": "soporte"})


def main() -> None:
    args = parse_args()
    invoice_numbers, matrix = load_binary_matrix(args.input)
    transaction_count = len(invoice_numbers)
    args.output_dir.mkdir(parents=True, exist_ok=True)

    print(f"Facturas analizadas: {transaction_count}")
    print(f"Categorías analizadas: {len(matrix.columns)}")

    for support_percent in sorted(set(args.supports)):
        minimum_support = support_percent / 100
        itemsets = apriori(matrix, min_support=minimum_support, use_colnames=True)
        report = serialize_itemsets(itemsets, transaction_count)
        output_path = args.output_dir / (
            f"apriori_itemsets_frecuentes_soporte_{support_percent:02d}.csv"
        )
        report.to_csv(
            output_path,
            index=False,
            encoding="utf-8-sig",
            sep=";",
            float_format="%.8f",
        )
        print(
            f"Soporte {support_percent}%: {len(report)} itemsets -> {output_path.resolve()}"
        )


if __name__ == "__main__":
    main()
