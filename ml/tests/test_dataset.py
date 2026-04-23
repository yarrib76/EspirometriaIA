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
                "Fumador": [1, 0, 1, 0],
                "Diagnostico": ["Normal", "EPOC", "Asma", "Otra"],
            }
        )
        with self.assertRaises(ValueError):
            validate_dataset(dataframe)


if __name__ == "__main__":
    unittest.main()
