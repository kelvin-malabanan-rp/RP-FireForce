import { motion } from "framer-motion";
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Activity, 
  Calendar,
  Clock,
  AlertTriangle,
  Brain,
  Database,
  Zap,
  Target,
  Users
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { BarChart } from "../charts/BarChart";
import { LineChart } from "../charts/LineChart";
import { PieChart as PieChartComponent } from "../charts/PieChart";
import { Histogram } from "../charts/Histogram";

export function AnalyticsPage() {
  // Sample data for charts - in a real app, this would come from your API
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

  const severityDistribution = [
    { severity: "Critical", count: 87, percentage: 15, color: "bg-red-500" },
    { severity: "High", count: 174, percentage: 30, color: "bg-orange-500" },
    { severity: "Medium", count: 203, percentage: 35, color: "bg-yellow-500" },
    { severity: "Low", count: 116, percentage: 20, color: "bg-green-500" }
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
          <p className="text-slate-600 dark:text-slate-200 mt-1">Historical data, trends, and AI insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-slate-900 dark:text-white border-slate-200 dark:border-white/20">
            <Calendar className="h-3 w-3 mr-1" />
            2025 Data
          </Badge>
        </div>
      </motion.div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Total Incidents (2025)", value: "580", change: "-8.2%", icon: AlertTriangle, color: "text-red-600" },
          { title: "Avg Resolution Time", value: "2.2h", change: "-12%", icon: Clock, color: "text-blue-600" },
          { title: "System Uptime", value: "99.8%", change: "+0.3%", icon: Activity, color: "text-green-600" },
          { title: "AI Accuracy", value: "94.7%", change: "+2.3%", icon: Brain, color: "text-purple-600" }
        ].map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border border-slate-200 dark:border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{metric.title}</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{metric.value}</p>
                    <p className={`text-sm mt-1 ${metric.change.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {metric.change} from 2024
                    </p>
                  </div>
                  <metric.icon className={`h-8 w-8 ${metric.color}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Incident Trends - Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border border-slate-200 dark:border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Monthly Incident Trends (2025)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart
                data={yearlyIncidents.map(month => ({
                  label: month.month,
                  value: month.incidents
                }))}
                height={250}
                color="stroke-blue-500"
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Severity Distribution - Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border border-slate-200 dark:border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                <PieChart className="h-5 w-5 text-orange-600" />
                Severity Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <PieChartComponent
                data={severityDistribution.map(item => ({
                  label: item.severity,
                  value: item.count,
                  color: item.color === 'bg-red-500' ? '#ef4444' :
                         item.color === 'bg-orange-500' ? '#f97316' :
                         item.color === 'bg-yellow-500' ? '#eab308' : '#22c55e'
                }))}
                size={250}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Additional Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resolution Success Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border border-slate-200 dark:border-white/20">
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
                height={220}
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
        >
          <Card className="border border-slate-200 dark:border-white/20">
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
                height={200}
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
    </div>
  );
}
