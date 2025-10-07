import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Activity {
  id: number;
  action: string;
  student?: string;
  class?: string;
  course?: string;
  teacher?: string;
  time: string;
  type: "enrollment" | "grade" | "class" | "attendance";
}

interface RecentActivitiesProps {
  activities: Activity[];
}

export function RecentActivities({ activities }: RecentActivitiesProps) {
  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "enrollment":
        return "🎓";
      case "grade":
        return "📊";
      case "class":
        return "🏫";
      case "attendance":
        return "✅";
      default:
        return "📝";
    }
  };

  const getActivityColor = (type: Activity["type"]) => {
    switch (type) {
      case "enrollment":
        return "bg-blue-100 text-blue-800";
      case "grade":
        return "bg-green-100 text-green-800";
      case "class":
        return "bg-purple-100 text-purple-800";
      case "attendance":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
        <CardDescription>Latest updates in the system</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">
                  {getActivityIcon(activity.type)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.action}
                  </p>
                  <Badge
                    variant="secondary"
                    className={`text-xs ${getActivityColor(activity.type)}`}
                  >
                    {activity.type}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 truncate">
                  {activity.student || activity.class} •{" "}
                  {activity.course || activity.teacher}
                </p>
                <p className="text-xs text-gray-400">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
