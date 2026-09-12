import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { Receipt, InvoiceCustomerSnapshot, InvoiceBusinessSnapshot } from '@nnoo/contracts';

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
    marginBottom: 5,
  },
  label: {
    width: 120,
    fontSize: 10,
    color: '#666666',
  },
  value: {
    fontSize: 10,
    flex: 1,
    fontWeight: 'bold',
  },
  amountBox: {
    backgroundColor: '#f9f9f9',
    padding: 20,
    alignItems: 'center',
    marginBottom: 30,
    borderRadius: 5,
  },
  amountLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 5,
  },
  amountValue: {
    fontSize: 24,
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

interface ReceiptPDFProps {
  receipt: Receipt;
}

export function ReceiptPDF({ receipt }: ReceiptPDFProps) {
  const business = receipt.business_snapshot as unknown as InvoiceBusinessSnapshot;
  const customer = receipt.customer_snapshot as unknown as InvoiceCustomerSnapshot | null;

  const formatMoney = (minor: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: receipt.currency_code,
    }).format(minor / 100);
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>PAYMENT RECEIPT</Text>
            <Text style={{ fontSize: 10, marginTop: 10 }}>#{receipt.receipt_number}</Text>
          </View>
          <View style={styles.businessInfo}>
            <Text style={{ fontWeight: 'bold', color: '#000', marginBottom: 2 }}>{business?.name || 'Business'}</Text>
            {business?.address_line_1 && <Text>{business.address_line_1}</Text>}
            {business?.city && <Text>{business.city}, {business.country_code}</Text>}
            {business?.email && <Text>{business.email}</Text>}
            {business?.phone && <Text>{business.phone}</Text>}
          </View>
        </View>

        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>AMOUNT PAID</Text>
          <Text style={styles.amountValue}>{formatMoney(receipt.amount_minor)}</Text>
        </View>

        <View style={{ marginBottom: 30 }}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{new Date(receipt.payment_occurred_at).toLocaleDateString('en-US')}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Method:</Text>
            <Text style={styles.value}>{receipt.payment_method_snapshot.toUpperCase()}</Text>
          </View>
          {receipt.payment_reference_snapshot && (
            <View style={styles.row}>
              <Text style={styles.label}>Reference:</Text>
              <Text style={styles.value}>{receipt.payment_reference_snapshot}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Applied to Sale:</Text>
            <Text style={styles.value}>{receipt.sale_number_snapshot}</Text>
          </View>
          {receipt.invoice_number_snapshot && (
            <View style={styles.row}>
              <Text style={styles.label}>Applied to Invoice:</Text>
              <Text style={styles.value}>{receipt.invoice_number_snapshot}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Remaining Balance:</Text>
            <Text style={styles.value}>{formatMoney(receipt.balance_after_payment_minor)}</Text>
          </View>
        </View>

        {customer && (
          <View style={{ marginBottom: 30 }}>
            <Text style={styles.sectionTitle}>Received From</Text>
            <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 2 }}>{customer.name}</Text>
            {customer.email && <Text style={{ fontSize: 10 }}>{customer.email}</Text>}
            {customer.phone && <Text style={{ fontSize: 10 }}>{customer.phone}</Text>}
          </View>
        )}

        <View style={styles.footer}>
          <Text>Official proof of payment. Retain for your records.</Text>
        </View>
      </Page>
    </Document>
  );
}
