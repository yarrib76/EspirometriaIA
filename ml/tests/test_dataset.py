import unittest

import pandas as pd

from src.data.dataset import validate_dataset


class DatasetValidationTests(unittest.TestCase):
    def test_validate_dataset_requires_expected_columns(self):
        dataframe = pd.DataFrame({"Edad": [50]})
        with self.assertRaises(ValueError):
            validate_dataset(dataframe)

    def test_validate_dataset_requires_expected_classes(self):
        dataframe = pd.DataFrame(
            {
                "Edad": [50, 60, 45, 38],
                "Genero": ["M", "F", "M", "F"],
                "Altura_cm": [175, 160, 182, 168],
                "Peso_kg": [80.0, 61.0, 84.0, 69.0],
                "FVC": [4.0, 4.2, 2.8, 2.2],
                "FEV1": [3.4, 2.9, 1.6, 1.9],
                "FEV1_FVC": [0.85, 0.69, 0.57, 0.86],
                "FVC_pct_pred": [96.0, 91.0, 71.0, 75.0],
                "FEV1_pct_pred": [98.0, 58.0, 42.0, 73.0],
                "Post_BD_FVC": [4.1, 4.3, 2.9, 2.2],
                "Post_BD_FEV1": [3.5, 3.2, 1.7, 2.0],
                "Post_BD_FEV1_FVC": [0.85, 0.74, 0.59, 0.91],
                "BD_FEV1_Delta_ml": [100.0, 300.0, 100.0, 100.0],
                "BD_FEV1_Delta_pct": [2.9, 10.3, 6.2, 5.3],
                "Fumador": [1, 0, 1, 0],
                "Calidad_Espirometria": [1, 1, 1, 1],
                "Broncodilatador_Realizado": [1, 1, 1, 1],
                "Patron_Espirometrico": ["Normal", "Obstructivo", "Mixto", "Otra"],
            }
        )
        with self.assertRaises(ValueError):
            validate_dataset(dataframe)


if __name__ == "__main__":
    unittest.main()
