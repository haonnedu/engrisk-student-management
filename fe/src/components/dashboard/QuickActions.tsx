import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useNavigation } from "@/hooks/useNavigation";
import {
  Users,
  BookOpen,
  BarChart3,
  Calendar,
  FileText,
  Plus,
  Settings,
  Download,
} from "lucide-react";

const quickActions = [
  {
    title: "View Courses",
    description: "Browse and manage course catalog",
    href: "/dashboard/courses",
    icon: BookOpen,
    variant: "outline" as const,
  },
  {
    title: "Grade Management",
    description: "Enter and manage student grades",
    href: "/dashboard/grades/classes",
    icon: BarChart3,
    variant: "outline" as const,
  },
  {
    title: "Take Attendance",
    description: "Mark student attendance",
    href: "/dashboard/attendance",
    icon: Calendar,
    variant: "outline" as const,
  },
  {
    title: "Manage Enrollments",
    description: "Handle course enrollments",
    href: "/dashboard/enrollments",
    icon: FileText,
    variant: "outline" as const,
  },
  {
    title: "Add New Student",
    description: "Quickly add a new student",
    href: "/dashboard/students",
    icon: Plus,
    variant: "outline" as const,
  },
  {
    title: "View Teachers",
    description: "Manage teacher information",
    href: "/dashboard/teachers",
    icon: Users,
    variant: "outline" as const,
  },
];

export function QuickActions() {
  const { isNavigating, navigate } = useNavigation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.title}
                variant={action.variant}
                className="w-full justify-start h-auto p-4"
                onClick={() => navigate(action.href)}
                disabled={isNavigating}
              >
                <div className="flex items-center space-x-3">
                  {isNavigating ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {action.description}
                    </div>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
