"""
Interactive "What-If" Scenario Simulator & Risk Modeling Playground for RiskLens v2.0.
Calculates real-time risk reduction, appetite threshold compliance, and
Return on Security Investment (ROSI) for proposed control enhancements.
"""
from typing import List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.scoring import calculate_residual_risk, get_score_band

router = APIRouter(prefix="/simulation", tags=["Risk Simulation & Modeling"])


class ControlAdjustment(BaseModel):
    control_id: str
    proposed_effectiveness_pct: float = Field(ge=0, le=100)


class StrategicInitiative(BaseModel):
    id: str
    name: str
    description: str
    estimated_cost_usd: float
    affected_controls: List[ControlAdjustment]


class SimulationRequest(BaseModel):
    threat_multiplier: float = Field(default=1.0, ge=0.5, le=2.0)  # 1.0 = baseline, 1.25 = heightened threat
    custom_adjustments: Optional[List[ControlAdjustment]] = None
    enabled_initiatives: Optional[List[str]] = None


# Pre-configured strategic initiatives available for one-click simulation
AVAILABLE_INITIATIVES = [
    {
        "id": "INIT-FIDO2",
        "name": "Enterprise FIDO2 / Phishing-Resistant MFA Rollout",
        "category": "Identity & Access",
        "estimated_cost_usd": 35000,
        "affected_controls": [
            {"control_id": "CTL-001", "proposed_effectiveness_pct": 95.0},
            {"control_id": "CTL-002", "proposed_effectiveness_pct": 95.0},
            {"control_id": "CTL-006", "proposed_effectiveness_pct": 90.0},
        ],
        "affected_risk_ids": ["RSK-001", "RSK-002", "RSK-014"],
        "proposed_risk_effectiveness_pct": 92.0,
        "rationale": "Eliminates credential stuffing and session hijacking risks on customer NetBanking portals and administrative bastions.",
    },
    {
        "id": "INIT-CLOUD-GUARD",
        "name": "AWS Security Hub, SCPs & Automated S3 Bucket Remediation",
        "category": "Cloud Governance",
        "estimated_cost_usd": 25000,
        "affected_controls": [
            {"control_id": "CTL-004", "proposed_effectiveness_pct": 92.0},
            {"control_id": "CTL-005", "proposed_effectiveness_pct": 88.0},
        ],
        "affected_risk_ids": ["RSK-008", "RSK-010", "RSK-011"],
        "proposed_risk_effectiveness_pct": 90.0,
        "rationale": "Enforces immutable guardrails preventing public storage leaks and unencrypted data volumes in AWS Mumbai.",
    },
    {
        "id": "INIT-API-WAF",
        "name": "Deploy API Gateway WAF & Rate Limiting",
        "category": "Application Security",
        "estimated_cost_usd": 20000,
        "affected_controls": [
            {"control_id": "CTL-008", "proposed_effectiveness_pct": 88.0},
        ],
        "affected_risk_ids": ["RSK-016", "RSK-018"],
        "proposed_risk_effectiveness_pct": 88.0,
        "rationale": "Protects core banking APIs against automated enumeration, DDoS, and parameter tampering.",
    },
    {
        "id": "INIT-SOC-EDR",
        "name": "24/7 Managed Detection & Response (MDR) + CrowdStrike EDR",
        "category": "Security Operations",
        "estimated_cost_usd": 60000,
        "affected_controls": [
            {"control_id": "CTL-010", "proposed_effectiveness_pct": 90.0},
            {"control_id": "CTL-015", "proposed_effectiveness_pct": 95.0},
        ],
        "affected_risk_ids": ["RSK-003", "RSK-005", "RSK-006", "RSK-007"],
        "proposed_risk_effectiveness_pct": 94.0,
        "rationale": "Accelerates Mean Time to Detect (MTTD) from weeks to under 30 minutes, preventing ransomware lateral movement.",
    },
]


@router.get("/initiatives")
def get_available_initiatives():
    """Return catalog of one-click strategic initiatives for what-if simulation."""
    return AVAILABLE_INITIATIVES


@router.post("/model")
def run_simulation(payload: SimulationRequest, db: Session = Depends(get_db)):
    """
    Simulate impact of proposed control upgrades and threat conditions on
    residual risk scores, appetite violations, and estimated return on security investment.
    """
    risks = db.query(models.Risk).all()
    controls = db.query(models.Control).all()
    remediations = db.query(models.RemediationItem).all()
    appetite = db.query(models.RiskAppetiteConfig).first()

    max_residual = appetite.max_acceptable_residual_risk if appetite else 9

    # Map control_id -> set of related_risk_ids via remediation findings
    ctrl_to_risks = {}
    for rem in remediations:
        if rem.linked_control_id and rem.linked_risk_id:
            ctrl_to_risks.setdefault(rem.linked_control_id, set()).add(rem.linked_risk_id)

    # Build control & risk override lookups
    control_eff_override = {}
    risk_eff_override = {}

    # Apply selected initiatives
    if payload.enabled_initiatives:
        init_lookup = {init["id"]: init for init in AVAILABLE_INITIATIVES}
        for init_id in payload.enabled_initiatives:
            if init_id in init_lookup:
                init_data = init_lookup[init_id]
                for adj in init_data.get("affected_controls", []):
                    control_eff_override[adj["control_id"]] = adj["proposed_effectiveness_pct"]
                for r_id in init_data.get("affected_risk_ids", []):
                    risk_eff_override[r_id] = max(
                        risk_eff_override.get(r_id, 0.0),
                        init_data.get("proposed_risk_effectiveness_pct", 85.0)
                    )

    # Apply direct custom adjustments
    if payload.custom_adjustments:
        for adj in payload.custom_adjustments:
            control_eff_override[adj.control_id] = adj.proposed_effectiveness_pct

    # Propagate control improvements to linked risks
    for c_id, proposed_eff in control_eff_override.items():
        for r_id in ctrl_to_risks.get(c_id, []):
            risk_eff_override[r_id] = max(risk_eff_override.get(r_id, 0.0), proposed_eff)

    # Baseline calculations
    baseline_criticals = sum(1 for r in risks if get_score_band(r.residual_risk_score) == "Critical")
    baseline_highs = sum(1 for r in risks if get_score_band(r.residual_risk_score) == "High")
    baseline_violating = sum(1 for r in risks if r.residual_risk_score > max_residual)
    baseline_avg_residual = sum(r.residual_risk_score for r in risks) / max(len(risks), 1)

    # Simulated calculations
    simulated_risks = []
    total_simulated_residual = 0.0
    simulated_violating = 0
    simulated_criticals = 0
    simulated_highs = 0

    for r in risks:
        # Determine simulated control effectiveness
        current_eff = r.control_effectiveness_pct or 0.0
        sim_eff = current_eff
        if r.risk_id in risk_eff_override:
            sim_eff = max(sim_eff, risk_eff_override[r.risk_id])
        for c_id, proposed_eff in control_eff_override.items():
            if c_id in (r.existing_controls or ""):
                sim_eff = max(sim_eff, proposed_eff)

        # Apply threat multiplier to inherent score (capped at 25)
        sim_inherent = min(25.0, r.inherent_risk_score * payload.threat_multiplier)
        sim_residual = calculate_residual_risk(sim_inherent, sim_eff)
        sim_band = get_score_band(sim_residual)

        total_simulated_residual += sim_residual
        if sim_residual > max_residual:
            simulated_violating += 1
        if sim_band == "Critical":
            simulated_criticals += 1
        elif sim_band == "High":
            simulated_highs += 1

        simulated_risks.append({
            "risk_id": r.risk_id,
            "title": r.title,
            "category": r.category,
            "baseline_inherent": r.inherent_risk_score,
            "baseline_residual": r.residual_risk_score,
            "baseline_band": get_score_band(r.residual_risk_score),
            "simulated_residual": sim_residual,
            "simulated_band": sim_band,
            "delta": round(sim_residual - r.residual_risk_score, 1),
            "appetite_compliant": sim_residual <= max_residual,
        })

    sim_avg_residual = total_simulated_residual / max(len(risks), 1)
    risk_reduction_pct = round(
        ((baseline_avg_residual - sim_avg_residual) / max(baseline_avg_residual, 0.1)) * 100, 1
    )

    # Calculate Total Initiative Cost
    total_investment_cost = 0.0
    if payload.enabled_initiatives:
        init_lookup = {init["id"]: init for init in AVAILABLE_INITIATIVES}
        for init_id in payload.enabled_initiatives:
            if init_id in init_lookup:
                total_investment_cost += init_lookup[init_id]["estimated_cost_usd"]

    # Calculate Return on Security Investment (ROSI)
    # Estimated single loss exposure baseline across assessed assets = $2,500,000
    estimated_asset_exposure = 2500000.0
    monetary_risk_reduction = (risk_reduction_pct / 100.0) * estimated_asset_exposure
    rosi_pct = (
        round(((monetary_risk_reduction - total_investment_cost) / total_investment_cost) * 100, 1)
        if total_investment_cost > 0 else 0.0
    )

    return {
        "threat_multiplier": payload.threat_multiplier,
        "active_initiative_count": len(payload.enabled_initiatives or []),
        "total_investment_cost_usd": total_investment_cost,
        "baseline_summary": {
            "avg_residual_score": round(baseline_avg_residual, 1),
            "critical_risks": baseline_criticals,
            "high_risks": baseline_highs,
            "risks_exceeding_appetite": baseline_violating,
        },
        "simulated_summary": {
            "avg_residual_score": round(sim_avg_residual, 1),
            "critical_risks": simulated_criticals,
            "high_risks": simulated_highs,
            "risks_exceeding_appetite": simulated_violating,
            "risk_reduction_pct": risk_reduction_pct,
            "appetite_violations_resolved": baseline_violating - simulated_violating,
            "estimated_monetary_risk_reduction_usd": round(monetary_risk_reduction, 2),
            "return_on_security_investment_rosi_pct": rosi_pct,
        },
        "simulated_risks": simulated_risks,
    }
