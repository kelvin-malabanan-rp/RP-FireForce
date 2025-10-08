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
      const response = await incidentService.getIncidentStats(timeframe);

      if (response.success && response.data) {
        console.log('✅ Stats loaded:', response.data);
        setStats(response.data);
      } else {
        throw new Error('Failed to load stats');
      }
    } catch (err: any) {
      console.error('❌ Error loading stats:', err);
      setError(err.message || 'Failed to load statistics');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Load AI Analytics data
  const loadAIAnalytics = async () => {
    try {
      setAiLoading(true);
      console.log('🤖 Loading AI Analytics data...');
      
      const [dashboard, confidence, predictions, services, timePatterns] = await Promise.all([
        aiAnalyticsService.getDashboard(),
        aiAnalyticsService.getConfidence(),
        aiAnalyticsService.getPredictions(),
        aiAnalyticsService.getServices(),
        aiAnalyticsService.getTimePatterns()
      ]);

      if (dashboard.success) setAiDashboard(dashboard.data);
      if (confidence.success) setAiConfidence(confidence.data);
      if (predictions.success) setAiPredictions(predictions.data);
      if (services.success) setAiServices(services.data);
      if (timePatterns.success) setAiTimePatterns(timePatterns.data);

      console.log('✅ AI Analytics loaded');
    } catch (err: any) {
      console.error('❌ Error loading AI analytics:', err);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadAIAnalytics();
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
  ].filter(item => item.value > 0) : []; // Only show non-zero values

  // Sample data for historical charts (keep for demo purposes)
  const yearlyIncidents = [
    { month: "Jan", incidents: 45, resolved: 42, mttr: 2.5 },
    { month: "Feb", incidents: 38, resolved: 36, mttr: 2.8 },
    { month: "Mar", incidents: 52, resolved: 49, mttr: 2.1 },
    { month: "Apr", incidents: 41, resolved: 40, mttr: 2.3 },
    { month: "May", incidents: 35, resolved: 34, mttr: 1.9 },
    { month: "Jun", incidents: 48, resolved: 46, mttr: 2.6 },
    { month: "Jul", incidents: 43, resolved: 41, mttr: 2.4 },
    { month: "Aug", incidents: 39, resolved: 38, mttr: 2.0 },
    { month: "Sep", incidents: 47, resolved: 45, mttr: 2.2 },
    { month: "Oct", incidents: 33, resolved: 32, mttr: 1.8 },
    { month: "Nov", incidents: 41, resolved: 40, mttr: 2.1 },
    { month: "Dec", incidents: 36, resolved: 35, mttr: 2.3 }
  ];

  const aiMetrics = [
    { metric: "Pattern Recognition Accuracy", value: "94.7%", trend: "+2.3%" },
    { metric: "Predictive Alerts Generated", value: "156", trend: "+18%" },
    { metric: "False Positive Rate", value: "3.2%", trend: "-1.1%" },
    { metric: "Learning Model Updates", value: "847", trend: "+5.4%" }
  ];

  const teamPerformance = [
    { team: "Platform", incidents: 125, avgTime: "1.8h", uptime: "99.9%" },
    { team: "Infrastructure", incidents: 98, avgTime: "2.1h", uptime: "99.7%" },
    { team: "Security", incidents: 67, avgTime: "3.2h", uptime: "99.8%" },
    { team: "Database", incidents: 89, avgTime: "2.5h", uptime: "99.6%" }
  ];

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
            onClick={() => loadStats(true)}
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

      {/* Sample Charts Section (Historical Data) */}

      {/* Additional Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resolution Success Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="h-full"
        >
          <Card className="border border-slate-200 dark:border-white/20 h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                <Activity className="h-5 w-5 text-green-600" />
                Incident Resolution Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart
                data={yearlyIncidents.map(month => ({
                  label: month.month,
                  value: Math.round((month.resolved / month.incidents) * 100)
                }))}
                height={280}
                color="stroke-green-500"
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Response Time Histogram */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="h-full"
        >
          <Card className="border border-slate-200 dark:border-white/20 h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                <Activity className="h-5 w-5 text-purple-600" />
                Response Time Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Histogram
                data={[
                  { range: '0-15m', count: 156, color: 'bg-gradient-to-t from-green-500 to-green-400' },
                  { range: '15-30m', count: 89, color: 'bg-gradient-to-t from-yellow-500 to-yellow-400' },
                  { range: '30-1h', count: 64, color: 'bg-gradient-to-t from-orange-500 to-orange-400' },
                  { range: '1-2h', count: 32, color: 'bg-gradient-to-t from-red-500 to-red-400' },
                  { range: '2h+', count: 18, color: 'bg-gradient-to-t from-purple-500 to-purple-400' }
                ]}
                title="Incidents by Response Time"
                height={280}
              />
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
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AI Metrics Cards */}
              <div className="grid grid-cols-2 gap-4">
                {aiMetrics.map((metric, index) => (
                  <motion.div
                    key={metric.metric}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                    className="text-center p-4 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border border-purple-200 dark:border-purple-800/30"
                  >
                    <div className="flex justify-center mb-2">
                      {index === 0 && <Target className="h-6 w-6 text-purple-600" />}
                      {index === 1 && <Zap className="h-6 w-6 text-blue-600" />}
                      {index === 2 && <AlertTriangle className="h-6 w-6 text-orange-600" />}
                      {index === 3 && <Database className="h-6 w-6 text-green-600" />}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">{metric.metric}</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">{metric.value}</p>
                    <p className="text-xs text-green-600 dark:text-green-400">{metric.trend}</p>
                  </motion.div>
                ))}
              </div>

              {/* AI Learning Progress Chart */}
              <div>
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
                  AI Learning Progress Over Time
                </h4>
                <LineChart
                  data={[
                    { label: 'Jan', value: 87.2 },
                    { label: 'Feb', value: 88.5 },
                    { label: 'Mar', value: 89.8 },
                    { label: 'Apr', value: 91.1 },
                    { label: 'May', value: 92.3 },
                    { label: 'Jun', value: 93.0 },
                    { label: 'Jul', value: 93.8 },
                    { label: 'Aug', value: 94.2 },
                    { label: 'Sep', value: 94.5 },
                    { label: 'Oct', value: 94.7 }
                  ]}
                  height={180}
                  color="stroke-purple-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Team Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="border border-slate-200 dark:border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Users className="h-5 w-5 text-green-600" />
              Team Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-300">Team</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-300">Incidents Handled</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-300">Avg Resolution Time</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-300">Uptime</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-300">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {teamPerformance.map((team, index) => (
                    <motion.tr
                      key={team.team}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-900 dark:text-white">{team.team}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-600 dark:text-slate-300">{team.incidents}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-600 dark:text-slate-300">{team.avgTime}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge 
                          variant="outline" 
                          className={`${
                            parseFloat(team.uptime) >= 99.8 
                              ? 'text-green-700 border-green-200 bg-green-50 dark:text-green-400 dark:border-green-800 dark:bg-green-950/20' 
                              : 'text-yellow-700 border-yellow-200 bg-yellow-50 dark:text-yellow-400 dark:border-yellow-800 dark:bg-yellow-950/20'
                          }`}
                        >
                          {team.uptime}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full"
                              style={{ width: `${parseFloat(team.uptime)}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {parseFloat(team.uptime) >= 99.8 ? 'Excellent' : 'Good'}
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Analytics Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-12"
      >
        <div className="flex items-center gap-3 mb-6">
          <Brain className="h-8 w-8 text-purple-600" />
          <div>
            <h2 className="text-2xl font-bold text-white">AI Intelligence Analytics</h2>
            <p className="text-sm text-slate-400">Real-time AI insights and predictive analytics</p>
          </div>
        </div>

        {/* AI Loading State */}
        {aiLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border border-slate-200 dark:border-white/20 animate-pulse">
                <CardContent className="p-6">
                  <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !aiDashboard ? (
          <Card className="border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-900/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                <AlertTriangle className="h-5 w-5" />
                <div>
                  <p className="font-semibold">AI Analytics Backend Offline</p>
                  <p className="text-sm mt-1">Make sure the AI server is running at http://localhost:8000</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Top Row - KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Knowledge Base Size */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <Card className="border border-purple-200 dark:border-purple-800/30 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-white">Knowledge Base</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">
                    {aiDashboard.ai_intelligence?.knowledge_base_size || 0}
                  </div>
                  <p className="text-xs text-white mt-1">Incidents Learned</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Success Rate */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.95 }}
            >
              <Card className="border border-green-200 dark:border-green-800/30 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-white">Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">
                    {aiDashboard.ai_intelligence?.success_rate?.toFixed(1) || 0}%
                  </div>
                  <p className="text-xs text-white mt-1">AI Analysis Success</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Current Confidence */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
            >
              <Card className="border border-blue-200 dark:border-blue-800/30 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-white">Confidence Level</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">
                    {aiConfidence?.current_confidence ? (aiConfidence.current_confidence * 100).toFixed(0) : 0}%
                  </div>
                  <p className="text-xs text-white mt-1">AI Confidence Score</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Risk Level */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.05 }}
            >
              <Card className={`border ${
                aiPredictions?.current_risk?.level === 'HIGH' 
                  ? 'border-red-200 dark:border-red-800/30 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20'
                  : aiPredictions?.current_risk?.level === 'MEDIUM'
                  ? 'border-yellow-200 dark:border-yellow-800/30 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20'
                  : 'border-green-200 dark:border-green-800/30 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20'
              }`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-white">Risk Level</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="text-3xl font-bold text-white">
                      {aiPredictions?.current_risk?.level || 'LOW'}
                    </div>
                    <Badge variant="outline" className="text-white border-white">
                      {aiPredictions?.current_risk?.score ? (aiPredictions.current_risk.score * 100).toFixed(0) : 0}%
                    </Badge>
                  </div>
                  <p className="text-xs text-white mt-1">Current Risk Score</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Second Row - Confidence Trend & Predictions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* AI Confidence Trend */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="h-full"
            >
              <Card className="border border-slate-200 dark:border-white/20 h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    AI Confidence Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {aiConfidence?.confidence_trend && (
                    <LineChart
                      data={aiConfidence.confidence_trend.map((item: any) => ({
                        label: `Week ${item.week}`,
                        value: item.confidence * 100
                      }))}
                      height={280}
                      color="stroke-blue-500"
                    />
                  )}
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800/30">
                    <p className="text-sm text-white">
                      <strong>Learning Velocity:</strong> {aiConfidence?.learning_velocity?.improvement_rate || 'N/A'}
                    </p>
                    <p className="text-sm text-white mt-1">
                      <strong>Recognition Rate:</strong> {aiConfidence?.knowledge_base_growth?.recognition_rate?.toFixed(1) || 0}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Predictions Alert */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.15 }}
              className="h-full"
            >
              <Card className="border border-orange-200 dark:border-orange-800/30 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    Predictive Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {aiPredictions?.predictions?.next_likely_incident && (
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-orange-300 dark:border-orange-700">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-white mb-1">
                            Next Likely Incident
                          </h4>
                          <p className="text-sm text-white">
                            {aiPredictions.predictions.next_likely_incident}
                          </p>
                          <div className="flex items-center gap-4 mt-3">
                            <Badge variant="outline" className="text-white border-white">
                              <Clock className="h-3 w-3 mr-1" />
                              In {aiPredictions.predictions.predicted_in_hours}h
                            </Badge>
                            <Badge variant="outline" className="text-white border-white">
                              Confidence: {(aiPredictions.predictions.confidence * 100).toFixed(0)}%
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {aiPredictions?.current_risk?.reasoning && (
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <p className="text-sm text-white">
                        <strong>Risk Reasoning:</strong> {aiPredictions.current_risk.reasoning}
                      </p>
                    </div>
                  )}

                  {/* Pattern Detection */}
                  {aiPredictions?.pattern_detection && aiPredictions.pattern_detection.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">Detected Patterns:</h4>
                      <div className="space-y-2">
                        {aiPredictions.pattern_detection.map((pattern: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-2 text-sm text-white">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{pattern}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Third Row - Service Health & Match Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Service Health Scores */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="h-full"
            >
              <Card className="border border-slate-200 dark:border-white/20 h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Shield className="h-5 w-5 text-green-600" />
                    Service Health Scores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {aiServices?.services?.map((service: any, idx: number) => (
                      <motion.div
                        key={service.service}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.3 + idx * 0.1 }}
                        className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-white">{service.service}</h4>
                            <Badge 
                              variant="outline" 
                              className={`text-white border-white ${
                                service.grade === 'A' || service.grade === 'B' 
                                  ? 'bg-green-100 dark:bg-green-950/30 border-green-300 dark:border-green-700'
                                  : service.grade === 'C'
                                  ? 'bg-yellow-100 dark:bg-yellow-950/30 border-yellow-300 dark:border-yellow-700'
                                  : 'bg-red-100 dark:bg-red-950/30 border-red-300 dark:border-red-700'
                              }`}
                            >
                              Grade {service.grade}
                            </Badge>
                          </div>
                          <Badge variant="outline" className="text-white border-white">
                            {service.incident_count} incidents
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-white">Health Score</span>
                              <span className="font-medium text-white">{service.health_score}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${
                                  service.health_score >= 85 ? 'bg-green-500' 
                                  : service.health_score >= 70 ? 'bg-yellow-500' 
                                  : 'bg-red-500'
                                }`}
                                style={{ width: `${service.health_score}%` }}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-white">AI Confidence</span>
                              <span className="font-medium text-white">{service.ai_confidence}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500"
                                style={{ width: `${service.ai_confidence}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Match Breakdown Pie Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.25 }}
              className="h-full"
            >
              <Card className="border border-slate-200 dark:border-white/20 h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Target className="h-5 w-5 text-purple-600" />
                    AI Match Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {aiConfidence?.match_breakdown && (
                    <>
                      <div className="flex justify-center mb-6">
                        <PieChartComponent
                          data={[
                            { label: "Exact Matches", value: aiConfidence.match_breakdown.exact_matches || 0, color: "#22c55e" },
                            { label: "High Similarity", value: aiConfidence.match_breakdown.high_similarity || 0, color: "#3b82f6" },
                            { label: "Moderate Similarity", value: aiConfidence.match_breakdown.moderate_similarity || 0, color: "#f59e0b" },
                            { label: "No Match", value: aiConfidence.match_breakdown.no_match || 0, color: "#ef4444" }
                          ].filter(item => item.value > 0)}
                          size={280}
                        />
                      </div>
                      
                      <div className="space-y-3">
                        {[
                          { label: "Exact Matches", value: aiConfidence.match_breakdown.exact_matches || 0, color: "bg-green-500", icon: CheckCircle2 },
                          { label: "High Similarity", value: aiConfidence.match_breakdown.high_similarity || 0, color: "bg-blue-500", icon: TrendingUp },
                          { label: "Moderate Similarity", value: aiConfidence.match_breakdown.moderate_similarity || 0, color: "bg-orange-500", icon: Activity },
                          { label: "No Match", value: aiConfidence.match_breakdown.no_match || 0, color: "bg-red-500", icon: XCircle }
                        ].map((item) => {
                          const Icon = item.icon;
                          const total = Object.values(aiConfidence.match_breakdown).reduce((sum: number, val: any) => sum + val, 0);
                          const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
                          
                          return (
                            <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                              <div className="flex items-center gap-3">
                                <Icon className="h-4 w-4 text-white" />
                                <span className="font-medium text-white">{item.label}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xl font-bold text-white">{item.value}</span>
                                <Badge variant="secondary" className="min-w-[50px] justify-center text-white">
                                  {percentage}%
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Fourth Row - Time Patterns */}
          {aiTimePatterns && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 }}
              className="mt-6"
            >
              <Card className="border border-slate-200 dark:border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Incident Time Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Hourly Pattern */}
                    {aiTimePatterns.hourly_pattern && (
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-4">Hourly Distribution</h4>
                        <BarChart
                          data={aiTimePatterns.hourly_pattern
                            .filter((item: any) => item.count > 0)
                            .map((item: any) => ({
                              label: item.label,
                              value: item.count,
                              color: 'bg-gradient-to-t from-blue-600 to-blue-400'
                            }))}
                          height={200}
                        />
                        {aiTimePatterns.peak_hours && (
                          <div className="mt-3 flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-white">Peak Hours:</span>
                            {aiTimePatterns.peak_hours.map((hour: number) => (
                              <Badge key={hour} variant="outline" className="text-white border-white">
                                {hour}:00
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Weekly Pattern */}
                    {aiTimePatterns.weekly_pattern && (
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-4">Weekly Distribution</h4>
                        <BarChart
                          data={aiTimePatterns.weekly_pattern.map((item: any) => ({
                            label: item.day.substring(0, 3),
                            value: item.count,
                            color: item.risk === 'high' 
                              ? 'bg-gradient-to-t from-red-600 to-red-400'
                              : item.risk === 'medium'
                              ? 'bg-gradient-to-t from-yellow-600 to-yellow-400'
                              : 'bg-gradient-to-t from-green-600 to-green-400'
                          }))}
                          height={200}
                        />
                        {aiTimePatterns.peak_days && (
                          <div className="mt-3 flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-white">Peak Days:</span>
                            {aiTimePatterns.peak_days.map((day: string) => (
                              <Badge key={day} variant="outline" className="text-white border-white">
                                {day}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Service Trends */}
          {aiPredictions?.service_trends && aiPredictions.service_trends.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.35 }}
              className="mt-6"
            >
              <Card className="border border-slate-200 dark:border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Service Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {aiPredictions.service_trends.map((trend: any, idx: number) => (
                      <motion.div
                        key={trend.service}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.4 + idx * 0.1 }}
                        className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-white">{trend.service}</h4>
                          {trend.trend === 'increasing' ? (
                            <TrendingUp className="h-5 w-5 text-red-500" />
                          ) : trend.trend === 'decreasing' ? (
                            <TrendingDown className="h-5 w-5 text-green-500" />
                          ) : (
                            <Activity className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                        <div className="text-2xl font-bold text-white mb-1">
                          {trend.incident_count}
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`text-white border-white ${
                            trend.trend === 'increasing' ? 'bg-red-100 dark:bg-red-950/30' :
                            trend.trend === 'decreasing' ? 'bg-green-100 dark:bg-green-950/30' :
                            'bg-blue-100 dark:bg-blue-950/30'
                          }`}
                        >
                          {trend.trend}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </>
        )}
      </motion.div>
    </div>
  );
}
