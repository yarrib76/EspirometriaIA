from __future__ import annotations

from typing import Any


def safe_ratio(numerator: float, denominator: float) -> float:
    if denominator <= 0:
        raise ValueError("El denominador no puede ser cero o negativo.")
    return round(numerator / denominator, 4)


def compute_bronchodilator_delta_ml(pre_fev1: float, post_fev1: float) -> float:
    return round((post_fev1 - pre_fev1) * 1000.0, 1)


def compute_bronchodilator_delta_pct(pre_fev1: float, post_fev1: float) -> float:
    if pre_fev1 <= 0:
        raise ValueError("FEV1 basal debe ser mayor a cero.")
    return round(((post_fev1 - pre_fev1) / pre_fev1) * 100.0, 2)


def is_bronchodilator_response_positive(delta_ml: float, delta_pct: float) -> bool:
    return delta_ml >= 200.0 and delta_pct >= 12.0


def derive_pattern_label(fev1_fvc: float, fvc_pct_pred: float) -> str:
    if fev1_fvc < 0.7 and fvc_pct_pred < 80.0:
        return "Mixto"
    if fev1_fvc < 0.7:
        return "Obstructivo"
    if fvc_pct_pred < 80.0:
        return "Restrictivo"
    return "Normal"


def derive_severity_label(pattern: str, fev1_pct_pred: float, fvc_pct_pred: float) -> str:
    if pattern == "Normal":
        return "Sin alteración"

    reference_value = fev1_pct_pred if pattern in {"Obstructivo", "Mixto"} else fvc_pct_pred
    if reference_value >= 80.0:
        return "Leve"
    if reference_value >= 65.0:
        return "Moderada"
    if reference_value >= 50.0:
        return "Moderadamente grave"
    if reference_value >= 35.0:
        return "Grave"
    return "Muy grave"


def enrich_payload(payload: dict[str, Any]) -> dict[str, float | int | str]:
    normalized = dict(payload)

    required_numeric = ["Edad", "Altura_cm", "Peso_kg", "FVC", "FEV1", "FVC_pct_pred", "FEV1_pct_pred"]
    for key in required_numeric:
        if key not in normalized or normalized[key] in ("", None):
            raise ValueError(f"Falta el campo obligatorio: {key}")
        normalized[key] = float(normalized[key])

    if "Genero" not in normalized or normalized["Genero"] in ("", None):
        raise ValueError("Falta el campo obligatorio: Genero")
    normalized["Genero"] = str(normalized["Genero"])

    normalized["Fumador"] = int(float(normalized.get("Fumador", 0) or 0))
    normalized["Calidad_Espirometria"] = int(float(normalized.get("Calidad_Espirometria", 1) or 1))

    post_fvc = normalized.get("Post_BD_FVC")
    post_fev1 = normalized.get("Post_BD_FEV1")
    bronchodilator_performed = 0

    if post_fvc in ("", None) and post_fev1 in ("", None):
        normalized["Post_BD_FVC"] = normalized["FVC"]
        normalized["Post_BD_FEV1"] = normalized["FEV1"]
    else:
        bronchodilator_performed = 1
        normalized["Post_BD_FVC"] = float(post_fvc if post_fvc not in ("", None) else normalized["FVC"])
        normalized["Post_BD_FEV1"] = float(post_fev1 if post_fev1 not in ("", None) else normalized["FEV1"])

    if "Broncodilatador_Realizado" in normalized and normalized["Broncodilatador_Realizado"] not in ("", None):
        bronchodilator_performed = int(float(normalized["Broncodilatador_Realizado"]))
    normalized["Broncodilatador_Realizado"] = bronchodilator_performed

    normalized["FEV1_FVC"] = safe_ratio(normalized["FEV1"], normalized["FVC"])
    normalized["Post_BD_FEV1_FVC"] = safe_ratio(normalized["Post_BD_FEV1"], normalized["Post_BD_FVC"])
    normalized["BD_FEV1_Delta_ml"] = compute_bronchodilator_delta_ml(normalized["FEV1"], normalized["Post_BD_FEV1"])
    normalized["BD_FEV1_Delta_pct"] = compute_bronchodilator_delta_pct(normalized["FEV1"], normalized["Post_BD_FEV1"])
    return normalized


def build_interpretation_summary(payload: dict[str, Any]) -> dict[str, Any]:
    enriched = enrich_payload(payload)
    acceptable_quality = enriched["Calidad_Espirometria"] == 1
    pattern = derive_pattern_label(enriched["FEV1_FVC"], enriched["FVC_pct_pred"])
    bronchodilator_positive = is_bronchodilator_response_positive(
        enriched["BD_FEV1_Delta_ml"], enriched["BD_FEV1_Delta_pct"]
    )

    summary = {
        "acceptable_quality": acceptable_quality,
        "pattern_by_rule": pattern,
        "severity": derive_severity_label(pattern, enriched["FEV1_pct_pred"], enriched["FVC_pct_pred"]),
        "bronchodilator_test_performed": bool(enriched["Broncodilatador_Realizado"]),
        "bronchodilator_response_positive": bronchodilator_positive,
        "derived_metrics": {
            "FEV1_FVC": enriched["FEV1_FVC"],
            "Post_BD_FEV1_FVC": enriched["Post_BD_FEV1_FVC"],
            "BD_FEV1_Delta_ml": enriched["BD_FEV1_Delta_ml"],
            "BD_FEV1_Delta_pct": enriched["BD_FEV1_Delta_pct"],
            "FVC_pct_pred": enriched["FVC_pct_pred"],
            "FEV1_pct_pred": enriched["FEV1_pct_pred"],
        },
    }

    notes = []
    if not acceptable_quality:
        notes.append("La maniobra no cumple criterios de calidad; la interpretación debe tomarse con cautela.")
    if bronchodilator_positive:
        notes.append("La respuesta broncodilatadora es positiva (>=12% y >=200 mL en FEV1).")
    elif summary["bronchodilator_test_performed"]:
        notes.append("La respuesta broncodilatadora no alcanza criterios de positividad.")
    else:
        notes.append("No se informan valores post-broncodilatador.")
    summary["notes"] = notes
    return summary
