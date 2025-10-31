export interface AnalyticsQueryParams {
  period?: '7d' | '30d' | '90d' | '1y' | 'custom';
  startDate?: string;
  endDate?: string;
  userId?: string;
}

export interface ConversionFunnelData {
  stage: string;
  stageId: string;
  value: number;
  percentage: number;
  color: string;
  order: number;
}

export interface SourceAnalysisData {
  source: string;
  leads: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
  color: string;
}

export interface UserPerformanceData {
  userId: string;
  userName: string;
  leads: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
  avgDealSize: number;
  avgSalesCycle: number;
}

export interface TemporalTrendData {
  period: string;
  leads: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
  avgDealSize: number;
}

export interface GlobalMetrics {
  totalLeads: number;
  totalConversions: number;
  totalRevenue: number;
  avgConversionRate: number;
}

export interface AnalyticsResponse {
  globalMetrics: GlobalMetrics;
  conversionFunnel: ConversionFunnelData[];
  sourceAnalysis: SourceAnalysisData[];
  userPerformance: UserPerformanceData[];
  temporalTrends: TemporalTrendData[];
}

