"""Consultas de solo lectura para la vista web de pedidos."""

from __future__ import annotations

import argparse
import json
import os
from datetime import date, datetime
from typing import Any

import mysql.connector


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Consulta pedidos web y sus artículos.")
    subparsers = parser.add_subparsers(dest="action", required=True)

    list_parser = subparsers.add_parser("list")
    list_parser.add_argument("--page", type=int, default=1)
    list_parser.add_argument("--page-size", type=int, default=10)
    list_parser.add_argument("--search", default="")

    detail_parser = subparsers.add_parser("detail")
    detail_parser.add_argument("--order-id", type=int, required=True)

    categories_parser = subparsers.add_parser("categories")
    categories_parser.add_argument("--order-id", type=int, required=True)
    categories_parser.add_argument("--catalog-run-id", type=int, required=True)

    products_parser = subparsers.add_parser("products")
    products_parser.add_argument("--catalog-run-id", type=int, required=True)
    products_parser.add_argument("--category", required=True)
    products_parser.add_argument("--min-stock", type=int, default=10)
    return parser.parse_args()


def connect() -> mysql.connector.MySQLConnection:
    return mysql.connector.connect(
        host=os.environ["DB_HOST"],
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.environ["DB_USER"],
        password=os.environ["DB_PASSWORD"],
        database=os.environ["DB_NAME"],
        connection_timeout=15,
    )


def json_default(value: Any) -> str:
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    raise TypeError(f"Tipo no serializable: {type(value).__name__}")


def list_orders(connection: mysql.connector.MySQLConnection, args: argparse.Namespace) -> dict[str, Any]:
    page = max(1, args.page)
    page_size = min(100, max(5, args.page_size))
    offset = (page - 1) * page_size
    search = args.search.strip()
    filters = ["cp.ordenWeb IS NOT NULL", "cp.ordenWeb > 0"]
    parameters: list[Any] = []

    if search:
        filters.append(
            "(CAST(cp.nropedido AS CHAR) LIKE %s OR CAST(cp.ordenWeb AS CHAR) LIKE %s "
            "OR c.nombre LIKE %s OR c.apellido LIKE %s OR c.apodo LIKE %s OR cp.vendedora LIKE %s)"
        )
        pattern = f"%{search}%"
        parameters.extend([pattern] * 6)

    where_clause = " AND ".join(filters)
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute(
            f"SELECT COUNT(*) AS total FROM controlpedidos cp "
            f"INNER JOIN clientes c ON c.id_clientes = cp.id_cliente WHERE {where_clause}",
            parameters,
        )
        total = int(cursor.fetchone()["total"])
        cursor.execute(
            f"""
            SELECT
                cp.id,
                cp.nropedido AS pedido,
                COALESCE(
                    NULLIF(TRIM(CONCAT_WS(' ', NULLIF(c.nombre, ''), NULLIF(c.apellido, ''))), ''),
                    NULLIF(TRIM(c.apodo), ''),
                    'Sin nombre'
                ) AS cliente,
                cp.fecha,
                COALESCE(NULLIF(TRIM(cp.vendedora), ''), 'Sin asignar') AS vendedora,
                cp.ordenWeb
            FROM controlpedidos cp
            INNER JOIN clientes c ON c.id_clientes = cp.id_cliente
            WHERE {where_clause}
            ORDER BY cp.fecha DESC, cp.id DESC
            LIMIT %s OFFSET %s
            """,
            [*parameters, page_size, offset],
        )
        return {
            "orders": cursor.fetchall(),
            "pagination": {
                "page": page,
                "pageSize": page_size,
                "total": total,
                "totalPages": max(1, (total + page_size - 1) // page_size),
            },
        }
    finally:
        cursor.close()


def order_detail(connection: mysql.connector.MySQLConnection, order_id: int) -> dict[str, Any]:
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT cp.id, cp.nropedido AS pedido, cp.ordenWeb,
                   COALESCE(NULLIF(TRIM(CONCAT_WS(' ', NULLIF(c.nombre, ''), NULLIF(c.apellido, ''))), ''),
                            NULLIF(TRIM(c.apodo), ''), 'Sin nombre') AS cliente
            FROM controlpedidos cp
            INNER JOIN clientes c ON c.id_clientes = cp.id_cliente
            WHERE cp.id = %s AND cp.ordenWeb IS NOT NULL AND cp.ordenWeb > 0
            LIMIT 1
            """,
            (order_id,),
        )
        order = cursor.fetchone()
        if not order:
            return {"found": False, "order": None, "items": []}

        cursor.execute(
            """
            SELECT id, articulo, detalle, cantidad, precio, estado_Arti_Pedido AS estado
            FROM ordenesarticulos
            WHERE id_controlPedidos = %s
            ORDER BY id, articulo
            """,
            (order_id,),
        )
        return {"found": True, "order": order, "items": cursor.fetchall()}
    finally:
        cursor.close()


def order_categories(
    connection: mysql.connector.MySQLConnection, order_id: int, catalog_run_id: int
) -> dict[str, Any]:
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT cp.id, cp.nropedido AS pedido, cp.ordenWeb,
                   COALESCE(NULLIF(TRIM(CONCAT_WS(' ', NULLIF(c.nombre, ''), NULLIF(c.apellido, ''))), ''),
                            NULLIF(TRIM(c.apodo), ''), 'Sin nombre') AS cliente
            FROM controlpedidos cp
            INNER JOIN clientes c ON c.id_clientes = cp.id_cliente
            WHERE cp.id = %s AND cp.ordenWeb IS NOT NULL AND cp.ordenWeb > 0
            LIMIT 1
            """,
            (order_id,),
        )
        order = cursor.fetchone()
        if not order:
            return {"found": False, "order": None, "categories": [], "unmappedItems": 0}

        cursor.execute(
            """
            SELECT DISTINCT TRIM(s.categoriaWeb) AS categoria
            FROM ordenesarticulos oa
            INNER JOIN statusecomercesincro s
                ON s.articulo = oa.articulo
               AND s.id_provecomerce = %s
            WHERE oa.id_controlPedidos = %s
              AND s.categoriaWeb IS NOT NULL
              AND TRIM(s.categoriaWeb) <> ''
            ORDER BY categoria
            """,
            (catalog_run_id, order_id),
        )
        categories = [row["categoria"] for row in cursor.fetchall()]
        cursor.execute(
            """
            SELECT COUNT(*) AS unmapped
            FROM ordenesarticulos oa
            LEFT JOIN statusecomercesincro s
                ON s.articulo = oa.articulo
               AND s.id_provecomerce = %s
               AND s.categoriaWeb IS NOT NULL
               AND TRIM(s.categoriaWeb) <> ''
            WHERE oa.id_controlPedidos = %s AND s.id IS NULL
            """,
            (catalog_run_id, order_id),
        )
        return {
            "found": True,
            "order": order,
            "categories": categories,
            "unmappedItems": int(cursor.fetchone()["unmapped"]),
        }
    finally:
        cursor.close()


def category_products(
    connection: mysql.connector.MySQLConnection,
    catalog_run_id: int,
    category: str,
    min_stock: int,
) -> dict[str, Any]:
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT DISTINCT
                a.Articulo AS articulo,
                a.Detalle AS detalle,
                a.Cantidad AS stock,
                a.websku,
                a.NbreWeb AS nombreWeb,
                (
                    SELECT image_status.imagessrc
                    FROM statusecomercesincro image_status
                    WHERE image_status.articulo = a.Articulo
                      AND image_status.imagessrc IS NOT NULL
                      AND TRIM(image_status.imagessrc) <> ''
                    ORDER BY image_status.id_provecomerce DESC, image_status.id DESC
                    LIMIT 1
                ) AS foto_url
            FROM statusecomercesincro s
            INNER JOIN articulos a ON a.Articulo = s.articulo
            WHERE s.id_provecomerce = %s
              AND TRIM(s.categoriaWeb) = %s
              AND a.Cantidad > %s
            ORDER BY a.Cantidad DESC, a.Articulo
            LIMIT 200
            """,
            (catalog_run_id, category.strip(), min_stock),
        )
        products = cursor.fetchall()
        return {
            "category": category.strip(),
            "minimumStockExclusive": min_stock,
            "products": products,
        }
    finally:
        cursor.close()


def main() -> None:
    args = parse_args()
    connection = connect()
    try:
        if args.action == "list":
            result = list_orders(connection, args)
        elif args.action == "detail":
            result = order_detail(connection, args.order_id)
        elif args.action == "categories":
            result = order_categories(connection, args.order_id, args.catalog_run_id)
        else:
            result = category_products(connection, args.catalog_run_id, args.category, args.min_stock)
        print(json.dumps(result, ensure_ascii=True, default=json_default))
    finally:
        connection.close()


if __name__ == "__main__":
    main()
