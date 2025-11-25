"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useSectionGradeTypes,
  useAddGradeTypeToSection,
  useRemoveGradeTypeFromSection,
  useToggleGradeTypeInSection,
} from "@/hooks/useSectionGradeTypes";
import { useActiveGradeTypes } from "@/hooks/useGradeTypes";
import { Settings, Plus, Trash2, GripVertical } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

type SectionGradeTypesDialogProps = {
  sectionId: string;
  sectionName: string;
  trigger?: React.ReactNode;
};

export function SectionGradeTypesDialog({
  sectionId,
  sectionName,
  trigger,
}: SectionGradeTypesDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedGradeTypeId, setSelectedGradeTypeId] = useState<string>("");

  const { data: sectionGradeTypes, isLoading } = useSectionGradeTypes(sectionId);
  const { data: allGradeTypes } = useActiveGradeTypes();
  const addGradeTypeMutation = useAddGradeTypeToSection();
  const removeGradeTypeMutation = useRemoveGradeTypeFromSection();
  const toggleGradeTypeMutation = useToggleGradeTypeInSection();

  // Get grade types that are not yet added to this section
  const availableGradeTypes =
    allGradeTypes?.filter(
      (gt) => !sectionGradeTypes?.some((sgt: any) => sgt.id === gt.id)
    ) || [];

  const handleAddGradeType = () => {
    if (!selectedGradeTypeId) return;
    addGradeTypeMutation.mutate(
      {
        sectionId,
        gradeTypeId: selectedGradeTypeId,
      },
      {
        onSuccess: () => {
          setSelectedGradeTypeId("");
        },
      }
    );
  };

  const handleRemoveGradeType = (gradeTypeId: string) => {
    removeGradeTypeMutation.mutate({
      sectionId,
      gradeTypeId,
    });
  };

  const handleToggleActive = (gradeTypeId: string, isActive: boolean) => {
    toggleGradeTypeMutation.mutate({
      sectionId,
      gradeTypeId,
      isActive: !isActive,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Manage Grade Types
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Grade Types - {sectionName}</DialogTitle>
          <DialogDescription>
            Configure which grade types are available for this class section
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add new grade type */}
          <div className="flex items-end gap-2 p-4 border rounded-lg">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                Add Grade Type
              </label>
              <Select
                value={selectedGradeTypeId}
                onValueChange={setSelectedGradeTypeId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a grade type to add" />
                </SelectTrigger>
                <SelectContent>
                  {availableGradeTypes.length === 0 ? (
                    <SelectItem value="" disabled>
                      No available grade types
                    </SelectItem>
                  ) : (
                    availableGradeTypes.map((gt) => (
                      <SelectItem key={gt.id} value={gt.id}>
                        {gt.name} ({gt.code})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleAddGradeType}
              disabled={!selectedGradeTypeId || addGradeTypeMutation.isPending}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>

          {/* List of grade types in section */}
          <div className="border rounded-lg">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Grade Types in Section</h3>
              <p className="text-sm text-muted-foreground">
                {sectionGradeTypes?.length || 0} grade type(s) configured
              </p>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Spinner className="size-6" />
              </div>
            ) : sectionGradeTypes && sectionGradeTypes.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sectionGradeTypes.map((sgt: any) => (
                    <TableRow key={sgt.id}>
                      <TableCell>
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                      <TableCell className="font-medium">{sgt.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{sgt.code}</Badge>
                      </TableCell>
                      <TableCell>{sgt.weight}</TableCell>
                      <TableCell>
                        <Switch
                          checked={sgt.isActiveInSection !== false}
                          onCheckedChange={() =>
                            handleToggleActive(
                              sgt.id,
                              sgt.isActiveInSection !== false
                            )
                          }
                          disabled={toggleGradeTypeMutation.isPending}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveGradeType(sgt.id)}
                          disabled={removeGradeTypeMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-8 text-center">
                <div className="text-muted-foreground mb-2">
                  No grade types configured for this section.
                </div>
                <div className="text-sm text-muted-foreground">
                  Add grade types above to customize which types are available
                  for this class. If no grade types are configured, all active
                  grade types will be used by default.
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

