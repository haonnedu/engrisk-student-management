"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { GradeTypeDialog } from "./GradeTypeDialog";

interface GradeTypesToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  isActive: boolean | undefined;
  onIsActiveChange: (value: boolean | undefined) => void;
}

export function GradeTypesToolbar({
  search,
  onSearchChange,
  isActive,
  onIsActiveChange,
}: GradeTypesToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-xl font-semibold">Grade Types</h1>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 sm:flex-none">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search grade types..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 w-full sm:w-52"
          />
        </div>
        <Select
          value={isActive === undefined ? "all" : isActive.toString()}
          onValueChange={(value) => {
            if (value === "all") onIsActiveChange(undefined);
            else onIsActiveChange(value === "true");
          }}
        >
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <GradeTypeDialog />
      </div>
    </div>
  );
}
