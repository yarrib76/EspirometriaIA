"""Construye una matriz binaria factura-categoría desde la extracción normalizada."""

from __future__ import annotations

import argparse
import csv
from collections import defaultdict
from pathlib import Path


PROJECT_DIR = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = PROJECT_DIR / "data" / "extracted" / "transacciones_categorias.csv"
DEFAULT_OUTPUT = PROJECT_DIR / "data" / "processed" / "matriz_binaria.csv"
REQUIRED_COLUMNS = {"NroFactura", "Articulo", "categoriaWeb"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Construye la matriz binaria de categorías por factura."
    )
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT, help="CSV normalizado de entrada.")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="CSV de salida.")
    return parser.parse_args()


def load_transactions(input_path: Path) -> tuple[dict[str, set[str]], list[str]]:
    if not input_path.is_file():
        raise FileNotFoundError(f"No existe el CSV de entrada: {input_path}")

    categories_by_invoice: dict[str, set[str]] = defaultdict(set)
    all_categories: set[str] = set()

    with input_path.open("r", encoding="utf-8-sig", newline="") as input_file:
        reader = csv.DictReader(input_file, delimiter=";")
        missing_columns = REQUIRED_COLUMNS.difference(reader.fieldnames or [])
        if missing_columns:
            missing = ", ".join(sorted(missing_columns))
            raise ValueError(f"Faltan columnas requeridas en el CSV: {missing}")

        for line_number, row in enumerate(reader, start=2):
            invoice = (row["NroFactura"] or "").strip()
            category = (row["categoriaWeb"] or "").strip()
            if not invoice:
                raise ValueError(f"NroFactura vacío en la línea {line_number}")
            if not category:
                raise ValueError(f"categoriaWeb vacía en la línea {line_number}")

            categories_by_invoice[invoice].add(category)
            all_categories.add(category)

    if not categories_by_invoice:
        raise ValueError("El CSV de entrada no contiene transacciones válidas")

    return dict(categories_by_invoice), sorted(all_categories, key=str.casefold)


def invoice_sort_key(invoice: str) -> tuple[int, int | str]:
    try:
        return (0, int(invoice))
    except ValueError:
        return (1, invoice)


def write_binary_matrix(
    categories_by_invoice: dict[str, set[str]], categories: list[str], output_path: Path
) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8-sig", newline="") as output_file:
        writer = csv.writer(output_file, delimiter=";")
        writer.writerow(["NroFactura", *categories])
        for invoice in sorted(categories_by_invoice, key=invoice_sort_key):
            present_categories = categories_by_invoice[invoice]
            writer.writerow([invoice, *(int(category in present_categories) for category in categories)])


def main() -> None:
    args = parse_args()
    categories_by_invoice, categories = load_transactions(args.input)
    write_binary_matrix(categories_by_invoice, categories, args.output)

    present_values = sum(len(values) for values in categories_by_invoice.values())
    total_values = len(categories_by_invoice) * len(categories)
    density = present_values / total_values if total_values else 0

    print(f"Matriz generada: {args.output.resolve()}")
    print(f"Facturas: {len(categories_by_invoice)}")
    print(f"Categorías: {len(categories)}")
    print(f"Presencias (valor 1): {present_values}")
    print(f"Densidad: {density:.4%}")


if __name__ == "__main__":
    main()
