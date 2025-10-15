// services/analytics-service.ts
import { apiService } from './apiService';

// ==================== TYPE DEFINITIONS ====================

interface AnalyticsOverview {
  total_analyses: number;
  successful_analyses: number;
  failed_analyses: number;
  success_rate: number;
  average_response_time: number;
  average_quality_score: number;
  knowledge_base_size: number;
  rag_match_rate: number;
  last_updated: string;
}

interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  status: number;
}

// ==================== AI ANALYTICS ENDPOINTS ====================

/**
 * Get AI Analytics Overview
 * Endpoint: GET /api/analytics/overview
 */
export const getAnalyticsOverview = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/analytics/overview', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      data: data,
      status: 200
    };
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    return {
      success: false,
      data: null,
      status: 500,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// ==================== ANALYTICS SERVICE OBJECT ====================

/**
 * Unified analytics service object
 * This is what you import in your components
 */
export const analyticsService = {
  // AI Analytics
  getAnalyticsOverview,
  
  // TODO: Add more analytics endpoints here as we create them
  // getConfidenceTrends,
  // getPredictions,
  // getServiceHealth,
  // etc.
};

// Default export
export default analyticsService;