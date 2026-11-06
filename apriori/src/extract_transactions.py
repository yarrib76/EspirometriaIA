"""Extrae facturas y categorías para construir el dataset de Apriori."""

from __future__ import annotations

import argparse
import csv
import os
from pathlib import Path

import mysql.connector


PROJECT_DIR = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = PROJECT_DIR / "data" / "extracted" / "transacciones_categorias.csv"


def required_environment(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Falta la variable de entorno requerida: {name}")
    return value


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Extrae las últimas facturas elegibles y sus categorías web."
    )
    parser.add_argument(
        "--invoice-limit",
        type=int,
        default=int(os.getenv("APRIORI_INVOICE_LIMIT", "1500")),
        help="Cantidad de facturas distintas a seleccionar (default: 1500).",
    )
    parser.add_argument(
        "--catalog-run-id",
        type=int,
        default=int(os.getenv("APRIORI_CATALOG_RUN_ID", "970")),
        help="ID de provecomerce usado como versión del catálogo (default: 970).",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help="Ruta del CSV de salida.",
    )
    args = parser.parse_args()
    if args.invoice_limit <= 0:
        parser.error("--invoice-limit debe ser mayor que cero")
    return args


def extract_rows(invoice_limit: int, catalog_run_id: int) -> list[tuple[int, str, str]]:
    connection = mysql.connector.connect(
        host=required_environment("DB_HOST"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=required_environment("DB_USER"),
        password=required_environment("DB_PASSWORD"),
        database=required_environment("DB_NAME"),
        connection_timeout=15,
    )

    query = """
        SELECT DISTINCT
            f.NroFactura,
            f.Articulo,
            TRIM(s.categoriaWeb) AS categoriaWeb
        FROM factura AS f
        INNER JOIN (
            SELECT
                NroFactura,
                MAX(Fecha) AS ultima_fecha
            FROM factura
            WHERE (Estado IS NULL OR Estado <> 2)
              AND NroFactura IS NOT NULL
            GROUP BY NroFactura
            ORDER BY ultima_fecha DESC, NroFactura DESC
            LIMIT %s
        ) AS ultimas_facturas
            ON ultimas_facturas.NroFactura = f.NroFactura
        INNER JOIN statusecomercesincro AS s
            ON s.articulo = f.Articulo
           AND s.id_provecomerce = %s
        WHERE (f.Estado IS NULL OR f.Estado <> 2)
          AND f.Articulo IS NOT NULL
          AND TRIM(f.Articulo) <> ''
          AND s.categoriaWeb IS NOT NULL
          AND TRIM(s.categoriaWeb) <> ''
        ORDER BY f.NroFactura, f.Articulo, categoriaWeb
    """

    try:
        cursor = connection.cursor()
        cursor.execute(query, (invoice_limit, catalog_run_id))
        return cursor.fetchall()
    finally:
        if "cursor" in locals():
            cursor.close()
        connection.close()


def write_csv(rows: list[tuple[int, str, str]], output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", encoding="utf-8-sig", newline="") as csv_file:
        writer = csv.writer(csv_file, delimiter=";")
        writer.writerow(["NroFactura", "Articulo", "categoriaWeb"])
        writer.writerows(rows)


def main() -> None:
    args = parse_args()
    rows = extract_rows(args.invoice_limit, args.catalog_run_id)
    write_csv(rows, args.output)

    invoice_count = len({row[0] for row in rows})
    article_count = len({row[1] for row in rows})
    category_count = len({row[2] for row in rows})
    print(f"CSV generado: {args.output.resolve()}")
    print(f"Facturas solicitadas: {args.invoice_limit}")
    print(f"Facturas con categorías: {invoice_count}")
    print(f"Filas normalizadas: {len(rows)}")
    print(f"Artículos distintos: {article_count}")
    print(f"Categorías distintas: {category_count}")


if __name__ == "__main__":
    main()
