import numpy as np
import pandas as pd

from src.clinical.interpretation import (
    compute_bronchodilator_delta_ml,
    compute_bronchodilator_delta_pct,
    derive_pattern_label,
)
from src.config import DATASET_PATH, RAW_DATA_DIR


def generar_datos_completos(n_muestras: int = 5000) -> pd.DataFrame:
    np.random.seed(42)
    datos = []

    for _ in range(n_muestras):
        edad = np.random.randint(18, 90)
        genero = np.random.choice(["M", "F"])
        altura_m = np.random.randint(150, 195) / 100

        imc_base = np.random.normal(26, 5)
        patron = np.random.choice(["Normal", "Obstructivo", "Restrictivo", "Mixto"], p=[0.32, 0.34, 0.2, 0.14])

        peso = np.round(imc_base * (altura_m**2), 1)
        fumador = np.random.choice([0, 1], p=[0.7, 0.3])
        calidad = np.random.choice([0, 1], p=[0.08, 0.92])
        broncodilatador_realizado = np.random.choice([0, 1], p=[0.45, 0.55])

        if patron == "Normal":
            fvc_pct_pred = np.round(np.random.uniform(85, 118), 1)
            fev1_pct_pred = np.round(np.random.uniform(85, 118), 1)
            fvc = np.round(np.random.uniform(3.3, 5.8), 2)
            fev1 = np.round(fvc * np.random.uniform(0.78, 0.9), 2)
        elif patron == "Obstructivo":
            fvc_pct_pred = np.round(np.random.uniform(80, 110), 1)
            fev1_pct_pred = np.round(np.random.uniform(28, 79), 1)
            fvc = np.round(np.random.uniform(2.4, 4.8), 2)
            fev1 = np.round(fvc * np.random.uniform(0.38, 0.68), 2)
            fumador = 1
        elif patron == "Restrictivo":
            fvc_pct_pred = np.round(np.random.uniform(35, 79), 1)
            fev1_pct_pred = np.round(np.random.uniform(40, 90), 1)
            fvc = np.round(np.random.uniform(1.6, 3.3), 2)
            fev1 = np.round(fvc * np.random.uniform(0.72, 0.92), 2)
        else:
            fvc_pct_pred = np.round(np.random.uniform(35, 79), 1)
            fev1_pct_pred = np.round(np.random.uniform(20, 68), 1)
            fvc = np.round(np.random.uniform(1.4, 3.4), 2)
            fev1 = np.round(fvc * np.random.uniform(0.35, 0.68), 2)
            fumador = np.random.choice([0, 1], p=[0.35, 0.65])

        fev1_fvc = np.round(fev1 / fvc, 4)
        post_bd_fev1 = fev1
        post_bd_fvc = fvc

        if broncodilatador_realizado:
            if patron == "Obstructivo":
                response_positive = np.random.choice([0, 1], p=[0.45, 0.55])
            elif patron == "Mixto":
                response_positive = np.random.choice([0, 1], p=[0.7, 0.3])
            else:
                response_positive = np.random.choice([0, 1], p=[0.88, 0.12])

            if response_positive:
                delta_liters = np.random.uniform(0.22, 0.48)
                relative_delta = np.random.uniform(12.0, 26.0)
                post_bd_fev1 = max(fev1 + delta_liters, fev1 * (1 + (relative_delta / 100)))
            else:
                delta_liters = np.random.uniform(0.0, 0.18)
                relative_delta = np.random.uniform(0.0, 11.5)
                post_bd_fev1 = min(fev1 + delta_liters, fev1 * (1 + (relative_delta / 100)))

            post_bd_fvc = fvc + np.random.uniform(-0.05, 0.18)

        post_bd_fev1 = np.round(max(post_bd_fev1, 0.4), 2)
        post_bd_fvc = np.round(max(post_bd_fvc, 0.8), 2)
        post_bd_fev1_fvc = np.round(post_bd_fev1 / post_bd_fvc, 4)
        bd_fev1_delta_ml = compute_bronchodilator_delta_ml(fev1, post_bd_fev1)
        bd_fev1_delta_pct = compute_bronchodilator_delta_pct(fev1, post_bd_fev1)
        patron_derivado = derive_pattern_label(fev1_fvc, fvc_pct_pred)

        datos.append(
            [
                edad,
                genero,
                int(altura_m * 100),
                peso,
                fvc,
                fev1,
                fev1_fvc,
                fvc_pct_pred,
                fev1_pct_pred,
                post_bd_fvc,
                post_bd_fev1,
                post_bd_fev1_fvc,
                bd_fev1_delta_ml,
                bd_fev1_delta_pct,
                fumador,
                calidad,
                broncodilatador_realizado,
                patron_derivado,
            ]
        )

    columnas = [
        "Edad",
        "Genero",
        "Altura_cm",
        "Peso_kg",
        "FVC",
        "FEV1",
        "FEV1_FVC",
        "FVC_pct_pred",
        "FEV1_pct_pred",
        "Post_BD_FVC",
        "Post_BD_FEV1",
        "Post_BD_FEV1_FVC",
        "BD_FEV1_Delta_ml",
        "BD_FEV1_Delta_pct",
        "Fumador",
        "Calidad_Espirometria",
        "Broncodilatador_Realizado",
        "Patron_Espirometrico",
    ]
    return pd.DataFrame(datos, columns=columnas)


if __name__ == "__main__":
    RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)
    dataframe = generar_datos_completos(5000)
    dataframe.to_csv(DATASET_PATH, index=False)
    print(f"Dataset guardado en {DATASET_PATH}")
