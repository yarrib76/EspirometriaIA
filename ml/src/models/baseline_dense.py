import tensorflow as tf


def build_baseline_dense(input_dim: int, output_classes: int) -> tf.keras.Model:
    # Red neuronal totalmente conectada para clasificación multiclase.
    model = tf.keras.Sequential(
        [
            # Recibe el vector de features ya preprocesadas.
            tf.keras.layers.Input(shape=(input_dim,)),
            # Capa oculta mínima para baseline inicial.
            tf.keras.layers.Dense(2, activation="relu", name="hidden_dense_2"),
            # Softmax devuelve una probabilidad por cada diagnóstico posible.
            tf.keras.layers.Dense(output_classes, activation="softmax", name="diagnosis_output"),
        ]
    )

    # Define optimizador, función de coste y métrica principal.
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model
