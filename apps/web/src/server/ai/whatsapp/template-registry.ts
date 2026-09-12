import 'server-only';
import type { NotificationType, BusinessNotification } from '@nnoo/contracts';
import type { SendWhatsAppTemplateParams } from './adapter';

export interface WhatsAppTemplateConfig {
  templateName: string;
  languageCode: string;
  buildComponents: (notification: BusinessNotification) => SendWhatsAppTemplateParams['components'];
  renderFallbackText: (notification: BusinessNotification) => string;
}

export const WHATSAPP_TEMPLATE_REGISTRY: Record<NotificationType, WhatsAppTemplateConfig> = {
  LOW_STOCK: {
    templateName: 'nnoo_alert_inventory_low_stock',
    languageCode: 'en',
    buildComponents: (notification) => [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: notification.title },
          { type: 'text', text: notification.body },
        ],
      },
    ],
    renderFallbackText: (notification) =>
      `📦 *NNOO Inventory Alert*\n\n${notification.title}\n${notification.body}\n\n_Log in to NNOO to review stock levels._`,
  },
  OUT_OF_STOCK: {
    templateName: 'nnoo_alert_inventory_out_of_stock',
    languageCode: 'en',
    buildComponents: (notification) => [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: notification.title },
          { type: 'text', text: notification.body },
        ],
      },
    ],
    renderFallbackText: (notification) =>
      `🚨 *NNOO Out of Stock Alert*\n\n${notification.title}\n${notification.body}\n\n_Log in to NNOO to reorder stock._`,
  },
  OVERDUE_INVOICE: {
    templateName: 'nnoo_alert_invoice_overdue',
    languageCode: 'en',
    buildComponents: (notification) => [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: notification.title },
          { type: 'text', text: notification.body },
        ],
      },
    ],
    renderFallbackText: (notification) =>
      `📄 *NNOO Invoice Alert*\n\n${notification.title}\n${notification.body}\n\n_Log in to NNOO to view invoice details._`,
  },
  BOOKKEEPER_REVIEW_PENDING: {
    templateName: 'nnoo_alert_bookkeeper_review',
    languageCode: 'en',
    buildComponents: (notification) => [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: notification.title },
          { type: 'text', text: notification.body },
        ],
      },
    ],
    renderFallbackText: (notification) =>
      `🧾 *NNOO AI Bookkeeper Alert*\n\n${notification.title}\n${notification.body}\n\n_Log in to NNOO to confirm classifications._`,
  },
  BUSINESS_HEALTH_CHANGED: {
    templateName: 'nnoo_alert_business_health',
    languageCode: 'en',
    buildComponents: (notification) => [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: notification.title },
          { type: 'text', text: notification.body },
        ],
      },
    ],
    renderFallbackText: (notification) =>
      `📊 *NNOO Business Health Alert*\n\n${notification.title}\n${notification.body}\n\n_Log in to NNOO to review your score & recommendations._`,
  },
  CREDIT_PASSPORT_STALE: {
    templateName: 'nnoo_alert_credit_passport',
    languageCode: 'en',
    buildComponents: (notification) => [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: notification.title },
          { type: 'text', text: notification.body },
        ],
      },
    ],
    renderFallbackText: (notification) =>
      `🛡️ *NNOO Credit Passport Alert*\n\n${notification.title}\n${notification.body}\n\n_Log in to NNOO to refresh your verified credit profile._`,
  },
  BUSINESS_SUMMARY_READY: {
    templateName: 'nnoo_alert_summary_ready',
    languageCode: 'en',
    buildComponents: (notification) => [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: notification.title },
          { type: 'text', text: notification.body },
        ],
      },
    ],
    renderFallbackText: (notification) =>
      `✨ *NNOO Business Summary Ready*\n\n${notification.title}\n${notification.body}\n\n_Log in to NNOO to read full business insights._`,
  },
  AUTOMATION_FAILED: {
    templateName: 'nnoo_alert_automation_failed',
    languageCode: 'en',
    buildComponents: (notification) => [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: notification.title },
          { type: 'text', text: notification.body },
        ],
      },
    ],
    renderFallbackText: (notification) =>
      `⚠️ *NNOO Automation Issue*\n\n${notification.title}\n${notification.body}\n\n_Log in to NNOO to inspect job logs._`,
  },
};
