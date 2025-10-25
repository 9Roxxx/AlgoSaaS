// Shared types across the monorepo

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CampaignMetrics {
  total: number;
  queued: number;
  sent: number;
  delivered: number;
  read: number;
  clicked: number;
  undelivered: number;
  complaints: number;
  suppressed: number;
  deliveryRate: number;
  readRate: number;
  clickRate: number;
  complaintRate: number;
}

export interface ChannelMetrics {
  channel: string;
  sent: number;
  delivered: number;
  failed: number;
  deliveryRate: number;
}

export type DedupeKey = string; // format: tenantId:campaignId:contactId:channel

