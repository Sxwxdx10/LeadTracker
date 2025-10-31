import { useState, useEffect } from 'react';
import apiClient from '@/lib/api';
import { AnalyticsResponse, AnalyticsQueryParams } from '@/types/analytics';
import { AxiosResponse } from 'axios';

export const useAnalytics = (query: AnalyticsQueryParams = { period: '30d' }) => {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (query.period) params.append('period', query.period);
        if (query.startDate) params.append('startDate', query.startDate);
        if (query.endDate) params.append('endDate', query.endDate);
        if (query.userId && query.userId !== 'all') {
          params.append('userId', query.userId);
        }

        const response: AxiosResponse<AnalyticsResponse> = await apiClient.get(
          `/api/analytics?${params.toString()}`
        );

        setData(response.data);
      } catch (err: any) {
        console.error('Error fetching analytics:', err);
        setError(err.response?.data?.message || 'Failed to fetch analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [query.period, query.startDate, query.endDate, query.userId]);

  return { data, loading, error, refetch: () => {
    const params = new URLSearchParams();
    if (query.period) params.append('period', query.period);
    if (query.startDate) params.append('startDate', query.startDate);
    if (query.endDate) params.append('endDate', query.endDate);
    if (query.userId && query.userId !== 'all') {
      params.append('userId', query.userId);
    }

    return apiClient.get(`/api/analytics?${params.toString()}`).then((response: AxiosResponse<AnalyticsResponse>) => {
      setData(response.data);
      return response.data;
    });
  }};
};

