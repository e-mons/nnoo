# NNOO — Business Health Score Architecture & Calculation Model

Document ID: `HEALTH-SCORE-01`  
Governance Version: `1.0.0`  
Algorithm Identifier: `business-health-score-v1`  
Last Reconciled: `2026-08-20` (Tranche 4 Prompt 12 Handover)  
Status: **Authoritative Scoring Model**

---

## 1. Product Purpose & Statutory Boundaries

The **NNOO Business Health Score** is an automated, deterministic financial health metric designed to give business owners immediate visibility into the operational vitality and sustainability of their enterprise.

> [!WARNING]
> **LEGAL & REGULATORY BOUNDARY:**  
> The Business Health Score is an **internal operational management indicator**. It is **NOT** a formal credit bureau rating, bank-certified credit score, or guaranteed loan pre-approval under banking regulations. Marketing and technical documentation must never refer to it as a formal banking credit score.

---

## 2. Deterministic Calculation Model (`business-health-score-v1`)

The score is calculated purely in pure domain TypeScript (`@nnoo/domain`) using deterministic integer mathematics. **Google Gemini makes exactly 0 calculation calls.**

$$\text{Business Health Score} = \sum (\text{Component Score} \times \text{Weight}) \quad [\text{Range: } 0 - 100]$$

| Component | Weight | Max Points | Metrics Evaluated |
|---|---|---|---|
| **1. Profitability & Margins** | **30%** | 30 pts | Net Profit Margin, Gross Margin stability, Revenue growth trend |
| **2. Cash Flow & Liquidity** | **30%** | 30 pts | Operating cash vs short-term AP liabilities, Days Sales Outstanding (DSO) |
| **3. Inventory & Operations** | **25%** | 25 pts | Stock turnover ratio, Dead/slow-moving inventory percentage, Stockout rate |
| **4. Record Consistency** | **15%** | 15 pts | Frequency of daily bookkeeping entries, reconciled bank payments, low pending reviews |

---

## 3. Score Interpretation Bands

| Score Range | Category | Operational Meaning | Suggested System Action |
|---|---|---|---|
| **80 – 100** | **Excellent (Healthy)** | Strong margins, low debt, consistent daily bookkeeping | Eligible for Credit Passport high-tier profile badge |
| **65 – 79** | **Good (Stable)** | Profitable with minor liquidity or slow inventory bottlenecks | Suggest inventory optimization in Smart Insights |
| **50 – 64** | **Fair (Vulnerable)** | Thin margins, high overdue receivables or payables | Trigger cash collection attention events |
| **0 – 49** | **Needs Attention (Critical)** | Operating losses, excessive liabilities, erratic bookkeeping | Advise expense reduction and overdue debt settlement |

---

## 4. Grounded AI Explanations

- **Deterministic Facts First:** The server calculates the exact score (e.g. `78 / 100`) and the 4 sub-scores.
- **Gemini Narrative Layer:** Gemini receives the deterministic numbers and generates 2–3 sentences explaining the primary strength (e.g. *"Strong 25% net profit margin"*) and top area for improvement (e.g. *"₦50,000 overdue supplier payables"*).
- **Zero Hallucination:** Gemini is prohibited from altering the numeric score or inventing contributing factors.
