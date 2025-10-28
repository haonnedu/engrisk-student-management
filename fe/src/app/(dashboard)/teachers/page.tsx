"use client";

import * as React from "react";
import { useState } from "react";
import { useTeachers, useCreateTeacher, useUpdateTeacher, useDeleteTeacher } from "@/hooks/useTeachers";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Edit, UserCircle2, Mail, Phone, MapPin, Briefcase } from "lucide-react";
import { AlertDialogConfirm } from "@/components/ui/alert-dialog-confirm";

export default function TeachersPage() {
  const [page] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const limit = 50;
  
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    teacherId: string;
    teacherName: string;
  }>({ open: false, teacherId: "", teacherName: "" });
  
  const { data: teachers, isLoading, error } = useTeachers(
    page, 
    limit, 
    statusFilter === "all" ? undefined : statusFilter
  );
  const createMutation = useCreateTeacher();
  const updateMutation = useUpdateTeacher();
  const deleteMutation = useDeleteTeacher();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    position: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE" | "ON_LEAVE",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName) {
      toast.error("First name and last name are required");
      return;
    }

    if (editingTeacher) {
      // Update existing teacher
      updateMutation.mutate(
        { id: editingTeacher.id, data: formData },
        {
          onSuccess: () => {
            toast.success("Teacher updated successfully!");
            setIsDialogOpen(false);
            setEditingTeacher(null);
            setFormData({
              firstName: "",
              lastName: "",
              phone: "",
              address: "",
              position: "",
              status: "ACTIVE",
            });
          },
          onError: (error: any) => {
            const errorMessage = error.message || 
                               error.response?.data?.message || 
                               "Failed to update teacher";
            toast.error(errorMessage);
          },
        }
      );
    } else {
      // Create new teacher
      createMutation.mutate(formData, {
        onSuccess: () => {
          toast.success("Teacher created successfully! Default password: Teacher123!");
          setIsDialogOpen(false);
          setFormData({
            firstName: "",
            lastName: "",
            phone: "",
            address: "",
            position: "",
            status: "ACTIVE",
          });
        },
        onError: (error: any) => {
          const errorMessage = error.message || 
                             error.response?.data?.message || 
                             "Failed to create teacher";
          toast.error(errorMessage);
        },
      });
    }
  };

  const handleEditClick = (teacher: any) => {
    setEditingTeacher(teacher);
    setFormData({
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      phone: teacher.phone || "",
      address: teacher.address || "",
      position: teacher.position || "",
      status: teacher.status,
    });
    setIsDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingTeacher(null);
      setFormData({
        firstName: "",
        lastName: "",
        phone: "",
        address: "",
        position: "",
        status: "ACTIVE",
      });
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteDialog({ open: true, teacherId: id, teacherName: name });
  };

  const handleDeleteConfirm = () => {
    deleteMutation.mutate(deleteDialog.teacherId, {
      onSuccess: () => {
        toast.success("Teacher deleted successfully!");
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to delete teacher");
      },
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-600">Active</Badge>;
      case "INACTIVE":
        return <Badge variant="secondary">Inactive</Badge>;
      case "ON_LEAVE":
        return <Badge variant="outline">On Leave</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-red-500 gap-2">
        <p className="font-semibold">Unable to load teachers</p>
        <p className="text-sm text-muted-foreground">{(error as any).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teachers</h1>
          <p className="text-muted-foreground">
            Manage teaching staff and their accounts
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Teacher
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingTeacher ? "Edit Teacher" : "Add New Teacher"}</DialogTitle>
              <DialogDescription>
                {editingTeacher 
                  ? "Update teacher information" 
                  : "Create a new teacher account. A user account with TEACHER role will be created automatically."
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0123456789"
                />
                <p className="text-xs text-muted-foreground">
                  This will be used as the username for login
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="e.g., English Teacher, Math Teacher"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Full address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
                <p className="font-medium">📝 Note:</p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  <li>Default password will be: <strong>Teacher123!</strong></li>
                  <li>Teacher can login using phone number and default password</li>
                  <li>Teacher will have TEACHER role with admin-like permissions</li>
                </ul>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDialogClose(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      {editingTeacher ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    editingTeacher ? "Update Teacher" : "Create Teacher"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="w-[200px]">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teachers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Teachers ({teachers?.length || 0})</CardTitle>
          <CardDescription>
            List of all teachers in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers && teachers.length > 0 ? (
                  teachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <UserCircle2 className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {teacher.firstName} {teacher.lastName}
                            </p>
                            {teacher.address && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {teacher.address}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {teacher.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {teacher.phone}
                          </div>
                        )}
                        {teacher.user?.email && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {teacher.user.email}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {teacher.position ? (
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{teacher.position}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(teacher.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditClick(teacher)}
                            title="Edit teacher"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteClick(teacher.id, `${teacher.firstName} ${teacher.lastName}`)}
                            disabled={deleteMutation.isPending}
                            title="Delete teacher"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No teachers found. Add your first teacher!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialogConfirm
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        onConfirm={handleDeleteConfirm}
        title="Delete Teacher"
        description={`Are you sure you want to delete teacher "${deleteDialog.teacherName}"? This will also delete their user account. This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}

