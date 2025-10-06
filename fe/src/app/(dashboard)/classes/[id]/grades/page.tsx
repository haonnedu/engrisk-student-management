"use client";
import { ClassGradesPage } from "@/components/classes/ClassGradesPage";
import { useParams } from "next/navigation";

// Generate static params for dynamic route
export async function generateStaticParams() {
  // Return empty array for now - will be populated at build time
  return [];
}

export default function ClassGradesRoute() {
  const params = useParams();
  const sectionId = params?.id as string;

  if (!sectionId) {
    return (
      <div className="flex h-64 items-center justify-center text-red-500">
        Class ID not found
      </div>
    );
  }

  return <ClassGradesPage sectionId={sectionId} />;
}
