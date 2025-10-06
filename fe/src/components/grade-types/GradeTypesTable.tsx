"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  GripVertical,
  Check,
  X,
} from "lucide-react";
import type { GradeType } from "@/lib/api-types";
import { GradeTypeDialog } from "./GradeTypeDialog";
import { useUpdateGradeType, useDeleteGradeType } from "@/hooks/useGradeTypes";
import { toast } from "sonner";

interface GradeTypesTableProps {
  gradeTypes: GradeType[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function GradeTypesTable({
  gradeTypes,
  isLoading,
  onRefresh,
}: GradeTypesTableProps) {
  const [editingGradeType, setEditingGradeType] = useState<
    GradeType | undefined
  >();
  const [deletingGradeType, setDeletingGradeType] = useState<
    GradeType | undefined
  >();
  const [editingField, setEditingField] = useState<{
    id: string;
    field: keyof GradeType;
    value: any;
  } | null>(null);

  const updateMutation = useUpdateGradeType();
  const deleteMutation = useDeleteGradeType();

  const handleToggleActive = async (gradeType: GradeType) => {
    try {
      await updateMutation.mutateAsync({
        id: gradeType.id,
        data: {
          isActive: !gradeType.isActive,
          weight: gradeType.weight,
          sortOrder: gradeType.sortOrder,
        },
      });
      toast.success(
        `Grade type ${
          gradeType.isActive ? "deactivated" : "activated"
        } successfully!`
      );
      onRefresh?.();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || "An error occurred";
      toast.error(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (!deletingGradeType) return;

    try {
      await deleteMutation.mutateAsync(deletingGradeType.id);
      toast.success("Grade type deleted successfully!");
      setDeletingGradeType(undefined);
      onRefresh?.();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || "An error occurred";
      toast.error(errorMessage);
    }
  };

  const handleInlineEdit = (gradeType: GradeType, field: keyof GradeType) => {
    setEditingField({
      id: gradeType.id,
      field,
      value: gradeType[field],
    });
  };

  const handleInlineSave = async () => {
    if (!editingField) return;

    try {
      const updateData: any = { [editingField.field]: editingField.value };
      await updateMutation.mutateAsync({
        id: editingField.id,
        data: updateData,
      });
      toast.success("Grade type updated successfully!");
      setEditingField(null);
      onRefresh?.();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || "An error occurred";
      toast.error(errorMessage);
    }
  };

  const handleInlineCancel = () => {
    setEditingField(null);
  };

  // Handle keyboard shortcuts for inline editing
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (editingField) {
        if (event.key === "Enter") {
          event.preventDefault();
          handleInlineSave();
        } else if (event.key === "Escape") {
          event.preventDefault();
          handleInlineCancel();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [editingField]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (gradeTypes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No grade types found.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Sort</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-center">Weight</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Sort Order</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gradeTypes.map((gradeType) => (
              <TableRow key={gradeType.id}>
                <TableCell>
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </TableCell>
                <TableCell className="font-medium">
                  {editingField?.id === gradeType.id &&
                  editingField?.field === "name" ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editingField.value}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEditingField({
                            ...editingField,
                            value: e.target.value,
                          })
                        }
                        className="h-8"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleInlineSave}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleInlineCancel}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="cursor-pointer hover:bg-muted/50 p-1 rounded"
                      onClick={() => handleInlineEdit(gradeType, "name")}
                    >
                      {gradeType.name}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {editingField?.id === gradeType.id &&
                  editingField?.field === "code" ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editingField.value}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEditingField({
                            ...editingField,
                            value: e.target.value.toUpperCase(),
                          })
                        }
                        className="h-8"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleInlineSave}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleInlineCancel}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="cursor-pointer hover:bg-muted/50 p-1 rounded"
                      onClick={() => handleInlineEdit(gradeType, "code")}
                    >
                      <Badge variant="outline">{gradeType.code}</Badge>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {editingField?.id === gradeType.id &&
                  editingField?.field === "description" ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editingField.value || ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEditingField({
                            ...editingField,
                            value: e.target.value,
                          })
                        }
                        className="h-8"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleInlineSave}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleInlineCancel}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="cursor-pointer hover:bg-muted/50 p-1 rounded"
                      onClick={() => handleInlineEdit(gradeType, "description")}
                    >
                      {gradeType.description || "-"}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {editingField?.id === gradeType.id &&
                  editingField?.field === "weight" ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="10"
                        value={editingField.value}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEditingField({
                            ...editingField,
                            value: parseFloat(e.target.value),
                          })
                        }
                        className="h-8 w-20"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleInlineSave}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleInlineCancel}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="cursor-pointer hover:bg-muted/50 p-1 rounded"
                      onClick={() => handleInlineEdit(gradeType, "weight")}
                    >
                      {gradeType.weight}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center">
                    <Switch
                      checked={gradeType.isActive}
                      onCheckedChange={() => handleToggleActive(gradeType)}
                      disabled={updateMutation.isPending}
                    />
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {editingField?.id === gradeType.id &&
                  editingField?.field === "sortOrder" ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        value={editingField.value}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEditingField({
                            ...editingField,
                            value: parseInt(e.target.value),
                          })
                        }
                        className="h-8 w-20"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleInlineSave}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleInlineCancel}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="cursor-pointer hover:bg-muted/50 p-1 rounded"
                      onClick={() => handleInlineEdit(gradeType, "sortOrder")}
                    >
                      {gradeType.sortOrder}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setEditingGradeType(gradeType)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeletingGradeType(gradeType)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <GradeTypeDialog
        gradeType={editingGradeType}
        open={!!editingGradeType}
        onOpenChange={(open) => {
          if (!open) {
            setEditingGradeType(undefined);
          }
        }}
        trigger={<div style={{ display: "none" }} />}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingGradeType}
        onOpenChange={() => setDeletingGradeType(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              grade type <strong>{deletingGradeType?.name}</strong> and remove
              it from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
