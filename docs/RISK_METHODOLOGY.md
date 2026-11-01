# RiskLens — Risk Scoring Methodology

> **Version:** 1.0
> **Status:** Implemented and documented
> **Last Updated:** 2026-11-01

## Disclaimer

This scoring methodology is implemented for demonstration purposes within the RiskLens platform. It simulates a simplified cybersecurity risk assessment for the fictional organisation Apex Financial Services. It does not constitute a formal risk assessment under any regulatory framework and does not produce legally binding compliance determinations.

---

## 1. Inherent Risk Score

### Definition
Inherent risk is the level of risk before any controls are applied.

### Formula
```
Inherent Risk Score = Likelihood × Impact
Range: 1 – 25 (integer)
```

### Likelihood Scale (1–5)
| Score | Label | Description |
|---|---|---|
| 1 | Rare | Unlikely to occur within 5 years |
| 2 | Unlikely | May occur within 5 years |
| 3 | Possible | May occur within 1–3 years |
| 4 | Likely | Expected to occur within 12 months |
| 5 | Almost Certain | Expected to occur in the near term |

### Impact Scale (1–5)
| Score | Label | Description |
|---|---|---|
| 1 | Negligible | Minimal operational disruption; no significant financial or reputational harm |
| 2 | Minor | Limited disruption; minor financial loss; recoverable within hours |
| 3 | Moderate | Significant operational impact; moderate financial loss; recoverable within days |
| 4 | Major | Severe disruption; substantial financial loss; regulatory notification required |
| 5 | Catastrophic | Critical system failure; existential financial or reputational damage; regulatory enforcement |

---

## 2. Risk Score Bands

| Score Range | Band | Colour |
|---|---|---|
| 1 – 4 | Low | Green |
| 5 – 9 | Medium | Yellow |
| 10 – 14 | High | Orange |
| 15 – 25 | Critical | Red |

These bands are configurable defaults. An organisation may adjust thresholds based on their risk appetite, though any change must be documented and consistently applied.

---

## 3. Residual Risk Score

### Definition
Residual risk is the level of risk remaining after existing controls are considered.

### Formula
```
Residual Risk Score = Inherent Risk Score × (1 − Control Effectiveness %)
```

### Important Methodological Disclaimer

The `control_effectiveness_pct` value is a **consultant-assessed qualitative judgement**, not an objectively measured reduction in the probability of an attack succeeding. A value of 60% means the assessor considers existing controls reduce the overall risk exposure by approximately 60%.

This simplification is common in qualitative risk assessments but should not be interpreted as:
- A precise actuarial calculation
- A guarantee that attacks are 60% less likely to succeed
- A formal security metric

In practice, control effectiveness is assessed through:
- Evidence review
- Configuration inspection
- Control testing (sampling where applicable)
- Interview with control owners

### Minimum Residual Score
The residual risk score must not fall below **1** when using this methodology. A score of 0 would imply complete elimination of risk, which is not achievable in practice. Implementation: `max(residual, 1.0)`.

---

## 4. Target Risk Score

Target risk is the desired risk level after planned improvements are implemented. It is documented as:
- Target likelihood (after proposed controls)
- Target impact (after proposed risk treatment)
- Derived target score (same formula as inherent)

Target risk is compared against residual risk to measure the gap requiring remediation.

---

## 5. Risk Treatment Strategies

| Strategy | Description | Acceptance Required |
|---|---|---|
| **Avoid** | Eliminate the activity or asset generating the risk | No |
| **Mitigate** | Implement or improve controls to reduce likelihood or impact | No |
| **Transfer** | Shift financial consequence to a third party (insurance, contract) | No |
| **Accept** | Acknowledge the risk and tolerate it within appetite | YES — approval required |

### Risk Acceptance Requirements
Risk acceptance must be documented with:
- Business justification
- Compensating controls in place
- Residual risk score at time of acceptance
- Risk owner (accountable person)
- Approval authority (role and name)
- Approval timestamp
- Expiry date (when acceptance must be reviewed)
- Review date

---

## 6. Risk Appetite Integration

Risk appetite defines the maximum level of risk the organisation is willing to accept in pursuit of its objectives.

### Fields
| Field | Description |
|---|---|
| Max acceptable inherent risk | Risks above this score require executive escalation |
| Max acceptable residual risk | Risks above this score cannot be accepted without board approval |
| Risk tolerance range | Band above appetite where risk requires treatment (not immediate escalation) |
| Escalation threshold | Score at which risk must be escalated to the risk committee |
| Review frequency | How often risk register must be reviewed (e.g., quarterly) |

### Appetite Violation Detection
The platform flags risks where:
- Residual risk score > Max acceptable residual risk
- Risk is marked as "Accepted" with residual > appetite

---

## 7. Limitations of This Methodology

1. **Qualitative, not quantitative.** This is a 5×5 likelihood-impact matrix, not a quantitative model such as FAIR (Factor Analysis of Information Risk).

2. **Control effectiveness is subjective.** The percentage reduction is a consultant judgement, not a technical measurement.

3. **Single score per risk.** A risk can have multiple impact dimensions (financial, operational, reputational, regulatory) but this model produces a single composite score.

4. **Point-in-time.** Risk scores reflect the control environment at the time of assessment. They change as controls improve or degrade.

5. **No threat intelligence integration.** Likelihood estimates are based on assessor judgement, not threat intelligence feeds.

6. **Correlation not modelled.** Related risks may have compounding effects not captured by individual scores.

---

## 8. Framework References

This methodology draws concepts from:
- NIST Special Publication 800-30 Rev 1 (Guide for Conducting Risk Assessments)
- ISO/IEC 27005:2022 (Information Security Risk Management)
- FAIR Institute (conceptually — not formally implemented here)

No claim of conformance with any of these frameworks is made.

