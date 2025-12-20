"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/spinner";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user?.role === "STUDENT") {
        router.push("/parent/grades");
      } else if (user?.role === "TEACHER") {
        router.push("/teacher/dashboard");
      } else {
        router.push("/dashboard");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  );
}
