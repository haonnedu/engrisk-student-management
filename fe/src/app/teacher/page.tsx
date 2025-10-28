"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TeacherHomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard page by default
    router.push("/teacher/dashboard");
  }, [router]);

  return (
    <div className="flex h-64 items-center justify-center">
      <p className="text-muted-foreground">Redirecting...</p>
    </div>
  );
}

