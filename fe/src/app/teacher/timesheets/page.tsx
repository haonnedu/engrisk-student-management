"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { useMyTimesheets, useCreateTimesheet, useSubmitTimesheet, useDeleteTimesheet } from "@/hooks/useTimesheets";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Send, Trash2, Calendar, Edit, Clock } from "lucide-react";
import { AlertDialogConfirm } from "@/components/ui/alert-dialog-confirm";
import { useUpdateTimesheet } from "@/hooks/useTimesheets";

export default function TeacherTimesheetsPage() {
  const [page, setPage] = useState(1);
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear().toString());
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const limit = 10;
  const { data: timesheetsData, isLoading, error } = useMyTimesheets(page, limit);
  const createMutation = useCreateTimesheet();
  const updateMutation = useUpdateTimesheet();
  const submitMutation = useSubmitTimesheet();
  const deleteMutation = useDeleteTimesheet();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTimesheet, setEditingTimesheet] = useState<any>(null);
  const [submitDialog, setSubmitDialog] = useState<{ open: boolean; timesheetId: string }>({
    open: false,
    timesheetId: "",
  });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; timesheetId: string }>({
    open: false,
    timesheetId: "",
  });
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    hoursWorked: 0,
    minutesWorked: 0,
    description: "",
  });

  // Filter timesheets by month/year/status (client-side filtering)
  const filteredTimesheets = useMemo(() => {
    const timesheets = timesheetsData?.data || [];
    
    return timesheets.filter((timesheet) => {
      const date = new Date(timesheet.date);
      const month = date.getMonth() + 1; // 1-12
      const year = date.getFullYear();
      
      const matchMonth = monthFilter === "all" || month === parseInt(monthFilter);
      const matchYear = yearFilter === "all" || year === parseInt(yearFilter);
      const matchStatus = statusFilter === "all" || timesheet.status === statusFilter;
      
      return matchMonth && matchYear && matchStatus;
    });
  }, [timesheetsData?.data, monthFilter, yearFilter, statusFilter]);

  // Calculate total hours and minutes
  const totals = useMemo(() => {
    const totalMinutes = filteredTimesheets.reduce((sum, timesheet) => {
      return sum + (timesheet.hoursWorked * 60) + timesheet.minutesWorked;
    }, 0);
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return { hours, minutes };
  }, [filteredTimesheets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingTimesheet) {
      // Update existing timesheet
      updateMutation.mutate(
        { id: editingTimesheet.id, data: formData },
        {
          onSuccess: () => {
            toast.success("Timesheet updated successfully!");
            setIsDialogOpen(false);
            setEditingTimesheet(null);
            setFormData({
              date: new Date().toISOString().split('T')[0],
              hoursWorked: 0,
              minutesWorked: 0,
              description: "",
            });
          },
          onError: (error: any) => {
            const errorMessage = error.message || 
                               error.response?.data?.message || 
                               "Failed to update timesheet";
            toast.error(errorMessage);
          },
        }
      );
    } else {
      // Create new timesheet
      createMutation.mutate(formData, {
        onSuccess: () => {
          toast.success("Timesheet created successfully!");
          setIsDialogOpen(false);
          setFormData({
            date: new Date().toISOString().split('T')[0],
            hoursWorked: 0,
            minutesWorked: 0,
            description: "",
          });
        },
        onError: (error: any) => {
          const errorMessage = error.message || 
                             error.response?.data?.message || 
                             "Failed to create timesheet";
          toast.error(errorMessage);
        },
      });
    }
  };

  const handleEditClick = (timesheet: any) => {
    setEditingTimesheet(timesheet);
    setFormData({
      date: new Date(timesheet.date).toISOString().split('T')[0],
      hoursWorked: timesheet.hoursWorked,
      minutesWorked: timesheet.minutesWorked,
      description: timesheet.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingTimesheet(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        hoursWorked: 0,
        minutesWorked: 0,
        description: "",
      });
    }
  };

  const handleSubmitClick = (id: string) => {
    setSubmitDialog({ open: true, timesheetId: id });
  };

  const handleSubmitConfirm = () => {
    submitMutation.mutate(submitDialog.timesheetId, {
      onSuccess: () => {
        toast.success("Timesheet submitted successfully!");
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to submit timesheet");
      },
    });
  };

  const handleDeleteClick = (id: string) => {
    setDeleteDialog({ open: true, timesheetId: id });
  };

  const handleDeleteConfirm = () => {
    deleteMutation.mutate(deleteDialog.timesheetId, {
      onSuccess: () => {
        toast.success("Timesheet deleted successfully!");
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to delete timesheet");
      },
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="outline">Draft</Badge>;
      case "SUBMITTED":
        return <Badge variant="secondary">Submitted</Badge>;
      case "APPROVED":
        return <Badge className="bg-green-600">Approved</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
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
        <p className="font-semibold">Unable to load timesheets</p>
        <p className="text-sm text-muted-foreground">{(error as any).message}</p>
      </div>
    );
  }

  // Generate year options from 2025 to 2030
  const yearOptions = Array.from({ length: 6 }, (_, i) => 2025 + i);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Timesheets</h1>
          <p className="text-muted-foreground">
            Track your working hours
          </p>
        </div>
         <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
           <DialogTrigger asChild>
             <Button>
               <Plus className="mr-2 h-4 w-4" />
               New Timesheet
             </Button>
           </DialogTrigger>
           <DialogContent>
             <DialogHeader>
               <DialogTitle>{editingTimesheet ? "Edit Timesheet" : "Create New Timesheet"}</DialogTitle>
               <DialogDescription>
                 {editingTimesheet ? "Update your working hours" : "Enter your working hours for a specific date"}
               </DialogDescription>
             </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hours">Hours</Label>
                  <Input
                    id="hours"
                    type="number"
                    min="0"
                    max="24"
                    value={formData.hoursWorked}
                    onChange={(e) => setFormData({ ...formData, hoursWorked: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minutes">Minutes</Label>
                  <Input
                    id="minutes"
                    type="number"
                    min="0"
                    max="59"
                    value={formData.minutesWorked}
                    onChange={(e) => setFormData({ ...formData, minutesWorked: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your work..."
                  rows={3}
                />
              </div>

               <div className="flex gap-2">
                 <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                   {(createMutation.isPending || updateMutation.isPending) ? (
                     <>
                       <Spinner className="mr-2 h-4 w-4" />
                       {editingTimesheet ? "Updating..." : "Creating..."}
                     </>
                   ) : (
                     editingTimesheet ? "Update" : "Create"
                   )}
                 </Button>
                 <Button
                   type="button"
                   variant="outline"
                   onClick={() => handleDialogClose(false)}
                 >
                   Cancel
                 </Button>
               </div>
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
          <div className="flex flex-wrap gap-3">
            <div className="w-[180px]">
              <Label htmlFor="status" className="text-xs">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[160px]">
              <Label htmlFor="month" className="text-xs">Month</Label>
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger id="month">
                  <SelectValue placeholder="All months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All months</SelectItem>
                  <SelectItem value="1">January</SelectItem>
                  <SelectItem value="2">February</SelectItem>
                  <SelectItem value="3">March</SelectItem>
                  <SelectItem value="4">April</SelectItem>
                  <SelectItem value="5">May</SelectItem>
                  <SelectItem value="6">June</SelectItem>
                  <SelectItem value="7">July</SelectItem>
                  <SelectItem value="8">August</SelectItem>
                  <SelectItem value="9">September</SelectItem>
                  <SelectItem value="10">October</SelectItem>
                  <SelectItem value="11">November</SelectItem>
                  <SelectItem value="12">December</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[140px]">
              <Label htmlFor="year" className="text-xs">Year</Label>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger id="year">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timesheets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Timesheet History</CardTitle>
          <CardDescription>All your submitted timesheets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTimesheets.length > 0 ? (
                  filteredTimesheets.map((timesheet) => (
                    <TableRow key={timesheet.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(timesheet.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {timesheet.hoursWorked}h {timesheet.minutesWorked}m
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {timesheet.description || "-"}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(timesheet.status)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          {(timesheet.status === "DRAFT" || timesheet.status === "REJECTED") && (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditClick(timesheet)}
                                title="Edit timesheet"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSubmitClick(timesheet.id)}
                                title="Submit for approval"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteClick(timesheet.id)}
                                title="Delete timesheet"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          )}
                          {timesheet.status === "REJECTED" && timesheet.rejectionReason && (
                            <div className="text-xs">
                              <p className="text-red-600 font-semibold">Rejection reason:</p>
                              <p className="text-red-600">{timesheet.rejectionReason}</p>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No timesheets found. Create your first timesheet!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              {filteredTimesheets.length > 0 && (
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-bold">
                      Total (Filtered)
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-bold text-base">
                          {totals.hours}h {totals.minutes}m
                        </span>
                      </div>
                    </TableCell>
                    <TableCell colSpan={3}></TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              Showing {timesheetsData?.meta.page || 1} of {timesheetsData?.meta.totalPages || 1} pages
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= (timesheetsData?.meta.totalPages || 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Confirmation Dialog */}
      <AlertDialogConfirm
        open={submitDialog.open}
        onOpenChange={(open) => setSubmitDialog({ ...submitDialog, open })}
        onConfirm={handleSubmitConfirm}
        title="Submit Timesheet"
        description="Are you sure you want to submit this timesheet? You won't be able to edit it after submission."
        confirmText="Submit"
        cancelText="Cancel"
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialogConfirm
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        onConfirm={handleDeleteConfirm}
        title="Delete Timesheet"
        description="Are you sure you want to delete this timesheet? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}

