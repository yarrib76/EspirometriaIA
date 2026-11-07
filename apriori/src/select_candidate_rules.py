"""Evalúa y selecciona reglas candidatas con un criterio reproducible y diverso."""

from __future__ import annotations

import argparse
from pathlib import Path

import pandas as pd


PROJECT_DIR = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = PROJECT_DIR / "reports" / "rules" / "reglas_soporte_03.csv"
DEFAULT_EVALUATED = PROJECT_DIR / "reports" / "rules" / "reglas_soporte_03_evaluadas.csv"
DEFAULT_SELECTED = PROJECT_DIR / "reports" / "rules" / "reglas_seleccionadas.csv"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Selecciona reglas candidatas para recomendación.")
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT, help="CSV de reglas de entrada.")
    parser.add_argument(
        "--evaluated-output",
        type=Path,
        default=DEFAULT_EVALUATED,
        help="CSV con la evaluación completa.",
    )
    parser.add_argument(
        "--selected-output",
        type=Path,
        default=DEFAULT_SELECTED,
        help="CSV con las reglas seleccionadas.",
    )
    parser.add_argument("--min-confidence", type=float, default=0.40)
    parser.add_argument("--min-lift", type=float, default=1.20)
    parser.add_argument("--max-rules", type=int, default=20)
    parser.add_argument("--max-per-consequent", type=int, default=2)
    args = parser.parse_args()
    if not 0 <= args.min_confidence <= 1:
        parser.error("--min-confidence debe estar entre 0 y 1")
    if args.min_lift < 0:
        parser.error("--min-lift no puede ser negativo")
    if args.max_rules <= 0 or args.max_per_consequent <= 0:
        parser.error("Los límites deben ser mayores que cero")
    return args


def load_rules(path: Path) -> pd.DataFrame:
    if not path.is_file():
        raise FileNotFoundError(f"No existe el archivo de reglas: {path}")
    rules = pd.read_csv(path, encoding="utf-8-sig", sep=";")
    required = {
        "antecedente",
        "consecuente",
        "cantidad_antecedente",
        "cantidad_facturas",
        "soporte",
        "confianza",
        "lift",
    }
    missing = required.difference(rules.columns)
    if missing:
        raise ValueError(f"Faltan columnas requeridas: {sorted(missing)}")
    if rules.duplicated(["antecedente", "consecuente"]).any():
        raise ValueError("El archivo contiene reglas duplicadas")
    return rules


def sort_rules(rules: pd.DataFrame) -> pd.DataFrame:
    return rules.sort_values(
        [
            "confianza",
            "lift",
            "cantidad_facturas",
            "cantidad_antecedente",
            "antecedente",
            "consecuente",
        ],
        ascending=[False, False, False, True, True, True],
        kind="stable",
    )


def select_rules(
    rules: pd.DataFrame,
    min_confidence: float,
    min_lift: float,
    max_rules: int,
    max_per_consequent: int,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    evaluated = rules.copy()
    evaluated["elegible"] = (evaluated["confianza"] >= min_confidence) & (
        evaluated["lift"] >= min_lift
    )
    evaluated["ranking_global"] = pd.NA
    evaluated["ranking_consecuente"] = pd.NA
    evaluated["seleccionada"] = False
    evaluated["orden_seleccion"] = pd.NA
    evaluated["ronda_seleccion"] = pd.NA
    evaluated["motivo"] = ""

    eligible = sort_rules(evaluated.loc[evaluated["elegible"]].copy())
    eligible["ranking_global"] = range(1, len(eligible) + 1)
    eligible["ranking_consecuente"] = eligible.groupby("consecuente").cumcount() + 1
    evaluated.loc[eligible.index, "ranking_global"] = eligible["ranking_global"]
    evaluated.loc[eligible.index, "ranking_consecuente"] = eligible["ranking_consecuente"]

    selected_indices: list[int] = []
    selected_per_consequent: dict[str, int] = {}

    for round_number in range(1, max_per_consequent + 1):
        round_candidates = eligible.loc[eligible["ranking_consecuente"] == round_number]
        for index, row in round_candidates.iterrows():
            if len(selected_indices) >= max_rules:
                break
            consequent = row["consecuente"]
            if selected_per_consequent.get(consequent, 0) >= max_per_consequent:
                continue
            selected_indices.append(index)
            selected_per_consequent[consequent] = selected_per_consequent.get(consequent, 0) + 1
            evaluated.at[index, "seleccionada"] = True
            evaluated.at[index, "orden_seleccion"] = len(selected_indices)
            evaluated.at[index, "ronda_seleccion"] = round_number
            evaluated.at[index, "motivo"] = (
                f"Seleccionada en ronda {round_number}; regla {round_number} del consecuente."
            )
        if len(selected_indices) >= max_rules:
            break

    confidence_failed = evaluated["confianza"] < min_confidence
    lift_failed = evaluated["lift"] < min_lift
    evaluated.loc[confidence_failed & lift_failed, "motivo"] = (
        "Excluida: no alcanza confianza ni lift mínimos."
    )
    evaluated.loc[confidence_failed & ~lift_failed, "motivo"] = (
        "Excluida: no alcanza la confianza mínima."
    )
    evaluated.loc[~confidence_failed & lift_failed, "motivo"] = (
        "Excluida: no alcanza el lift mínimo."
    )
    not_selected = evaluated["elegible"] & ~evaluated["seleccionada"]
    over_consequent_limit = not_selected & (
        evaluated["ranking_consecuente"].astype("Int64") > max_per_consequent
    )
    evaluated.loc[over_consequent_limit, "motivo"] = (
        "Elegible, no seleccionada: supera el límite por consecuente."
    )
    evaluated.loc[not_selected & ~over_consequent_limit, "motivo"] = (
        "Elegible, no seleccionada: se alcanzó el máximo total de reglas."
    )

    evaluated["confianza_minima_seleccion"] = min_confidence
    evaluated["lift_minimo_seleccion"] = min_lift
    evaluated["maximo_reglas"] = max_rules
    evaluated["maximo_por_consecuente"] = max_per_consequent
    evaluated = evaluated.sort_values(
        ["seleccionada", "orden_seleccion", "ranking_global"],
        ascending=[False, True, True],
        na_position="last",
        kind="stable",
    )
    selected = evaluated.loc[evaluated["seleccionada"]].copy()
    return evaluated, selected


def main() -> None:
    args = parse_args()
    rules = load_rules(args.input)
    evaluated, selected = select_rules(
        rules,
        min_confidence=args.min_confidence,
        min_lift=args.min_lift,
        max_rules=args.max_rules,
        max_per_consequent=args.max_per_consequent,
    )

    args.evaluated_output.parent.mkdir(parents=True, exist_ok=True)
    args.selected_output.parent.mkdir(parents=True, exist_ok=True)
    evaluated.to_csv(
        args.evaluated_output, index=False, encoding="utf-8-sig", sep=";", float_format="%.8f"
    )
    selected.to_csv(
        args.selected_output, index=False, encoding="utf-8-sig", sep=";", float_format="%.8f"
    )

    print(f"Reglas evaluadas: {len(evaluated)}")
    print(f"Reglas elegibles: {int(evaluated['elegible'].sum())}")
    print(f"Reglas seleccionadas: {len(selected)}")
    print(f"Consecuentes representados: {selected['consecuente'].nunique()}")
    print(f"Evaluación: {args.evaluated_output.resolve()}")
    print(f"Selección: {args.selected_output.resolve()}")


if __name__ == "__main__":
    main()
