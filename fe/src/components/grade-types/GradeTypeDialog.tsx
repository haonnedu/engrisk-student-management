"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Edit } from "lucide-react";
import { useCreateGradeType, useUpdateGradeType } from "@/hooks/useGradeTypes";
import type { GradeType, CreateGradeTypeDto } from "@/lib/api-types";

const gradeTypeFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z
    .string()
    .min(1, "Code is required")
    .max(10, "Code must not exceed 10 characters"),
  description: z.string().optional(),
  weight: z
    .number()
    .min(0.1, "Weight must be at least 0.1")
    .max(10, "Weight must not exceed 10"),
  isActive: z.boolean(),
  sortOrder: z.number().min(0, "Sort order must be at least 0"),
});

type GradeTypeFormValues = z.infer<typeof gradeTypeFormSchema>;

interface GradeTypeDialogProps {
  gradeType?: GradeType;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function GradeTypeDialog({ 
  gradeType, 
  trigger, 
  open: controlledOpen, 
  onOpenChange: controlledOnOpenChange 
}: GradeTypeDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isEditing = !!gradeType;
  
  // Use controlled or uncontrolled state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GradeTypeFormValues>({
    resolver: zodResolver(gradeTypeFormSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      weight: 1.0,
      isActive: true,
      sortOrder: 0,
    },
  });

  const createMutation = useCreateGradeType();
  const updateMutation = useUpdateGradeType();

  useEffect(() => {
    if (gradeType) {
      reset({
        name: gradeType.name,
        code: gradeType.code,
        description: gradeType.description || "",
        weight: gradeType.weight,
        isActive: gradeType.isActive,
        sortOrder: gradeType.sortOrder,
      });
    } else {
      reset({
        name: "",
        code: "",
        description: "",
        weight: 1.0,
        isActive: true,
        sortOrder: 0,
      });
    }
  }, [gradeType, reset]);

  const onSubmit = async (values: GradeTypeFormValues) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: gradeType!.id,
          data: values,
        });
        toast.success("Grade type updated successfully!");
      } else {
        await createMutation.mutateAsync(values);
        toast.success("Grade type created successfully!");
      }
      setOpen(false);
      reset();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "An error occurred";
      toast.error(errorMessage);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Grade Type
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Grade Type" : "Add New Grade Type"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the grade type information below."
              : "Create a new grade type for managing student grades."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Assignment"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                placeholder="e.g., ASSIGNMENT"
                {...register("code")}
                onChange={(e) => {
                  setValue("code", e.target.value.toUpperCase());
                }}
              />
              {errors.code && (
                <p className="text-sm text-red-500">{errors.code.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional description..."
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-red-500">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Weight</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                min="0.1"
                max="10"
                {...register("weight", { valueAsNumber: true })}
              />
              {errors.weight && (
                <p className="text-sm text-red-500">{errors.weight.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input
                id="sortOrder"
                type="number"
                min="0"
                {...register("sortOrder", { valueAsNumber: true })}
              />
              {errors.sortOrder && (
                <p className="text-sm text-red-500">
                  {errors.sortOrder.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={watch("isActive")}
              onCheckedChange={(checked) => setValue("isActive", checked)}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
