"""
Risk scoring logic for RiskLens.

SCORING METHODOLOGY (documented for transparency):
───────────────────────────────────────────────────
  Inherent Risk Score = Likelihood (1–5) × Impact (1–5)
  Range: 1–25

  Score Bands:
    1–4   → Low      (Green)
    5–9   → Medium   (Yellow)
    10–14 → High     (Orange)
    15–25 → Critical (Red)

  Residual Risk Score:
    Residual = Inherent × (1 − control_effectiveness_pct / 100)
    control_effectiveness_pct is a consultant-assessed value (0–100 %).
    A value of 60 means existing controls reduce risk exposure by 60 %.

DISCLAIMER:
  This scoring model is simplified for demonstration purposes. It does not
  constitute a formal risk assessment under any regulatory framework.
"""

from dataclasses import dataclass
from typing import Literal

ScoreBand = Literal["Low", "Medium", "High", "Critical"]


def calculate_inherent_risk(likelihood: int, impact: int) -> int:
    """
    Compute inherent risk score.

    Args:
        likelihood: Integer 1–5 (1 = Rare, 5 = Almost Certain)
        impact:     Integer 1–5 (1 = Negligible, 5 = Catastrophic)

    Returns:
        Integer score in range [1, 25]

    Raises:
        ValueError: if inputs are outside [1, 5]
    """
    if not (1 <= likelihood <= 5):
        raise ValueError(f"likelihood must be 1–5, got {likelihood}")
    if not (1 <= impact <= 5):
        raise ValueError(f"impact must be 1–5, got {impact}")
    return likelihood * impact


def calculate_residual_risk(inherent_score: int, control_effectiveness_pct: int) -> float:
    """
    Compute residual risk after applying control effectiveness.

    Args:
        inherent_score:          Inherent risk score (1–25)
        control_effectiveness_pct: Consultant-assessed reduction (0–100 %)

    Returns:
        Residual risk as float, rounded to 2 decimal places.

    Raises:
        ValueError: if control_effectiveness_pct is outside [0, 100]
    """
    if not (0 <= control_effectiveness_pct <= 100):
        raise ValueError(
            f"control_effectiveness_pct must be 0–100, got {control_effectiveness_pct}"
        )
    reduction = control_effectiveness_pct / 100.0
    return round(inherent_score * (1 - reduction), 2)


def get_score_band(score: float) -> ScoreBand:
    """
    Map a numeric risk score to a qualitative band.

    Bands:
        1–4   → Low
        5–9   → Medium
        10–14 → High
        15–25 → Critical
    """
    if score <= 4:
        return "Low"
    elif score <= 9:
        return "Medium"
    elif score <= 14:
        return "High"
    else:
        return "Critical"


@dataclass
class RiskScoreResult:
    likelihood: int
    impact: int
    inherent_score: int
    control_effectiveness_pct: int
    residual_score: float
    inherent_band: ScoreBand
    residual_band: ScoreBand


def score_risk(
    likelihood: int,
    impact: int,
    control_effectiveness_pct: int = 0,
) -> RiskScoreResult:
    """
    End-to-end risk scoring pipeline.

    Returns a RiskScoreResult with all computed values and band labels.
    """
    inherent = calculate_inherent_risk(likelihood, impact)
    residual = calculate_residual_risk(inherent, control_effectiveness_pct)
    return RiskScoreResult(
        likelihood=likelihood,
        impact=impact,
        inherent_score=inherent,
        control_effectiveness_pct=control_effectiveness_pct,
        residual_score=residual,
        inherent_band=get_score_band(inherent),
        residual_band=get_score_band(residual),
    )


LIKELIHOOD_LABELS = {
    1: "Rare",
    2: "Unlikely",
    3: "Possible",
    4: "Likely",
    5: "Almost Certain",
}

IMPACT_LABELS = {
    1: "Negligible",
    2: "Minor",
    3: "Moderate",
    4: "Major",
    5: "Catastrophic",
}

BAND_COLORS = {
    "Low": "#22c55e",       # green-500
    "Medium": "#eab308",    # yellow-500
    "High": "#f97316",      # orange-500
    "Critical": "#ef4444",  # red-500
}
