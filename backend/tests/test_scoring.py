"""
Unit tests for risk scoring logic.
Run with:  cd backend && python -m pytest tests/ -v
"""
import pytest
from app.scoring import (
    calculate_inherent_risk,
    calculate_residual_risk,
    get_score_band,
    score_risk,
)


class TestInherentRisk:
    def test_max_score(self):
        assert calculate_inherent_risk(5, 5) == 25

    def test_min_score(self):
        assert calculate_inherent_risk(1, 1) == 1

    def test_mid_score(self):
        assert calculate_inherent_risk(3, 3) == 9

    def test_asymmetric(self):
        assert calculate_inherent_risk(4, 5) == 20

    def test_invalid_likelihood_low(self):
        with pytest.raises(ValueError):
            calculate_inherent_risk(0, 3)

    def test_invalid_likelihood_high(self):
        with pytest.raises(ValueError):
            calculate_inherent_risk(6, 3)

    def test_invalid_impact_low(self):
        with pytest.raises(ValueError):
            calculate_inherent_risk(3, 0)

    def test_invalid_impact_high(self):
        with pytest.raises(ValueError):
            calculate_inherent_risk(3, 6)


class TestResidualRisk:
    def test_no_controls(self):
        assert calculate_residual_risk(20, 0) == 20.0

    def test_full_mitigation(self):
        assert calculate_residual_risk(20, 100) == 0.0

    def test_half_mitigation(self):
        assert calculate_residual_risk(20, 50) == 10.0

    def test_partial_mitigation(self):
        result = calculate_residual_risk(25, 60)
        assert result == 10.0

    def test_rounding(self):
        result = calculate_residual_risk(3, 33)
        assert result == round(3 * 0.67, 2)

    def test_invalid_below_zero(self):
        with pytest.raises(ValueError):
            calculate_residual_risk(10, -1)

    def test_invalid_above_100(self):
        with pytest.raises(ValueError):
            calculate_residual_risk(10, 101)


class TestScoreBand:
    def test_low_boundary(self):
        assert get_score_band(1) == "Low"
        assert get_score_band(4) == "Low"

    def test_medium_boundary(self):
        assert get_score_band(5) == "Medium"
        assert get_score_band(9) == "Medium"

    def test_high_boundary(self):
        assert get_score_band(10) == "High"
        assert get_score_band(14) == "High"

    def test_critical_boundary(self):
        assert get_score_band(15) == "Critical"
        assert get_score_band(25) == "Critical"

    def test_float_score(self):
        assert get_score_band(7.5) == "Medium"


class TestScoreRisk:
    def test_full_pipeline(self):
        result = score_risk(4, 5, 10)
        assert result.inherent_score == 20
        assert result.inherent_band == "Critical"
        assert result.residual_score == 18.0
        assert result.residual_band == "Critical"

    def test_default_no_controls(self):
        result = score_risk(2, 3)
        assert result.inherent_score == 6
        assert result.residual_score == 6.0
        assert result.control_effectiveness_pct == 0

    def test_effective_controls_lower_band(self):
        # Inherent = 20 (Critical), 80 % effective → Residual = 4 (Low)
        result = score_risk(4, 5, 80)
        assert result.residual_score == 4.0
        assert result.residual_band == "Low"

    def test_seed_scenario_rsk001(self):
        # RSK-001: likelihood=4, impact=5, ctrl_eff=10
        result = score_risk(4, 5, 10)
        assert result.inherent_score == 20
        assert result.inherent_band == "Critical"
        assert result.residual_score == 18.0
