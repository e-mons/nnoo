import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import type { CreditPassportSnapshot } from '@nnoo/contracts';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 32,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 2,
    borderBottomColor: '#0f172a',
    paddingBottom: 16,
    marginBottom: 20,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 3,
  },
  passportMeta: {
    textAlign: 'right',
  },
  passportCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  passportVersion: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569',
    marginTop: 2,
  },
  metaText: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardHalf: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardFull: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 3,
  },
  provenanceTag: {
    fontSize: 7,
    color: '#94a3b8',
    marginTop: 6,
    fontStyle: 'italic',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  label: {
    fontSize: 8,
    color: '#64748b',
  },
  value: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  healthBadge: {
    backgroundColor: '#e0f2fe',
    borderRadius: 4,
    padding: 8,
    alignItems: 'center',
    marginVertical: 4,
  },
  healthScoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0369a1',
  },
  healthBandText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0284c7',
    marginTop: 2,
  },
  disclaimerBox: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#fffbeb',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  disclaimerTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 3,
  },
  disclaimerText: {
    fontSize: 7,
    color: '#78350f',
    lineHeight: 1.3,
  },
  footer: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 7,
    color: '#94a3b8',
  },
});

function formatCurrency(minor: number | string | null | undefined, currency: string = 'NGN'): string {
  const num = typeof minor === 'string' ? parseFloat(minor) : Number(minor);
  const safeMinor = isNaN(num) || !isFinite(num) ? 0 : num;
  const major = safeMinor / 100;
  return `${currency} ${major.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function CreditPassportPDF({ snapshot }: { snapshot: CreditPassportSnapshot }) {
  const { payload } = snapshot;
  const { businessIdentity, financialPerformance, currentPosition, invoiceActivity, inventoryPosition, healthScore, recordedHistory, dataCoverage } = payload;
  const currency = businessIdentity.currencyCode || 'NGN';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandTitle}>NNOO CREDIT PASSPORT</Text>
            <Text style={styles.brandSubtitle}>Verified Business Profile & Operational Evidence</Text>
          </View>
          <View style={styles.passportMeta}>
            <Text style={styles.passportCode}>{snapshot.passportCode}</Text>
            <Text style={styles.passportVersion}>Version {snapshot.passportVersion}</Text>
            <Text style={styles.metaText}>Generated: {new Date(snapshot.createdAt).toLocaleDateString()}</Text>
            <Text style={styles.metaText}>Coverage: {dataCoverage.level.toUpperCase()}</Text>
          </View>
        </View>

        {/* Business Identity & Recorded History */}
        <View style={styles.grid}>
          <View style={styles.cardHalf}>
            <Text style={styles.sectionTitle}>Business Identity</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Business Name</Text>
              <Text style={styles.value}>{businessIdentity.name}</Text>
            </View>
            {businessIdentity.legalName && (
              <View style={styles.row}>
                <Text style={styles.label}>Legal Name</Text>
                <Text style={styles.value}>{businessIdentity.legalName}</Text>
              </View>
            )}
            <View style={styles.row}>
              <Text style={styles.label}>Industry</Text>
              <Text style={styles.value}>{businessIdentity.industry || 'General'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Location</Text>
              <Text style={styles.value}>{[businessIdentity.city, businessIdentity.state, businessIdentity.countryCode].filter(Boolean).join(', ')}</Text>
            </View>
            {businessIdentity.registrationNumber && (
              <View style={styles.row}>
                <Text style={styles.label}>Registration No.</Text>
                <Text style={styles.value}>{businessIdentity.registrationNumber}</Text>
              </View>
            )}
            <Text style={styles.provenanceTag}>Source: Business Profile</Text>
          </View>

          <View style={styles.cardHalf}>
            <Text style={styles.sectionTitle}>Recorded History</Text>
            <View style={styles.row}>
              <Text style={styles.label}>First Activity</Text>
              <Text style={styles.value}>{recordedHistory.firstRecordedDate || 'N/A'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Latest Activity</Text>
              <Text style={styles.value}>{recordedHistory.lastRecordedDate || 'Current'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Operating Days</Text>
              <Text style={styles.value}>{recordedHistory.recordedDaysCount} days</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Data Coverage</Text>
              <Text style={styles.value}>{dataCoverage.level.toUpperCase()}</Text>
            </View>
            <Text style={styles.provenanceTag}>Source: NNOO Operational Records</Text>
          </View>
        </View>

        {/* Financial Performance & Current Position */}
        <View style={styles.grid}>
          <View style={styles.cardHalf}>
            <Text style={styles.sectionTitle}>Financial Performance (90 Days)</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Net Sales</Text>
              <Text style={styles.value}>{formatCurrency(financialPerformance.netSalesMinor, currency)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Gross Profit</Text>
              <Text style={styles.value}>{formatCurrency(financialPerformance.grossProfitMinor, currency)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Operating Expenses</Text>
              <Text style={styles.value}>{formatCurrency(financialPerformance.operatingExpensesMinor, currency)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Operating Result</Text>
              <Text style={styles.value}>{formatCurrency(financialPerformance.operatingResultMinor, currency)}</Text>
            </View>
            <Text style={styles.provenanceTag}>Source: NNOO Financial Calculation</Text>
          </View>

          <View style={styles.cardHalf}>
            <Text style={styles.sectionTitle}>Current Position</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Accounts Receivable</Text>
              <Text style={styles.value}>{formatCurrency(currentPosition.accountsReceivableMinor, currency)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Accounts Payable</Text>
              <Text style={styles.value}>{formatCurrency(currentPosition.accountsPayableMinor, currency)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Inventory Value</Text>
              <Text style={styles.value}>
                {inventoryPosition.isApplicable && inventoryPosition.inventoryValueMinor !== null
                  ? formatCurrency(inventoryPosition.inventoryValueMinor, currency)
                  : 'Not Applicable'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Overdue Invoices</Text>
              <Text style={styles.value}>{currentPosition.overdueInvoicesCount}</Text>
            </View>
            <Text style={styles.provenanceTag}>Source: NNOO Operational Records (As of {new Date(currentPosition.asOf).toLocaleDateString()})</Text>
          </View>
        </View>

        {/* Invoice Activity, Inventory & Health Score */}
        <View style={styles.grid}>
          <View style={styles.cardHalf}>
            <Text style={styles.sectionTitle}>Invoice & Operations</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Total Invoices</Text>
              <Text style={styles.value}>{invoiceActivity.totalInvoicesCount}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Paid Invoices</Text>
              <Text style={styles.value}>{invoiceActivity.paidInvoicesCount}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Tracked Products</Text>
              <Text style={styles.value}>{inventoryPosition.isApplicable ? inventoryPosition.trackedItemsCount : 'Service Business'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Stock Alerts</Text>
              <Text style={styles.value}>{inventoryPosition.lowStockCount + inventoryPosition.outOfStockCount}</Text>
            </View>
            <Text style={styles.provenanceTag}>Source: NNOO Operational Records</Text>
          </View>

          <View style={styles.cardHalf}>
            <Text style={styles.sectionTitle}>NNOO Business Health Score</Text>
            <View style={styles.healthBadge}>
              <Text style={styles.healthScoreText}>
                {healthScore.score !== null ? `${healthScore.score} / 100` : 'INSUFFICIENT DATA'}
              </Text>
              {healthScore.scoreBand && (
                <Text style={styles.healthBandText}>{healthScore.scoreBand.toUpperCase()}</Text>
              )}
            </View>
            <Text style={styles.provenanceTag}>Formula: {healthScore.formulaVersion}</Text>
          </View>
        </View>

        {/* AI Explanation Summary if present */}
        {snapshot.aiExplanation && (
          <View style={styles.cardFull}>
            <Text style={styles.sectionTitle}>NNOO AI Passport Summary</Text>
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 }}>
              {snapshot.aiExplanation.headline}
            </Text>
            <Text style={{ fontSize: 8, color: '#334155', lineHeight: 1.4 }}>
              {snapshot.aiExplanation.overview}
            </Text>
            <Text style={styles.provenanceTag}>AI Model: {snapshot.aiExplanation.modelId} (Grounded in verified facts)</Text>
          </View>
        )}

        {/* Important Disclaimers */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerTitle}>IMPORTANT NOTICE & LEGAL DISCLAIMER</Text>
          <Text style={styles.disclaimerText}>
            • This Credit Passport reflects Business information recorded in NNOO as of the stated generation timestamp. It is not an independent audit.
          </Text>
          <Text style={styles.disclaimerText}>
            • The Credit Passport is an operational Business profile and does not constitute a Credit Score, credit bureau rating, loan approval, or lending guarantee.
          </Text>
          <Text style={styles.disclaimerText}>
            • Business Profile information was provided by the Business. Operational and financial figures are derived from records maintained in NNOO.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Artifact Hash: {snapshot.artifactHash.slice(0, 16)}...
          </Text>
          <Text style={styles.footerText}>
            Generated by NNOO Business Operating System • Confidential
          </Text>
        </View>
      </Page>
    </Document>
  );
}
