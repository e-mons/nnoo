import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { InvoiceWithLines, InvoiceCustomerSnapshot, InvoiceBusinessSnapshot } from '@nnoo/contracts';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  businessInfo: {
    fontSize: 10,
    color: '#666666',
    textAlign: 'right',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    paddingBottom: 2,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  label: {
    width: 100,
    fontSize: 10,
    color: '#666666',
  },
  value: {
    fontSize: 10,
    flex: 1,
  },
  table: {
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderColor: '#bfbfbf',
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#bfbfbf',
    backgroundColor: '#f5f5f5',
    padding: 5,
  },
  tableCol: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#bfbfbf',
    padding: 5,
  },
  tableCellHeader: {
    margin: 'auto',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tableCell: {
    margin: 'auto',
    fontSize: 10,
  },
  totals: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    marginBottom: 5,
    width: 200,
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 10,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#999999',
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    paddingTop: 10,
  }
});

interface InvoicePDFProps {
  invoice: InvoiceWithLines;
}

export function InvoicePDF({ invoice }: InvoicePDFProps) {
  const business = invoice.business_snapshot as unknown as InvoiceBusinessSnapshot;
  const customer = invoice.customer_snapshot as unknown as InvoiceCustomerSnapshot;

  const formatMoney = (minor: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice.currency_code,
    }).format(minor / 100);
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>INVOICE</Text>
            {invoice.document_status === 'voided' && (
              <Text style={{ color: 'red', fontSize: 14, marginTop: 5 }}>VOIDED</Text>
            )}
            <Text style={{ fontSize: 10, marginTop: 10 }}>#{invoice.invoice_number}</Text>
          </View>
          <View style={styles.businessInfo}>
            <Text style={{ fontWeight: 'bold', color: '#000', marginBottom: 2 }}>{business?.name || 'Business'}</Text>
            {business?.address_line_1 && <Text>{business.address_line_1}</Text>}
            {business?.city && <Text>{business.city}, {business.country_code}</Text>}
            {business?.email && <Text>{business.email}</Text>}
            {business?.phone && <Text>{business.phone}</Text>}
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 }}>
          <View style={{ width: '45%' }}>
            <Text style={styles.sectionTitle}>Bill To:</Text>
            <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 2 }}>{customer?.name || 'Customer'}</Text>
            {customer?.email && <Text style={{ fontSize: 10 }}>{customer.email}</Text>}
            {customer?.phone && <Text style={{ fontSize: 10 }}>{customer.phone}</Text>}
          </View>
          <View style={{ width: '45%' }}>
            <Text style={styles.sectionTitle}>Details:</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Issue Date:</Text>
              <Text style={styles.value}>{invoice.issue_date || 'N/A'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Due Date:</Text>
              <Text style={styles.value}>{invoice.due_date || 'N/A'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Status:</Text>
              <Text style={styles.value}>{invoice.document_status.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={[styles.tableColHeader, { width: '40%' }]}>
              <Text style={styles.tableCellHeader}>Item</Text>
            </View>
            <View style={[styles.tableColHeader, { width: '20%' }]}>
              <Text style={styles.tableCellHeader}>Qty</Text>
            </View>
            <View style={[styles.tableColHeader, { width: '20%' }]}>
              <Text style={styles.tableCellHeader}>Price</Text>
            </View>
            <View style={[styles.tableColHeader, { width: '20%' }]}>
              <Text style={styles.tableCellHeader}>Total</Text>
            </View>
          </View>
          
          {invoice.lines?.map((line, i) => (
            <View style={styles.tableRow} key={i}>
              <View style={[styles.tableCol, { width: '40%' }]}>
                <Text style={[styles.tableCell, { textAlign: 'left' }]}>{line.item_name_snapshot}</Text>
              </View>
              <View style={[styles.tableCol, { width: '20%' }]}>
                <Text style={styles.tableCell}>{line.quantity}</Text>
              </View>
              <View style={[styles.tableCol, { width: '20%' }]}>
                <Text style={styles.tableCell}>{formatMoney(line.unit_price_minor)}</Text>
              </View>
              <View style={[styles.tableCol, { width: '20%' }]}>
                <Text style={styles.tableCell}>{formatMoney(line.line_total_minor)}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatMoney(invoice.subtotal_minor)}</Text>
          </View>
          {invoice.discount_total_minor > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount:</Text>
              <Text style={styles.totalValue}>-{formatMoney(invoice.discount_total_minor)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.grandTotalLabel}>Total:</Text>
            <Text style={styles.grandTotalValue}>{formatMoney(invoice.total_minor)}</Text>
          </View>
        </View>

        {invoice.notes && (
          <View style={{ marginTop: 40 }}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={{ fontSize: 10 }}>{invoice.notes}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text>Thank you for your business!</Text>
        </View>
      </Page>
    </Document>
  );
}
