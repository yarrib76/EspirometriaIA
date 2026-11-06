"""Empaqueta una corrida Apriori completa para su auditoría."""

from __future__ import annotations

import argparse
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Genera el ZIP de auditoría de una corrida.")
    parser.add_argument("--run-dir", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    run_dir = args.run_dir.resolve()
    output = args.output.resolve()
    if not run_dir.is_dir():
        raise FileNotFoundError(f"No existe la carpeta de corrida: {run_dir}")
    if run_dir not in output.parents:
        raise ValueError("El ZIP debe guardarse dentro de la carpeta de corrida")

    output.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(output, "w", compression=ZIP_DEFLATED) as archive:
        for file_path in sorted(run_dir.rglob("*")):
            if file_path.is_file() and file_path.resolve() != output:
                archive.write(file_path, file_path.relative_to(run_dir))

    print(f"ZIP generado: {output}")


if __name__ == "__main__":
    main()
