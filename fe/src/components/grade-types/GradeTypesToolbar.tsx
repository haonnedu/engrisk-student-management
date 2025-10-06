"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Filter } from "lucide-react";
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
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search grade types..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 w-[300px]"
          />
        </div>
        <Select
          value={isActive === undefined ? "all" : isActive.toString()}
          onValueChange={(value) => {
            if (value === "all") {
              onIsActiveChange(undefined);
            } else {
              onIsActiveChange(value === "true");
            }
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <GradeTypeDialog />
    </div>
  );
}
