import { motion } from "framer-motion";
import { Flame, Plus, Filter, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export function IncidentsPage() {
  const incidents = [
    {
      id: "INC-001",
      title: "Database Connection Issues",
      status: "critical",
      priority: "P1",
      assignee: "John Doe",
      created: "2024-01-15 10:30",
      service: "User Service",
      description: "Multiple database connection timeouts affecting user authentication"
    },
    {
      id: "INC-002",
      title: "API Rate Limiting",
      status: "high",
      priority: "P2",
      assignee: "Jane Smith",
      created: "2024-01-15 09:45",
      service: "Payment API",
      description: "High volume of requests causing rate limit exceeded errors"
    },
    {
      id: "INC-003",
      title: "Slow Query Performance",
      status: "medium",
      priority: "P3",
      assignee: "Mike Johnson",
      created: "2024-01-15 08:15",
      service: "Analytics DB",
      description: "Dashboard loading times increased significantly"
    },
    {
      id: "INC-004",
      title: "CDN Cache Issues",
      status: "resolved",
      priority: "P2",
      assignee: "Sarah Wilson",
      created: "2024-01-14 16:20",
      service: "CDN",
      description: "Static assets not being cached properly"
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
      case "resolved":
        return "bg-gray-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "P1":
        return "border-red-500 text-red-700 bg-red-50";
      case "P2":
        return "border-orange-500 text-orange-700 bg-orange-50";
      case "P3":
        return "border-yellow-500 text-yellow-700 bg-yellow-50";
      case "P4":
        return "border-green-500 text-green-700 bg-green-50";
      default:
        return "border-gray-500 text-gray-700 bg-gray-50";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Incidents</h1>
          <p className="text-slate-600 dark:text-slate-200 mt-1">Manage and track incident resolution</p>
        </div>
        <Button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Incident
        </Button>
      </motion.div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="search"
              placeholder="Search incidents..."
              className="pl-10"
            />
          </div>
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </motion.div>

      {/* Incidents List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border border-slate-200 dark:border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Flame className="h-5 w-5 text-red-600" />
              All Incidents ({incidents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {incidents.map((incident, index) => (
                <motion.div
                  key={incident.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="border border-slate-200 dark:border-white/20 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={getStatusColor(incident.status)}>
                          {incident.status.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className={getPriorityColor(incident.priority)}>
                          {incident.priority}
                        </Badge>
                        <span className="font-mono text-sm text-slate-600 dark:text-white">{incident.id}</span>
                      </div>
                      
                      <h3 className="font-semibold text-lg mb-1 text-slate-900 dark:text-white">{incident.title}</h3>
                      <p className="text-slate-600 dark:text-slate-200 text-sm mb-2">{incident.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-300">
                        <span>Assigned to <strong className="text-slate-700 dark:text-white">{incident.assignee}</strong></span>
                        <span>• {incident.service}</span>
                        <span>• Created {incident.created}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
