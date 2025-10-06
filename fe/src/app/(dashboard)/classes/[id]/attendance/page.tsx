"use client";
import { ClassAttendancePage } from "@/components/classes/ClassAttendancePage";
import { useParams } from "next/navigation";

export default function ClassAttendanceRoute() {
  const params = useParams();
  const sectionId = params?.id as string;

  if (!sectionId) {
    return (
      <div className="flex h-64 items-center justify-center text-red-500">
        Class ID not found
      </div>
    );
  }

  return <ClassAttendancePage sectionId={sectionId} />;
}
