# Minería de datos — Modelo Apriori

Este módulo contiene el proceso reproducible para extraer transacciones, construir la matriz
binaria y generar reglas de asociación. 

## Etapa 1: extracción normalizada

El script `src/extract_transactions.py` genera:

`data/extracted/transacciones_categorias.csv`

El archivo contiene `NroFactura`, `Articulo` y `categoriaWeb` para las últimas facturas elegibles.
Se excluyen renglones con `Estado = 2`, categorías nulas o vacías y duplicados exactos.
Todos los CSV utilizan punto y coma (`;`) como delimitador para ser compatibles con Excel en
configuraciones regionales en español.

Las credenciales se reciben mediante variables de entorno; no se guardan en el repositorio.

```powershell
cd apriori
python src/extract_transactions.py
```

Los parámetros opcionales son `--invoice-limit`, `--catalog-run-id` y `--output`.

## Etapa 2: matriz binaria

El script `src/build_binary_matrix.py` transforma la extracción normalizada en:

`data/processed/matriz_binaria.csv`

Cada fila representa una factura y cada columna, una categoría. El valor es `1` cuando la
categoría está presente en la factura y `0` cuando está ausente. `NroFactura` se conserva para
trazabilidad y deberá excluirse antes de ejecutar Apriori.

```powershell
cd apriori
python src/build_binary_matrix.py
```

Los parámetros opcionales son `--input` y `--output`.

## Etapa 3: itemsets frecuentes

El script `src/generate_frequent_itemsets.py` ejecuta Apriori con soportes mínimos del 1 % al
5 % y genera un CSV auditable para cada umbral dentro de `reports/itemsets/`.

```powershell
cd apriori
python src/generate_frequent_itemsets.py
```

`NroFactura` se utiliza solo para contar las transacciones y se excluye de las variables que
recibe Apriori.

## Etapa 4: reglas de asociación

El script `src/generate_association_rules.py` utiliza los itemsets con soportes del 2 %, 3 % y
4 %. Genera un CSV por umbral, con confianza mínima del 30 %, lift mayor que 1 y una única
categoría en el consecuente.

```powershell
cd apriori
python src/generate_association_rules.py
```

Los archivos se guardan en `reports/rules/`. Esta etapa conserva todas las reglas válidas; la
selección de hasta 20 reglas se realiza posteriormente.

## Etapa 5: selección de reglas candidatas

El script `src/select_candidate_rules.py` evalúa las reglas con soporte del 3 %, exige confianza
de al menos 40 % y lift de al menos 1,2. Prioriza confianza, lift, respaldo y antecedentes
simples, y limita la selección a dos reglas por consecuente para conservar diversidad.

```powershell
cd apriori
python src/select_candidate_rules.py
```

Genera una evaluación completa y un archivo separado con hasta 20 reglas candidatas. La
selección es reproducible, pero debe validarse comercialmente antes de activarse.

## Corridas históricas desde la web

Cada ejecución completa iniciada desde el panel web se guarda en `runs/<fecha-hora>/`. La carpeta
contiene el resumen de configuración y resultados, los CSV de todas las etapas y un ZIP de
auditoría. Las corridas pueden consultarse y descargarse desde la misma interfaz.

Las etapas individuales trabajan sobre la corrida histórica seleccionada y mantienen sus
dependencias: reprocesar desde matriz ejecuta las etapas 2 a 5; desde Apriori, las etapas 3 a 5;
desde reglas, las etapas 4 y 5; y selección actualiza únicamente la etapa 5. La extracción crea
una corrida nueva para no sobrescribir el origen de una ejecución anterior.

El panel también permite eliminar todas las ejecuciones históricas y los artefactos generados.
Esta operación desactiva la corrida usada para recomendaciones, pero conserva la configuración
de parámetros almacenada en `runs/configuracion.json`.
