import numpy as np
import pandas as pd

from src.config import DATASET_PATH, RAW_DATA_DIR


def generar_datos_completos(n_muestras: int = 5000) -> pd.DataFrame:
    np.random.seed(42)
    datos = []

    for _ in range(n_muestras):
        edad = np.random.randint(18, 90)
        genero = np.random.choice(["M", "F"])
        altura_m = np.random.randint(150, 195) / 100

        imc_base = np.random.normal(26, 5)
        diag = np.random.choice(["Normal", "EPOC", "Asma", "Restrictivo"], p=[0.4, 0.25, 0.2, 0.15])

        if diag == "Restrictivo":
            imc_base = np.random.uniform(32, 45)

        peso = np.round(imc_base * (altura_m**2), 1)
        imc = np.round(peso / (altura_m**2), 1)
        fumador = np.random.choice([0, 1], p=[0.7, 0.3])

        if diag == "Normal":
            fvc = np.round(np.random.uniform(3.5, 5.5), 2)
            fev1 = np.round(fvc * np.random.uniform(0.8, 0.95), 2)
        elif diag == "EPOC":
            fvc = np.round(np.random.uniform(2.5, 4.5), 2)
            fev1 = np.round(fvc * np.random.uniform(0.4, 0.65), 2)
            fumador = 1
        elif diag == "Asma":
            fvc = np.round(np.random.uniform(3.0, 5.0), 2)
            fev1 = np.round(fvc * np.random.uniform(0.6, 0.75), 2)
        else:
            fvc = np.round(np.random.uniform(1.5, 3.0), 2)
            fev1 = np.round(fvc * np.random.uniform(0.85, 0.95), 2)

        ratio = np.round(fev1 / fvc, 2)

        datos.append([edad, genero, int(altura_m * 100), peso, imc, fvc, fev1, ratio, fumador, diag])

    columnas = ["Edad", "Genero", "Altura_cm", "Peso_kg", "IMC", "FVC", "FEV1", "Ratio", "Fumador", "Diagnostico"]
    return pd.DataFrame(datos, columns=columnas)


if __name__ == "__main__":
    RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)
    dataframe = generar_datos_completos(5000)
    dataframe.to_csv(DATASET_PATH, index=False)
    print(f"Dataset guardado en {DATASET_PATH}")
