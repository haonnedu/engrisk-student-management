"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ParentHomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to grades page by default
    router.push("/parent/grades");
  }, [router]);

  return (
    <div className="flex h-64 items-center justify-center">
      <p className="text-muted-foreground">Redirecting...</p>
    </div>
  );
}

