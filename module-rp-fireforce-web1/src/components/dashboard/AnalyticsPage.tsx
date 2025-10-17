import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Activity, 
  AlertTriangle,
  Brain,
  Database,
  Zap,
  Target,
  Users,
  RefreshCw,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Shield,
  Clock,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { BarChart } from "../charts/BarChart";
import { LineChart } from "../charts/LineChart";
import { PieChart as PieChartComponent } from "../charts/PieChart";
import { Histogram } from "../charts/Histogram";
import { incidentService, aiAnalyticsService } from "../../services";
import { apiService } from "../../services/apiService";

// ✅ API Configuration
const AI_API_BASE_URL = 'https://web-production-34444.up.railway.app';

export function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState('24h');
  const [error, setError] = useState<string | null>(null);

  // AI Analytics state
  const [aiDashboard, setAiDashboard] = useState<any>(null);
  const [aiConfidence, setAiConfidence] = useState<any>(null);
  const [aiPredictions, setAiPredictions] = useState<any>(null);
  const [aiServices, setAiServices] = useState<any>(null);
  const [aiTimePatterns, setAiTimePatterns] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(true);
  
  // Analytics Overview from Railway API
  const [analyticsOverview, setAnalyticsOverview] = useState<any>(null);

  // All incidents data for monthly chart
  const [allIncidents, setAllIncidents] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  // Load all incidents for monthly chart
  const loadAllIncidents = async () => {
    try {
      console.log('📊 Loading all incidents for monthly chart...');
      const response = await incidentService.getAllIncidents();
      
      if (response.success && response.data) {
        setAllIncidents(response.data);
        processMonthlyData(response.data);
        console.log('✅ All incidents loaded:', response.data.length);
      }
    } catch (err: any) {
      console.error('❌ Error loading all incidents:', err);
    }
  };

  // Process incidents into monthly data
  const processMonthlyData = (incidents: any[]) => {
    const monthCounts: { [key: string]: number } = {};
    
    incidents.forEach(incident => {
      const date = new Date(incident.timestamp || incident.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
    });

    // Get last 12 months
    const now = new Date();
    const last12Months = [];
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      last12Months.push({
        month: monthName,
        incidents: monthCounts[monthKey] || 0,
        key: monthKey
      });
    }
    
    setMonthlyData(last12Months);
  };

  // Load stats from API
  const loadStats = async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      console.log(`📊 Loading stats for timeframe: ${timeframe}`);
      const response = await apiService.get(`/api/incidents/stats?timeframe=${timeframe}`);

      console.log('📦 Raw stats response:', response);

      // apiService returns: { data: { httpStatus, message, data: {...} }, success, status }
      // We need response.data.data to get the actual stats
      const apiResponse = response.data as any;
      if (apiResponse && apiResponse.data) {
        console.log('✅ Stats loaded:', apiResponse.data);
        setStats(apiResponse.data);
      } else {
        throw new Error('Failed to load stats - no data in response');
      }
    } catch (err: any) {
      console.error('❌ Error loading stats:', err);
      setError(err.message || 'Failed to load statistics');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // ✅ Load AI Analytics data from Railway API
  const loadAIAnalytics = async () => {
    try {
      setAiLoading(true);
      console.log('🤖 Loading AI Analytics from Railway...');
      
      // Load analytics overview from Railway API
      const response = await fetch(`${AI_API_BASE_URL}/api/analytics/overview`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Analytics Overview loaded from Railway:', data);
      setAnalyticsOverview(data);
      
    } catch (err: any) {
      console.error('❌ Error loading AI analytics from Railway:', err);
      // Show error but don't break the page
      console.warn('⚠️ AI Analytics unavailable, continuing without it');
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadAIAnalytics();
    loadAllIncidents();
  }, [timeframe]);

  // Calculate severity data for chart
  const severityData = stats ? [
    { severity: "Critical", count: stats.severities?.critical || 0, color: "bg-red-500" },
    { severity: "High", count: stats.severities?.high || 0, color: "bg-orange-500" },
    { severity: "Medium", count: stats.severities?.medium || 0, color: "bg-yellow-500" },
    { severity: "Low", count: stats.severities?.low || 0, color: "bg-green-500" }
  ] : [];

  // Calculate incident status data for pie chart
  const incidentStatusData = stats ? [
    { label: "Open", value: stats.open || 0, color: "#f97316" }, // Orange
    { label: "Investigating", value: stats.investigating || 0, color: "#3b82f6" }, // Blue
    { label: "Resolved", value: stats.resolved || 0, color: "#22c55e" } // Green
  ] : [];

  // Log the calculated data for debugging
  console.log('📊 Stats Object:', stats);
  console.log('📊 Severity Data:', severityData);
  console.log('📊 Status Data:', incidentStatusData);
  console.log('📊 Total Incidents:', stats?.total);
  console.log('📊 Open:', stats?.open, 'Investigating:', stats?.investigating, 'Resolved:', stats?.resolved);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Analytics Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-200 mt-1">Real-time incident statistics and trends</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[140px] text-slate-900 dark:text-white border-slate-200 dark:border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              loadStats(true);
              loadAIAnalytics();
            }}
            disabled={isRefreshing}
            className="text-slate-900 dark:text-white border-slate-200 dark:border-slate-700"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </motion.div>

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading && !stats ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="border border-slate-200 dark:border-white/20 animate-pulse">
              <CardContent className="p-6">
                <div className="h-80 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Main Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Incident Status Distribution - Pie Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="h-full"
            >
              <Card className="border border-slate-200 dark:border-white/20 hover:shadow-xl transition-shadow h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                      <Activity className="h-5 w-5 text-blue-600" />
                      Incident Status Distribution
                    </CardTitle>
                    <Badge variant="outline" className="text-slate-900 dark:text-white">
                      Total: {stats?.total || 0}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center">
                    {/* Pie Chart */}
                    <div className="mb-6">
                      <PieChartComponent
                        data={incidentStatusData}
                        size={280}
                      />
                    </div>

                    {/* Status Legend */}
                    <div className="w-full space-y-3">
                      {[
                        { label: "Open", value: stats?.open || 0, color: "bg-orange-500", textColor: "text-orange-600" },
                        { label: "Investigating", value: stats?.investigating || 0, color: "bg-blue-500", textColor: "text-blue-600" },
                        { label: "Resolved", value: stats?.resolved || 0, color: "bg-green-500", textColor: "text-green-600" }
                      ].map((item, index) => {
                        const percentage = stats?.total > 0 
                          ? Math.round((item.value / stats.total) * 100) 
                          : 0;
                        
                        return (
                          <motion.div
                            key={item.label}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + index * 0.1 }}
                            className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
                              <span className="font-medium text-slate-900 dark:text-white">
                                {item.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-2xl font-bold ${item.textColor} dark:text-white`}>
                                {item.value}
                              </span>
                              <Badge variant="secondary" className="min-w-[50px] justify-center text-white dark:text-white">
                                {percentage}%
                              </Badge>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Severity Distribution - Bar Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="h-full"
            >
              <Card className="border border-slate-200 dark:border-white/20 hover:shadow-xl transition-shadow h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                    <BarChart3 className="h-5 w-5 text-orange-600" />
                    Severity Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Bar Chart */}
                    <div className="mb-6">
                      <BarChart
                        data={severityData.map(item => {
                          // Map colors for bar chart
                          const barColorMap: Record<string, string> = {
                            "Critical": "bg-gradient-to-t from-red-600 to-red-400",
                            "High": "bg-gradient-to-t from-orange-600 to-orange-400",
                            "Medium": "bg-gradient-to-t from-yellow-600 to-yellow-400",
                            "Low": "bg-gradient-to-t from-green-600 to-green-400"
                          };
                          
                          return {
                            label: item.severity,
                            value: item.count,
                            color: barColorMap[item.severity]
                          };
                        })}
                        height={280}
                      />
                    </div>

                    {/* Severity Legend */}
                    <div className="w-full space-y-3">
                      {severityData.map((item, index) => {
                        const percentage = stats?.total > 0 
                          ? Math.round((item.count / stats.total) * 100) 
                          : 0;
                        
                        const colorMap: Record<string, string> = {
                          "Critical": "text-red-600",
                          "High": "text-orange-600",
                          "Medium": "text-yellow-600",
                          "Low": "text-green-600"
                        };

                        return (
                          <motion.div
                            key={item.severity}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + index * 0.1 }}
                            className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
                              <span className="font-medium text-slate-900 dark:text-white">
                                {item.severity}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-2xl font-bold ${colorMap[item.severity]} dark:text-white`}>
                                {item.count}
                              </span>
                              <Badge variant="secondary" className="min-w-[50px] justify-center text-white dark:text-white">
                                {percentage}%
                              </Badge>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      )}

      {/* Additional Charts Row */}
      <div className="grid grid-cols-1 gap-6">
        {/* Incidents Per Month */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="h-full"
        >
          <Card className="border border-slate-200 dark:border-white/20 h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Incidents Per Month (Last 12 Months)
                </CardTitle>
                <Badge variant="outline" className="text-slate-900 dark:text-white">
                  Total: {monthlyData.reduce((sum, m) => sum + m.incidents, 0)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {monthlyData.length > 0 ? (
                <LineChart
                  data={monthlyData.map(month => ({
                    label: month.month,
                    value: month.incidents
                  }))}
                  height={280}
                  color="stroke-blue-500"
                />
              ) : (
                <div className="flex items-center justify-center h-[280px] text-slate-500 dark:text-slate-400">
                  Loading monthly data...
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* AI Analytics Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="border border-slate-200 dark:border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Brain className="h-5 w-5 text-purple-600" />
              AI & RAG System Analytics
              {aiLoading && (
                <RefreshCw className="h-4 w-4 animate-spin text-purple-500" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsOverview ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* AI Metrics Cards */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Total Analyses */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9 }}
                    className="text-center p-4 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border border-purple-200 dark:border-purple-800/30"
                  >
                    <div className="flex justify-center mb-2">
                      <Target className="h-6 w-6 text-purple-600" />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">Total Analyses</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">
                      {analyticsOverview.total_analyses}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Success: {analyticsOverview.successful_analyses}
                    </p>
                  </motion.div>

                  {/* Success Rate */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.95 }}
                    className="text-center p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800/30"
                  >
                    <div className="flex justify-center mb-2">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">Success Rate</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">
                      {analyticsOverview.success_rate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Failed: {analyticsOverview.failed_analyses}
                    </p>
                  </motion.div>

                  {/* Knowledge Base Size */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.0 }}
                    className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border border-blue-200 dark:border-blue-800/30"
                  >
                    <div className="flex justify-center mb-2">
                      <Database className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">Knowledge Base</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">
                      {analyticsOverview.knowledge_base_size}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Incidents Learned
                    </p>
                  </motion.div>

                  {/* RAG Match Rate */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.05 }}
                    className="text-center p-4 rounded-lg bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border border-orange-200 dark:border-orange-800/30"
                  >
                    <div className="flex justify-center mb-2">
                      <Zap className="h-6 w-6 text-orange-600" />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">RAG Match Rate</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">
                      {analyticsOverview.rag_match_rate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Vector Similarity
                    </p>
                  </motion.div>
                </div>

                {/* Performance Metrics */}
                <div>
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
                    Performance Metrics
                  </h4>
                  <div className="space-y-4">
                    {/* Average Response Time */}
                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            Avg Response Time
                          </span>
                        </div>
                        <Badge variant="outline" className="text-slate-900 dark:text-white">
                          {analyticsOverview.average_response_time.toFixed(2)}s
                        </Badge>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                          style={{ width: `${Math.min((analyticsOverview.average_response_time / 5) * 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Average Quality Score */}
                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            Avg Quality Score
                          </span>
                        </div>
                        <Badge variant="outline" className="text-slate-900 dark:text-white">
                          {analyticsOverview.average_quality_score.toFixed(2)}
                        </Badge>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                          style={{ width: `${analyticsOverview.average_quality_score * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Last Updated */}
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800/30">
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        <strong>Last Updated:</strong> {new Date(analyticsOverview.last_updated).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : aiLoading ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-purple-500" />
                Loading AI analytics from Railway...
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
                <p className="text-slate-600 dark:text-slate-400 mb-2">
                  AI Analytics unavailable
                </p>
                <Button 
                  onClick={loadAIAnalytics}
                  variant="outline"
                  size="sm"
                  className="text-slate-900 dark:text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}