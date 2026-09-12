# NNOO Business Health Score Formula Specification

**Formula Version:** `business-health-score-v1`  
**Governance Version:** 1.0.0  
**Status:** Canonical & Source-Controlled  
**Scale:** 0–100 (Integer, rounded to nearest whole number)  
**Applicability:** SMEs operating with NNOO business records (Merchandising & Service businesses)

---

## 1. Overview & Non-Credit Boundary

The **NNOO Business Health Score** is an internal operational and financial health indicator calculated deterministically by NNOO's server code from verified accounting and operational records.

> **CRITICAL LEGAL & REGULATORY BOUNDARY:**  
> The Business Health Score is **NOT** a bank credit score, credit bureau score, loan approval, audited financial opinion, or guarantee of commercial success. It is an operational tool designed to help business owners understand performance, strengths, and areas requiring attention.

---

## 2. Score Dimensions & Configured Weights

| Dimension Key | Dimension Name | Configured Weight | Applicability Condition | Description |
|---|---|---|---|---|
| `SALES_PROFITABILITY` | Sales & Profitability | 30 | `ALWAYS` | Evaluates gross profit margin and operating result positivity |
| `OPERATING_EFFICIENCY` | Operating Efficiency | 25 | `ALWAYS` | Evaluates operating expenses as a proportion of gross profit and revenue |
| `RECEIVABLES_COLLECTION` | Receivables & Collection | 20 | `ALWAYS` | Evaluates accounts receivable pressure relative to sales and overdue invoice status |
| `BUSINESS_OBLIGATIONS` | Business Obligations | 15 | `ALWAYS` | Evaluates accounts payable obligations relative to operating result and gross profit |
| `INVENTORY_READINESS` | Inventory Readiness | 10 | `HAS_TRACKED_INVENTORY` | Evaluates stock availability, low-stock items, and out-of-stock items |

---

## 3. Minimum Data Coverage & Insufficient Data Policy

To prevent generating misleading scores on sparse data:
- **Core Requirement**: A business must have at least 1 recorded sale or expense in the evaluation period (e.g. current month or last 30 days) AND at least 7 days of operational context.
- If verified records indicate 0 sales, 0 expenses, and no established balance sheet data:
  - `status = INSUFFICIENT_DATA`
  - `dataCoverage = INSUFFICIENT`
  - `score = null`
  - `scoreBand = null`
  - User is presented with "Not enough data yet" and guidance to record business transactions.

---

## 4. Applicability & Normalization Formula

For service businesses with 0 tracked physical inventory products:
- `INVENTORY_READINESS.status = NOT_APPLICABLE`
- `INVENTORY_READINESS.appliedWeight = 0`

### Final Score Weighted Formula:
$$\text{Final Score} = \operatorname{round}\left( \frac{\sum_{d \in \text{Applicable}} (\text{Dimension Score}_d \times \text{Configured Weight}_d)}{\sum_{d \in \text{Applicable}} \text{Configured Weight}_d} \right)$$

The final score is guaranteed to be an integer between 0 and 100 inclusive ($0 \le \text{Final Score} \le 100$).

---

## 5. Detailed Dimension Calculation Rules

### Dimension 1: `SALES_PROFITABILITY` (Base Weight: 30)
- **Inputs**: Net Sales ($S$), Cost of Goods Sold ($COGS$), Gross Profit ($GP = S - COGS$), Operating Result ($OR$).
- **Logic**:
  1. If Net Sales $\le 0$:
     - If $GP < 0$ or $OR < 0$: Dimension Score = 15.
     - Else: Dimension Score = 40.
  2. Gross Profit Margin Ratio ($GPM = GP / S$):
     - If $GPM \ge 0.40$ (40%+ margin): Base = 90.
     - If $GPM \ge 0.20$ (20%–40% margin): Base = 75.
     - If $GPM > 0$ (0%–20% margin): Base = 60.
     - If $GPM \le 0$ (negative gross margin): Base = 20.
  3. Operating Result Modifier:
     - If $OR > 0$ (profitable net operations): +10 points (capped at 100).
     - If $OR < 0$ (net operating loss): -20 points (floored at 0).
- **Emitted Reason Keys**:
  - `GROSS_PROFIT_STRONG` (if $GPM \ge 0.40$)
  - `GROSS_PROFIT_HEALTHY` (if $0.20 \le GPM < 0.40$)
  - `GROSS_PROFIT_LOW` (if $0 < GPM < 0.20$)
  - `GROSS_PROFIT_NEGATIVE` (if $GPM \le 0$)
  - `OPERATING_RESULT_POSITIVE` (if $OR > 0$)
  - `OPERATING_RESULT_NEGATIVE` (if $OR < 0$)

### Dimension 2: `OPERATING_EFFICIENCY` (Base Weight: 25)
- **Inputs**: Operating Expenses ($OPEX$), Gross Profit ($GP$), Net Sales ($S$).
- **Logic**:
  - Operating Expense Burden Ratio ($EBR$):
    - If $GP > 0$: $EBR = OPEX / GP$.
    - Else if $S > 0$: $EBR = OPEX / S$.
    - Else: $EBR = 1.0$.
  - Scoring:
    - $EBR \le 0.40$ (Expenses take $\le 40\%$ of gross profit): Score = 95.
    - $0.40 < EBR \le 0.65$ (Expenses take $40\%–65\%$): Score = 80.
    - $0.65 < EBR \le 0.85$ (Expenses take $65\%–85\%$): Score = 65.
    - $0.85 < EBR \le 1.00$ (Expenses take $85\%–100\%$): Score = 50.
    - $EBR > 1.00$ (Expenses exceed gross profit): Score = $\max(10, \operatorname{round}(50 - (EBR - 1.0) \times 40))$.
- **Emitted Reason Keys**:
  - `EXPENSE_MANAGEMENT_EFFICIENT` ($EBR \le 0.65$)
  - `EXPENSE_PRESSURE_MODERATE` ($0.65 < EBR \le 0.85$)
  - `EXPENSE_PRESSURE_ELEVATED` ($EBR > 0.85$)
  - `EXPENSES_EXCEED_GROSS_PROFIT` ($EBR > 1.00$)

### Dimension 3: `RECEIVABLES_COLLECTION` (Base Weight: 20)
- **Inputs**: Total Accounts Receivable ($AR$), Overdue Invoices Count ($OIC$), Net Sales ($S$).
- **Logic**:
  1. If $AR == 0$: Score = 100 (No uncollected customer credit risk).
  2. Receivable Exposure Ratio ($RER = AR / \max(S, 1)$):
     - If $RER \le 0.15$ (Receivables $\le 15\%$ of period sales): Base = 90.
     - If $0.15 < RER \le 0.35$ (Receivables $15\%–35\%$ of sales): Base = 75.
     - If $0.35 < RER \le 0.60$ (Receivables $35\%–60\%$ of sales): Base = 60.
     - If $RER > 0.60$ (Receivables $> 60\%$ of sales): Base = 40.
  3. Overdue Invoices Penalty:
     - 0 overdue invoices: 0 penalty.
     - 1–2 overdue invoices: -10 penalty.
     - 3+ overdue invoices: -20 penalty.
- **Emitted Reason Keys**:
  - `RECEIVABLES_MINIMAL` ($AR == 0$)
  - `RECEIVABLES_HEALTHY` ($RER \le 0.35$ and $OIC == 0$)
  - `RECEIVABLES_ELEVATED` ($RER > 0.35$)
  - `OVERDUE_INVOICES_PRESENT` ($OIC > 0$)

### Dimension 4: `BUSINESS_OBLIGATIONS` (Base Weight: 15)
- **Inputs**: Total Accounts Payable ($AP$), Gross Profit ($GP$), Operating Result ($OR$).
- **Logic**:
  1. If $AP == 0$: Score = 100 (No outstanding supplier liabilities).
  2. Payable Burden Ratio ($PBR = AP / \max(GP, 1)$):
     - If $PBR \le 0.25$ (AP $\le 25\%$ of period gross profit): Score = 90.
     - If $0.25 < PBR \le 0.50$ (AP $25\%–50\%$ of gross profit): Score = 75.
     - If $0.50 < PBR \le 0.80$ (AP $50\%–80\%$ of gross profit): Score = 60.
     - If $PBR > 0.80$ (AP $> 80\%$ of gross profit): Score = 40.
  3. If $GP \le 0$ and $AP > 0$: Score = 30.
- **Emitted Reason Keys**:
  - `PAYABLES_CLEAN` ($AP == 0$)
  - `PAYABLES_MANAGEABLE` ($PBR \le 0.50$)
  - `PAYABLES_ELEVATED` ($PBR > 0.50$)

### Dimension 5: `INVENTORY_READINESS` (Base Weight: 10)
- **Inputs**: Tracked Products Count ($TPC$), Low Stock Count ($LSC$), Out of Stock Count ($OSC$).
- **Applicability**:
  - If $TPC == 0$: Status = `NOT_APPLICABLE`, Score = null, Weight = 0.
- **Logic** (when $TPC > 0$):
  - Stock Risk Ratio ($SRR = (LSC + 2 \times OSC) / TPC$):
    - If $SRR == 0$ (No low or out of stock items): Score = 100.
    - If $SRR \le 0.15$ ($\le 15\%$ items impacted): Score = 85.
    - If $0.15 < SRR \le 0.35$ ($15\%–35\%$ items impacted): Score = 70.
    - If $0.35 < SRR \le 0.60$ ($35\%–60\%$ items impacted): Score = 50.
    - If $SRR > 0.60$ ($> 60\%$ items impacted): Score = 25.
- **Emitted Reason Keys**:
  - `INVENTORY_OPTIMAL` ($SRR == 0$)
  - `INVENTORY_STABLE` ($0 < SRR \le 0.15$)
  - `LOW_STOCK_ALERT` ($LSC > 0$)
  - `OUT_OF_STOCK_ALERT` ($OSC > 0$)
  - `INVENTORY_NOT_APPLICABLE` ($TPC == 0$)

---

## 6. Score Bands

| Score Range | Score Band Key | UI Display Label | Description |
|---|---|---|---|
| 80–100 | `STRONG` | Strong | Excellent operational margins, controlled expenses, and manageable liabilities. |
| 65–79 | `GOOD` | Good | Solid operational performance with minor areas to monitor. |
| 50–64 | `FAIR` | Fair | Acceptable baseline but notable expense, receivable, or margin pressures. |
| 0–49 | `NEEDS_ATTENTION` | Needs Attention | Significant financial pressure, uncollected receivables, or negative operating results. |

---

## 7. Data Coverage Model

| Coverage Level | Conditions | Meaning |
|---|---|---|
| `HIGH` | $\ge 60$ days of operational data, sales in current and prior periods, active balance tracking. | Comprehensive data; highly reliable score. |
| `MEDIUM` | $\ge 21$ days of data, sales and expense activity recorded in current period. | Good data foundation for operational assessment. |
| `LOW` | $7–20$ days of data, or only minimal transactions recorded. | Early operational activity; score reflects available records. |
| `INSUFFICIENT` | $< 7$ days of data, 0 sales, 0 expenses. | Inadequate data; numeric score is withheld. |
