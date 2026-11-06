"""Genera reglas de asociación auditables desde los itemsets frecuentes."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import pandas as pd
from mlxtend.frequent_patterns import association_rules


PROJECT_DIR = Path(__file__).resolve().parents[1]
DEFAULT_ITEMSETS_DIR = PROJECT_DIR / "reports" / "itemsets"
DEFAULT_OUTPUT_DIR = PROJECT_DIR / "reports" / "rules"
DEFAULT_MATRIX = PROJECT_DIR / "data" / "processed" / "matriz_binaria.csv"
DEFAULT_SUPPORTS = (2, 3, 4)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Genera reglas para los itemsets con soportes del 2 al 4 por ciento."
    )
    parser.add_argument(
        "--itemsets-dir", type=Path, default=DEFAULT_ITEMSETS_DIR, help="Directorio de itemsets."
    )
    parser.add_argument(
        "--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR, help="Directorio de reglas."
    )
    parser.add_argument(
        "--matrix", type=Path, default=DEFAULT_MATRIX, help="Matriz usada para contar transacciones."
    )
    parser.add_argument(
        "--supports", type=int, nargs="+", default=DEFAULT_SUPPORTS, help="Soportes a procesar."
    )
    parser.add_argument(
        "--min-confidence",
        type=float,
        default=0.30,
        help="Confianza mínima entre 0 y 1 (default: 0.30).",
    )
    parser.add_argument(
        "--min-lift",
        type=float,
        default=1.0,
        help="Lift mínimo exclusivo (default: 1.0).",
    )
    args = parser.parse_args()
    if not 0 <= args.min_confidence <= 1:
        parser.error("--min-confidence debe estar entre 0 y 1")
    if args.min_lift < 0:
        parser.error("--min-lift no puede ser negativo")
    if any(value <= 0 or value > 100 for value in args.supports):
        parser.error("Los soportes deben estar entre 1 y 100")
    return args


def load_itemsets(path: Path) -> pd.DataFrame:
    if not path.is_file():
        raise FileNotFoundError(f"No existe el archivo de itemsets: {path}")

    report = pd.read_csv(path, encoding="utf-8-sig", sep=";")
    required_columns = {"itemset", "soporte"}
    missing_columns = required_columns.difference(report.columns)
    if missing_columns:
        raise ValueError(f"Faltan columnas en {path.name}: {sorted(missing_columns)}")

    def parse_itemset(value: str) -> frozenset[str]:
        parsed = json.loads(value)
        if not isinstance(parsed, list) or not parsed:
            raise ValueError(f"Itemset inválido en {path.name}: {value}")
        return frozenset(str(category) for category in parsed)

    return pd.DataFrame(
        {
            "support": report["soporte"].astype(float),
            "itemsets": report["itemset"].map(parse_itemset),
        }
    )


def serialize_set(value: frozenset[str]) -> str:
    return json.dumps(sorted(value, key=str.casefold), ensure_ascii=False)


def build_report(
    itemsets: pd.DataFrame,
    transaction_count: int,
    support_percent: int,
    min_confidence: float,
    min_lift: float,
) -> pd.DataFrame:
    rules = association_rules(
        itemsets,
        metric="confidence",
        min_threshold=min_confidence,
        num_itemsets=transaction_count,
    )
    rules = rules.loc[
        (rules["lift"] > min_lift) & (rules["consequents"].map(len) == 1)
    ].copy()

    rules["antecedente"] = rules["antecedents"].map(serialize_set)
    rules["consecuente"] = rules["consequents"].map(serialize_set)
    rules["cantidad_antecedente"] = rules["antecedents"].map(len)
    rules["cantidad_consecuente"] = rules["consequents"].map(len)
    rules["cantidad_facturas"] = rules["support"].mul(transaction_count).round().astype(int)
    rules["soporte_porcentaje"] = rules["support"].mul(100)
    rules["confianza_porcentaje"] = rules["confidence"].mul(100)
    rules["soporte_minimo"] = support_percent / 100
    rules["confianza_minima"] = min_confidence
    rules["lift_minimo_exclusivo"] = min_lift

    rules = rules.sort_values(
        ["confidence", "lift", "support", "antecedente", "consecuente"],
        ascending=[False, False, False, True, True],
        kind="stable",
    )

    return rules[
        [
            "antecedente",
            "consecuente",
            "cantidad_antecedente",
            "cantidad_consecuente",
            "cantidad_facturas",
            "support",
            "soporte_porcentaje",
            "confidence",
            "confianza_porcentaje",
            "lift",
            "antecedent support",
            "consequent support",
            "soporte_minimo",
            "confianza_minima",
            "lift_minimo_exclusivo",
        ]
    ].rename(
        columns={
            "support": "soporte",
            "confidence": "confianza",
            "antecedent support": "soporte_antecedente",
            "consequent support": "soporte_consecuente",
        }
    )


def main() -> None:
    args = parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    if not args.matrix.is_file():
        raise FileNotFoundError(f"No existe la matriz binaria: {args.matrix}")
    transaction_count = len(
        pd.read_csv(args.matrix, encoding="utf-8-sig", sep=";", usecols=["NroFactura"])
    )
    if transaction_count == 0:
        raise ValueError("La matriz binaria no contiene facturas")

    for support_percent in sorted(set(args.supports)):
        itemsets_path = args.itemsets_dir / (
            f"apriori_itemsets_frecuentes_soporte_{support_percent:02d}.csv"
        )
        itemsets = load_itemsets(itemsets_path)
        report = build_report(
            itemsets,
            transaction_count=transaction_count,
            support_percent=support_percent,
            min_confidence=args.min_confidence,
            min_lift=args.min_lift,
        )
        output_path = args.output_dir / f"reglas_soporte_{support_percent:02d}.csv"
        report.to_csv(
            output_path,
            index=False,
            encoding="utf-8-sig",
            sep=";",
            float_format="%.8f",
        )
        print(
            f"Soporte {support_percent}%: {len(report)} reglas válidas -> {output_path.resolve()}"
        )


if __name__ == "__main__":
    main()
