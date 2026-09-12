import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@nnoo/supabase/database.types';
import type {
  BookkeepingApplicationTargetType,
  BookkeepingFinalOperationKind,
  ExpenseApplyPayload,
  StockPurchaseApplyPayload,
  CustomerPaymentApplyPayload,
  SupplierPaymentApplyPayload,
  SaleApplyPayload,
  RefundApplyPayload,
} from '@nnoo/contracts/ai';
import { AISafeError } from '../../service';

export interface AdapterResult {
  canonicalTargetType: BookkeepingApplicationTargetType;
  canonicalTargetId: string;
  canonicalTargetReference?: string;
  expenseId?: string | null;
  stockReceiptId?: string | null;
  saleId?: string | null;
  salePaymentId?: string | null;
  expensePaymentId?: string | null;
  stockReceiptPaymentId?: string | null;
  saleRefundId?: string | null;
}

export interface IBookkeeperOperationAdapter<T> {
  apply(
    supabase: SupabaseClient<Database>,
    businessId: string,
    userId: string,
    payload: T,
    idempotencyKey: string
  ): Promise<AdapterResult>;
}

export class ExpenseBookkeeperAdapter implements IBookkeeperOperationAdapter<ExpenseApplyPayload> {
  async apply(
    supabase: SupabaseClient<Database>,
    businessId: string,
    userId: string,
    payload: ExpenseApplyPayload,
    idempotencyKey: string
  ): Promise<AdapterResult> {
    // 1. Verify category exists, is active, and belongs to this business
    const { data: category, error: catError } = await supabase
      .from('expense_categories')
      .select('id, status')
      .eq('id', payload.expenseCategoryId)
      .eq('business_id', businessId)
      .maybeSingle();

    if (catError || !category) {
      throw new AISafeError('AI_BOOKKEEPER_TARGET_NOT_FOUND', 'Selected expense category was not found.', false);
    }
    if (category.status === 'archived' || category.status === 'inactive') {
      throw new AISafeError('AI_BOOKKEEPER_STALE_CLASSIFICATION', 'Selected expense category is archived or inactive.', false);
    }

    // 2. If supplier provided, verify supplier
    if (payload.supplierId) {
      const { data: supplier, error: supError } = await supabase
        .from('suppliers')
        .select('id, status')
        .eq('id', payload.supplierId)
        .eq('business_id', businessId)
        .maybeSingle();

      if (supError || !supplier) {
        throw new AISafeError('AI_BOOKKEEPER_TARGET_NOT_FOUND', 'Selected supplier was not found.', false);
      }
      if (supplier.status === 'archived' || supplier.status === 'inactive') {
        throw new AISafeError('AI_BOOKKEEPER_STALE_CLASSIFICATION', 'Selected supplier is archived or inactive.', false);
      }
    }

    const rpcPayload = {
      businessId,
      categoryId: payload.expenseCategoryId,
      amountMinor: payload.amountMinor,
      totalMinor: payload.amountMinor,
      currencyCode: 'NGN',
      description: payload.description,
      effectiveDate: payload.occurredAt,
      occurredAt: payload.occurredAt,
      supplierId: payload.supplierId || null,
      externalReference: payload.payment?.reference || null,
      notes: payload.notes || null,
      receiptPath: payload.receiptUrl || null,
      receiptUrl: payload.receiptUrl || null,
      idempotencyKey,
      payment: payload.payment
        ? {
            amountMinor: payload.payment.amountMinor,
            paymentMethod: payload.payment.paymentMethod,
            externalReference: payload.payment.reference || null,
          }
        : null,
      payments: payload.payment
        ? [
            {
              amountMinor: payload.payment.amountMinor,
              paymentMethod: payload.payment.paymentMethod,
              reference: payload.payment.reference || null,
            },
          ]
        : null,
    };

    const { data, error } = await supabase.rpc('create_expense', {
      payload: rpcPayload as any,
    });

    if (error) {
      throw new AISafeError('AI_BOOKKEEPER_APPLICATION_FAILED', error.message || 'Failed to create expense.', false);
    }

    const expenseRecord = data as any;
    return {
      canonicalTargetType: 'EXPENSE',
      canonicalTargetId: expenseRecord.id,
      canonicalTargetReference: expenseRecord.expense_number || expenseRecord.id,
      expenseId: expenseRecord.id,
    };
  }
}

export class StockPurchaseBookkeeperAdapter implements IBookkeeperOperationAdapter<StockPurchaseApplyPayload> {
  async apply(
    supabase: SupabaseClient<Database>,
    businessId: string,
    userId: string,
    payload: StockPurchaseApplyPayload,
    idempotencyKey: string
  ): Promise<AdapterResult> {
    // 1. Verify supplier
    const { data: supplier, error: supError } = await supabase
      .from('suppliers')
      .select('id, status')
      .eq('id', payload.supplierId)
      .eq('business_id', businessId)
      .maybeSingle();

    if (supError || !supplier) {
      throw new AISafeError('AI_BOOKKEEPER_TARGET_NOT_FOUND', 'Selected supplier was not found.', false);
    }
    if (supplier.status === 'archived' || supplier.status === 'inactive') {
      throw new AISafeError('AI_BOOKKEEPER_STALE_CLASSIFICATION', 'Selected supplier is archived or inactive.', false);
    }

    // 2. Verify all catalog items belong to this business
    const itemIds = payload.items.map((i) => i.catalogItemId);
    const { data: catalogItems, error: itemError } = await supabase
      .from('catalog_items')
      .select('id, status, track_inventory')
      .in('id', itemIds)
      .eq('business_id', businessId);

    if (itemError || !catalogItems || catalogItems.length !== itemIds.length) {
      throw new AISafeError('AI_BOOKKEEPER_TARGET_NOT_FOUND', 'One or more selected products were not found in this business.', false);
    }

    const rpcPayload = {
      businessId,
      supplierId: payload.supplierId,
      receivedAt: payload.receivedAt,
      supplierInvoiceNumber: payload.supplierInvoiceNumber || null,
      notes: payload.notes || null,
      idempotencyKey,
      items: payload.items.map((item) => ({
        catalogItemId: item.catalogItemId,
        quantity: item.quantity,
        unitCostMinor: item.unitCostMinor,
        batchNumber: item.batchNumber || null,
        expiryDate: item.expiryDate || null,
      })),
      payment: payload.payment
        ? {
            amountMinor: payload.payment.amountMinor,
            paymentMethod: payload.payment.paymentMethod,
            reference: payload.payment.reference || null,
            notes: payload.payment.notes || null,
          }
        : null,
    };

    const { data, error } = await supabase.rpc('create_stock_receipt', {
      payload: rpcPayload as any,
    });

    if (error) {
      throw new AISafeError('AI_BOOKKEEPER_APPLICATION_FAILED', error.message || 'Failed to create stock receipt.', false);
    }

    const receiptRecord = data as any;
    return {
      canonicalTargetType: 'STOCK_RECEIPT',
      canonicalTargetId: receiptRecord.id,
      canonicalTargetReference: receiptRecord.receipt_number || receiptRecord.id,
      stockReceiptId: receiptRecord.id,
    };
  }
}

export class CustomerPaymentBookkeeperAdapter implements IBookkeeperOperationAdapter<CustomerPaymentApplyPayload> {
  async apply(
    supabase: SupabaseClient<Database>,
    businessId: string,
    userId: string,
    payload: CustomerPaymentApplyPayload,
    idempotencyKey: string
  ): Promise<AdapterResult> {
    // 1. Verify sale exists and belongs to this business
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .select('id, total_minor, payment_status, sale_number')
      .eq('id', payload.saleId)
      .eq('business_id', businessId)
      .maybeSingle();

    if (saleError || !sale) {
      throw new AISafeError('AI_BOOKKEEPER_TARGET_NOT_FOUND', 'Selected sale was not found.', false);
    }

    if (sale.payment_status === 'paid') {
      throw new AISafeError('AI_BOOKKEEPER_TARGET_ALREADY_SETTLED', 'This sale has already been fully paid.', false);
    }

    const rpcPayload = {
      businessId,
      saleId: payload.saleId,
      amountMinor: payload.amountMinor,
      paymentMethod: payload.paymentMethod,
      occurredAt: payload.occurredAt,
      externalReference: payload.reference || null,
      notes: payload.notes || null,
      idempotencyKey,
    };

    const { data, error } = await supabase.rpc('record_sale_payment', {
      payload: rpcPayload as any,
    });

    if (error) {
      throw new AISafeError('AI_BOOKKEEPER_APPLICATION_FAILED', error.message || 'Failed to record customer payment.', false);
    }

    const paymentRecord = data as any;
    return {
      canonicalTargetType: 'SALE_PAYMENT',
      canonicalTargetId: paymentRecord.id,
      canonicalTargetReference: paymentRecord.payment_number || paymentRecord.id,
      salePaymentId: paymentRecord.id,
      saleId: payload.saleId,
    };
  }
}

export class SupplierPaymentBookkeeperAdapter implements IBookkeeperOperationAdapter<SupplierPaymentApplyPayload> {
  async apply(
    supabase: SupabaseClient<Database>,
    businessId: string,
    userId: string,
    payload: SupplierPaymentApplyPayload,
    idempotencyKey: string
  ): Promise<AdapterResult> {
    if (payload.payableSourceType === 'EXPENSE') {
      const { data: expense, error: expError } = await supabase
        .from('expenses')
        .select('id, total_minor, payment_status, expense_number')
        .eq('id', payload.payableId)
        .eq('business_id', businessId)
        .maybeSingle();

      if (expError || !expense) {
        throw new AISafeError('AI_BOOKKEEPER_TARGET_NOT_FOUND', 'Selected expense payable was not found.', false);
      }

      if (expense.payment_status === 'paid') {
        throw new AISafeError('AI_BOOKKEEPER_TARGET_ALREADY_SETTLED', 'This expense payable has already been fully paid.', false);
      }

      const rpcPayload = {
        businessId,
        expenseId: payload.payableId,
        amountMinor: payload.amountMinor,
        paymentMethod: payload.paymentMethod,
        effectiveDate: payload.occurredAt,
        externalReference: payload.reference || null,
        idempotencyKey,
      };

      const { data, error } = await supabase.rpc('record_expense_payment', {
        payload: rpcPayload as any,
      });

      if (error) {
        throw new AISafeError('AI_BOOKKEEPER_APPLICATION_FAILED', error.message || 'Failed to record expense payment.', false);
      }

      const paymentRecord = data as any;
      return {
        canonicalTargetType: 'EXPENSE_PAYMENT',
        canonicalTargetId: paymentRecord.id,
        canonicalTargetReference: paymentRecord.id,
        expensePaymentId: paymentRecord.id,
        expenseId: payload.payableId,
      };
    } else {
      const { data: receipt, error: recError } = await supabase
        .from('stock_receipts')
        .select('id, total_minor, payment_status, receipt_number')
        .eq('id', payload.payableId)
        .eq('business_id', businessId)
        .maybeSingle();

      if (recError || !receipt) {
        throw new AISafeError('AI_BOOKKEEPER_TARGET_NOT_FOUND', 'Selected stock receipt payable was not found.', false);
      }

      if (receipt.payment_status === 'paid') {
        throw new AISafeError('AI_BOOKKEEPER_TARGET_ALREADY_SETTLED', 'This stock purchase payable has already been fully paid.', false);
      }

      const rpcPayload = {
        businessId,
        stockReceiptId: payload.payableId,
        amountMinor: payload.amountMinor,
        paymentMethod: payload.paymentMethod,
        paidAt: payload.occurredAt,
        reference: payload.reference || null,
        notes: payload.notes || null,
        idempotencyKey,
      };

      const { data, error } = await supabase.rpc('record_stock_receipt_payment', {
        payload: rpcPayload as any,
      });

      if (error) {
        throw new AISafeError('AI_BOOKKEEPER_APPLICATION_FAILED', error.message || 'Failed to record stock purchase payment.', false);
      }

      const paymentRecord = data as any;
      return {
        canonicalTargetType: 'STOCK_RECEIPT_PAYMENT',
        canonicalTargetId: paymentRecord.id,
        canonicalTargetReference: paymentRecord.id,
        stockReceiptPaymentId: paymentRecord.id,
        stockReceiptId: payload.payableId,
      };
    }
  }
}

export class SaleBookkeeperAdapter implements IBookkeeperOperationAdapter<SaleApplyPayload> {
  async apply(
    supabase: SupabaseClient<Database>,
    businessId: string,
    userId: string,
    payload: SaleApplyPayload,
    idempotencyKey: string
  ): Promise<AdapterResult> {
    // 1. If customer provided, verify
    if (payload.customerId) {
      const { data: customer, error: custError } = await supabase
        .from('customers')
        .select('id, status')
        .eq('id', payload.customerId)
        .eq('business_id', businessId)
        .maybeSingle();

      if (custError || !customer) {
        throw new AISafeError('AI_BOOKKEEPER_TARGET_NOT_FOUND', 'Selected customer was not found.', false);
      }
      if (customer.status === 'archived' || customer.status === 'inactive') {
        throw new AISafeError('AI_BOOKKEEPER_STALE_CLASSIFICATION', 'Selected customer is archived or inactive.', false);
      }
    }

    // 2. Verify all catalog items belong to this business
    const itemIds = payload.items.map((i) => i.catalogItemId);
    const { data: catalogItems, error: itemError } = await supabase
      .from('catalog_items')
      .select('id, status, track_inventory')
      .in('id', itemIds)
      .eq('business_id', businessId);

    if (itemError || !catalogItems || catalogItems.length !== itemIds.length) {
      throw new AISafeError('AI_BOOKKEEPER_TARGET_NOT_FOUND', 'One or more selected products were not found in this business.', false);
    }

    const rpcPayload = {
      businessId,
      customerId: payload.customerId || null,
      occurredAt: payload.occurredAt,
      orderReference: payload.orderReference || null,
      customerNotes: payload.customerNotes || null,
      staffNotes: payload.staffNotes || null,
      idempotencyKey,
      items: payload.items.map((item) => ({
        catalogItemId: item.catalogItemId,
        quantity: item.quantity,
        unitPriceMinor: item.unitPriceMinor,
        discountMinor: item.discountMinor || 0,
        notes: item.notes || null,
      })),
      payments: payload.payments.map((p) => ({
        amountMinor: p.amountMinor,
        paymentMethod: p.paymentMethod,
        externalReference: p.reference || null,
        notes: p.notes || null,
      })),
    };

    const { data, error } = await supabase.rpc('create_sale', {
      payload: rpcPayload as any,
    });

    if (error) {
      throw new AISafeError('AI_BOOKKEEPER_APPLICATION_FAILED', error.message || 'Failed to create sale.', false);
    }

    const saleRecord = data as any;
    return {
      canonicalTargetType: 'SALE',
      canonicalTargetId: saleRecord.id,
      canonicalTargetReference: saleRecord.sale_number || saleRecord.id,
      saleId: saleRecord.id,
    };
  }
}

export class RefundBookkeeperAdapter implements IBookkeeperOperationAdapter<RefundApplyPayload> {
  async apply(
    supabase: SupabaseClient<Database>,
    businessId: string,
    userId: string,
    payload: RefundApplyPayload,
    idempotencyKey: string
  ): Promise<AdapterResult> {
    // 1. Verify sale exists
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .select('id, sale_number')
      .eq('id', payload.saleId)
      .eq('business_id', businessId)
      .maybeSingle();

    if (saleError || !sale) {
      throw new AISafeError('AI_BOOKKEEPER_TARGET_NOT_FOUND', 'Selected sale for refund was not found.', false);
    }

    const rpcPayload = {
      businessId,
      saleId: payload.saleId,
      reason: payload.reason,
      occurredAt: payload.occurredAt,
      idempotencyKey,
      items: payload.items.map((i) => ({
        saleItemId: i.saleItemId,
        quantity: i.quantity,
        restock: i.restock,
      })),
      payments: payload.payments.map((p) => ({
        amountMinor: p.amountMinor,
        paymentMethod: p.paymentMethod,
        externalReference: p.reference || null,
        notes: p.notes || null,
      })),
    };

    const { data, error } = await supabase.rpc('create_sale_refund', {
      payload: rpcPayload as any,
    });

    if (error) {
      throw new AISafeError('AI_BOOKKEEPER_APPLICATION_FAILED', error.message || 'Failed to process refund.', false);
    }

    const refundRecord = data as any;
    return {
      canonicalTargetType: 'SALE_REFUND',
      canonicalTargetId: refundRecord.id,
      canonicalTargetReference: refundRecord.refund_number || refundRecord.id,
      saleRefundId: refundRecord.id,
      saleId: payload.saleId,
    };
  }
}

export const BOOKKEEPER_ADAPTERS: Record<BookkeepingFinalOperationKind, IBookkeeperOperationAdapter<any>> = {
  OPERATING_EXPENSE: new ExpenseBookkeeperAdapter(),
  STOCK_PURCHASE: new StockPurchaseBookkeeperAdapter(),
  CUSTOMER_PAYMENT: new CustomerPaymentBookkeeperAdapter(),
  SUPPLIER_PAYMENT: new SupplierPaymentBookkeeperAdapter(),
  SALE: new SaleBookkeeperAdapter(),
  REFUND: new RefundBookkeeperAdapter(),
};
