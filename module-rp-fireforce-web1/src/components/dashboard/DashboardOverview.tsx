import { motion } from "framer-motion";
import { 
  Flame, 
  CheckCircle2, 
  Timer, 
  Crown, 
  TrendingUp,
  Activity,
  Zap,
  Shield,
  UserCheck,
  Radar,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

export function DashboardOverview() {
  const stats = [
    {
      title: "Active Incidents",
      value: "3",
      change: "-2 from yesterday",
      icon: Flame,
      color: "text-red-600",
      bgColor: "bg-red-100",
      trending: "down"
    },
    {
      title: "Resolved Today",
      value: "12",
      change: "+4 from yesterday",
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-100",
      trending: "up"
    },
    {
      title: "Avg Response Time",
      value: "2.4m",
      change: "-30s from yesterday",
      icon: Timer,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      trending: "down"
    },
    {
      title: "On-Call Engineers",
      value: "8",
      change: "No change",
      icon: Crown,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      trending: "neutral"
    }
  ];

  const recentIncidents = [
    {
      id: "INC-001",
      title: "Database Connection Issues",
      status: "critical",
      assignee: "John Doe",
      time: "2 min ago",
      service: "User Service"
    },
    {
      id: "INC-002",
      title: "API Rate Limiting",
      status: "high",
      assignee: "Jane Smith",
      time: "15 min ago",
      service: "Payment API"
    },
    {
      id: "INC-003",
      title: "Slow Query Performance",
      status: "medium",
      assignee: "Mike Johnson",
      time: "1 hour ago",
      service: "Analytics DB"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical":
        return "bg-red-500 text-white";
      case "high":
        return "bg-orange-500 text-white";
      case "medium":
        return "bg-yellow-500 text-white";
      case "low":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-slate-700 dark:text-slate-200 mt-2 text-lg">Monitor and manage your incidents</p>
        </div>
        <div className="flex items-center gap-4">
          <Button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-lg">
            <Zap className="h-4 w-4 mr-2" />
            Create Incident
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          >
            <Card className="relative overflow-hidden border border-slate-200 dark:border-white/20 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12" />
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">{stat.title}</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{stat.value}</p>
                    <div className="flex items-center gap-1">
                      <TrendingUp className={`h-4 w-4 ${
                        stat.trending === "up" ? "text-green-600" : 
                        stat.trending === "down" ? "text-red-600 rotate-180" : 
                        "text-slate-500"
                      }`} />
                      <p className={`text-sm font-medium ${
                        stat.trending === "up" ? "text-green-600" : 
                        stat.trending === "down" ? "text-red-600" : 
                        "text-slate-500"
                      }`}>
                        {stat.change}
                      </p>
                    </div>
                  </div>
                  <div className={`p-4 rounded-2xl ${stat.bgColor} shadow-lg transform rotate-3 hover:rotate-6 transition-transform duration-300`}>
                    <stat.icon className={`h-7 w-7 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Recent Incidents */}
        <motion.div
          className="xl:col-span-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border border-slate-200 dark:border-white/20 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <Flame className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <span className="text-xl font-semibold text-slate-900 dark:text-white">Recent Incidents</span>
                  <p className="text-sm text-slate-700 dark:text-slate-200 font-normal">Latest critical events requiring attention</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentIncidents.map((incident, index) => (
                  <motion.div
                    key={incident.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
                    className="flex items-center justify-between p-5 border border-slate-200 dark:border-white/20 rounded-xl hover:bg-gradient-to-r hover:from-slate-50 hover:to-white dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(incident.status)}>
                          {incident.status.toUpperCase()}
                        </Badge>
                        <span className="font-medium text-slate-700 dark:text-white">{incident.id}</span>
                      </div>
                      <h3 className="font-semibold mt-1 text-slate-900 dark:text-white">{incident.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-200 mt-1">
                        <span>Assigned to {incident.assignee}</span>
                        <span>• {incident.service}</span>
                        <span>• {incident.time}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="text-slate-900 dark:text-white border-slate-200 dark:border-white/20">
                      View Details
                    </Button>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

          {/* Teams Today & Quick Actions */}
        <motion.div
          className="xl:col-span-1 space-y-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          {/* Teams Today */}
          <Card className="border border-slate-200 dark:border-white/20 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Crown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-lg font-semibold text-slate-900 dark:text-white">Teams Today</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {[
                  { name: "Platform Team", lead: "John Doe", incidents: 2, status: "active" },
                  { name: "API Services", lead: "Jane Smith", incidents: 1, status: "active" },
                  { name: "Frontend", lead: "Mike Johnson", incidents: 0, status: "standby" },
                  { name: "Data Team", lead: "Sarah Wilson", incidents: 0, status: "standby" }
                ].map((team) => (
                  <div key={team.name} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className={`w-3 h-3 rounded-full ${
                          team.status === "active" ? "bg-green-500" :
                          team.status === "standby" ? "bg-yellow-500" :
                          "bg-red-500"
                        }`} />
                        {team.status === "active" && (
                          <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75" />
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{team.name}</span>
                        <p className="text-xs text-slate-600 dark:text-slate-300">Lead: {team.lead}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-full">
                      {team.incidents} incidents
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>          {/* Quick Actions */}
          <Card className="border border-slate-200 dark:border-white/20 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-lg font-semibold text-slate-900 dark:text-white">Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <Button className="w-full justify-start h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg">
                  <Zap className="h-4 w-4 mr-3" />
                  Create Incident
                </Button>
                <Button className="w-full justify-start h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg">
                  <UserCheck className="h-4 w-4 mr-3" />
                  Update On-Call
                </Button>
                <Button className="w-full justify-start h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg">
                  <Activity className="h-4 w-4 mr-3" />
                  Health Check
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
