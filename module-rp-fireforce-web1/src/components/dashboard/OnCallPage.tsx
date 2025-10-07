import { motion } from "framer-motion";
import { Shield, Clock, User, Phone, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export function OnCallPage() {
  const onCallSchedule = [
    {
      id: 1,
      name: "John Doe",
      role: "Senior SRE",
      team: "Platform",
      shift: "Primary",
      startTime: "2024-01-15 08:00",
      endTime: "2024-01-16 08:00",
      status: "active",
      phone: "+1 (555) 123-4567",
      email: "john.doe@fireforce.com"
    },
    {
      id: 2,
      name: "Jane Smith",
      role: "DevOps Engineer", 
      team: "Infrastructure",
      shift: "Secondary",
      startTime: "2024-01-15 08:00",
      endTime: "2024-01-16 08:00",
      status: "standby",
      phone: "+1 (555) 987-6543",
      email: "jane.smith@fireforce.com"
    },
    {
      id: 3,
      name: "Mike Johnson",
      role: "Backend Engineer",
      team: "API",
      shift: "Tertiary",
      startTime: "2024-01-15 08:00", 
      endTime: "2024-01-16 08:00",
      status: "standby",
      phone: "+1 (555) 456-7890",
      email: "mike.johnson@fireforce.com"
    }
  ];

  const upcomingSchedule = [
    {
      date: "Jan 16, 2024",
      primary: "Sarah Wilson",
      secondary: "David Brown",
      tertiary: "Lisa Chen"
    },
    {
      date: "Jan 17, 2024", 
      primary: "Alex Rodriguez",
      secondary: "Emily Davis",
      tertiary: "Tom Wilson"
    },
    {
      date: "Jan 18, 2024",
      primary: "John Doe",
      secondary: "Jane Smith", 
      tertiary: "Mike Johnson"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500 text-white";
      case "standby":
        return "bg-yellow-500 text-white";
      case "off":
        return "bg-gray-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getShiftColor = (shift: string) => {
    switch (shift) {
      case "Primary":
        return "border-green-500 text-green-700 bg-green-50";
      case "Secondary":
        return "border-yellow-500 text-yellow-700 bg-yellow-50";
      case "Tertiary":
        return "border-blue-500 text-blue-700 bg-blue-50";
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
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">On-Call Schedule</h1>
          <p className="text-slate-600 dark:text-slate-200 mt-1">Manage on-call rotations and escalations</p>
        </div>
        <Button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700">
          <Calendar className="h-4 w-4 mr-2" />
          Edit Schedule
        </Button>
      </motion.div>

      {/* Current On-Call */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Current On-Call Engineers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {onCallSchedule.map((engineer, index) => (
                <motion.div
                  key={engineer.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center justify-between p-4 border border-slate-200 dark:border-white/20 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={`/placeholder-avatar-${engineer.id}.jpg`} alt={engineer.name} />
                      <AvatarFallback className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
                        {engineer.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-slate-900 dark:text-white">{engineer.name}</h3>
                        <Badge className={getStatusColor(engineer.status)}>
                          {engineer.status.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className={getShiftColor(engineer.shift)}>
                          {engineer.shift}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{engineer.role} • {engineer.team} Team</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {engineer.startTime} - {engineer.endTime}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                    <Button variant="outline" size="sm">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Upcoming Schedule */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Upcoming Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingSchedule.map((day, index) => (
                <motion.div
                  key={day.date}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center justify-between p-3 border border-slate-200 dark:border-white/20 rounded-lg"
                >
                  <div className="font-medium text-slate-900 dark:text-white">{day.date}</div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getShiftColor("Primary")}>
                        Primary
                      </Badge>
                      <span className="text-slate-900 dark:text-white">{day.primary}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getShiftColor("Secondary")}>
                        Secondary
                      </Badge>
                      <span className="text-slate-900 dark:text-white">{day.secondary}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getShiftColor("Tertiary")}>
                        Tertiary
                      </Badge>
                      <span className="text-slate-900 dark:text-white">{day.tertiary}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <Card>
          <CardContent className="p-4">
            <Button className="w-full" variant="outline">
              Override Schedule
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Button className="w-full" variant="outline">
              Request Coverage
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Button className="w-full" variant="outline">
              Escalate Incident
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
