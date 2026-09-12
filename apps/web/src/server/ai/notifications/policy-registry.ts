import {
  NotificationCategory,
  NotificationType,
  NotificationActionKey,
  BusinessAttentionType,
} from '@nnoo/contracts/ai';
import { FeatureModule } from '@/lib/auth/rbac-client';

export interface NotificationPolicy {
  notificationType: NotificationType;
  category: NotificationCategory;
  sourceAttentionTypes?: BusinessAttentionType[];
  requiredCapabilities: FeatureModule[];
  defaultEnabled: boolean;
  primaryActionKey: NotificationActionKey;
  formatTitle: (data: Record<string, unknown>) => string;
  formatBody: (data: Record<string, unknown>) => string;
}

export const NOTIFICATION_POLICY_VERSION = 'notification-policy-v1';

export const NOTIFICATION_POLICY_REGISTRY: Record<NotificationType, NotificationPolicy> = {
  LOW_STOCK: {
    notificationType: 'LOW_STOCK',
    category: 'INVENTORY',
    sourceAttentionTypes: ['LOW_STOCK_PRESENT'],
    requiredCapabilities: ['inventory'],
    defaultEnabled: true,
    primaryActionKey: 'OPEN_INVENTORY',
    formatTitle: () => 'Low Stock',
    formatBody: (data) => {
      const count = typeof data.count === 'number' ? data.count : 1;
      const productName = typeof data.productName === 'string' ? data.productName : null;
      if (count > 1) {
        return `${count} products are running low on stock.`;
      }
      if (productName) {
        return `${productName} is running low on stock.`;
      }
      return 'One or more products are running low on stock.';
    },
  },
  OUT_OF_STOCK: {
    notificationType: 'OUT_OF_STOCK',
    category: 'INVENTORY',
    sourceAttentionTypes: ['OUT_OF_STOCK_PRESENT'],
    requiredCapabilities: ['inventory'],
    defaultEnabled: true,
    primaryActionKey: 'OPEN_INVENTORY',
    formatTitle: () => 'Out of Stock',
    formatBody: (data) => {
      const count = typeof data.count === 'number' ? data.count : 1;
      const productName = typeof data.productName === 'string' ? data.productName : null;
      if (count > 1) {
        return `${count} products are completely out of stock.`;
      }
      if (productName) {
        return `${productName} is completely out of stock.`;
      }
      return 'One or more products are completely out of stock.';
    },
  },
  OVERDUE_INVOICE: {
    notificationType: 'OVERDUE_INVOICE',
    category: 'INVOICES',
    sourceAttentionTypes: ['OVERDUE_INVOICES_PRESENT'],
    requiredCapabilities: ['invoices'],
    defaultEnabled: true,
    primaryActionKey: 'OPEN_INVOICES',
    formatTitle: () => 'Invoice Needs Attention',
    formatBody: (data) => {
      const count = typeof data.count === 'number' ? data.count : 1;
      const invoiceNumber = typeof data.invoiceNumber === 'string' ? data.invoiceNumber : null;
      if (count > 1) {
        return `${count} invoices are past their payment due dates.`;
      }
      if (invoiceNumber) {
        return `Invoice ${invoiceNumber} is past its payment due date.`;
      }
      return 'One or more customer invoices are overdue for payment.';
    },
  },
  BOOKKEEPER_REVIEW_PENDING: {
    notificationType: 'BOOKKEEPER_REVIEW_PENDING',
    category: 'BOOKKEEPER',
    sourceAttentionTypes: ['BOOKKEEPER_REVIEW_PENDING'],
    requiredCapabilities: ['bookkeeper'],
    defaultEnabled: true,
    primaryActionKey: 'OPEN_AI_BOOKKEEPER',
    formatTitle: () => 'Bookkeeper Review Pending',
    formatBody: (data) => {
      const count = typeof data.count === 'number' ? data.count : 1;
      if (count > 1) {
        return `${count} transaction classifications are waiting for review and confirmation.`;
      }
      return 'A transaction classification is waiting for your review and confirmation.';
    },
  },
  BUSINESS_HEALTH_CHANGED: {
    notificationType: 'BUSINESS_HEALTH_CHANGED',
    category: 'BUSINESS_HEALTH',
    sourceAttentionTypes: ['HEALTH_SCORE_CHANGED'],
    requiredCapabilities: ['health_score'],
    defaultEnabled: true,
    primaryActionKey: 'OPEN_BUSINESS_HEALTH',
    formatTitle: () => 'Business Health Status Changed',
    formatBody: () => 'Your Business Health status has changed. Review latest metrics and operational recommendations.',
  },
  CREDIT_PASSPORT_STALE: {
    notificationType: 'CREDIT_PASSPORT_STALE',
    category: 'CREDIT_PASSPORT',
    sourceAttentionTypes: ['CREDIT_PASSPORT_STALE'],
    requiredCapabilities: ['credit_passport'],
    defaultEnabled: true,
    primaryActionKey: 'OPEN_CREDIT_PASSPORT',
    formatTitle: () => 'Credit Passport Needs Review',
    formatBody: () => 'Your business records have changed since your latest Credit Passport snapshot was generated.',
  },
  BUSINESS_SUMMARY_READY: {
    notificationType: 'BUSINESS_SUMMARY_READY',
    category: 'BUSINESS_SUMMARIES',
    requiredCapabilities: ['insights'],
    defaultEnabled: true,
    primaryActionKey: 'OPEN_BUSINESS_INSIGHTS',
    formatTitle: () => 'Business Summary Ready',
    formatBody: () => 'Your scheduled business performance summary is ready for review.',
  },
  AUTOMATION_FAILED: {
    notificationType: 'AUTOMATION_FAILED',
    category: 'AUTOMATIONS',
    sourceAttentionTypes: ['AUTOMATION_JOB_FAILED'],
    requiredCapabilities: ['automations'],
    defaultEnabled: true,
    primaryActionKey: 'OPEN_AUTOMATION_HISTORY',
    formatTitle: () => 'Automation Needs Attention',
    formatBody: (data) => {
      const jobName = typeof data.jobName === 'string' ? data.jobName : 'A scheduled automation';
      return `${jobName} encountered an issue during execution and requires attention.`;
    },
  },
};

export const ACTION_ROUTE_MAP: Record<NotificationActionKey, (slug: string) => string> = {
  OPEN_INVENTORY: (slug) => `/app/${slug}/inventory`,
  OPEN_INVOICES: (slug) => `/app/${slug}/invoices`,
  OPEN_AI_BOOKKEEPER: (slug) => `/app/${slug}/bookkeeper`,
  OPEN_BUSINESS_HEALTH: (slug) => `/app/${slug}/health`,
  OPEN_CREDIT_PASSPORT: (slug) => `/app/${slug}/credit-passport`,
  OPEN_BUSINESS_INSIGHTS: (slug) => `/app/${slug}/insights`,
  OPEN_AUTOMATIONS: (slug) => `/app/${slug}/automations`,
  OPEN_AUTOMATION_HISTORY: (slug) => `/app/${slug}/automations`,
};

export const CATEGORY_FEATURE_MAP: Record<NotificationCategory, FeatureModule> = {
  INVENTORY: 'inventory',
  INVOICES: 'invoices',
  BOOKKEEPER: 'bookkeeper',
  BUSINESS_HEALTH: 'health_score',
  CREDIT_PASSPORT: 'credit_passport',
  BUSINESS_SUMMARIES: 'insights',
  AUTOMATIONS: 'automations',
};
