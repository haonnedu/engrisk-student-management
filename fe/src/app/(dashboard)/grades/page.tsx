"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GradesPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new grades classes page
    router.replace("/grades/classes");
  }, [router]);

  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-center">
        <div className="mb-4 text-6xl">🔄</div>
        <h3 className="mb-2 text-lg font-semibold">Redirecting...</h3>
        <p className="text-muted-foreground">
          Taking you to the new grades management page
        </p>
      </div>
    </div>
  );
}
