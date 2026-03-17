"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { useTimesheets, useApproveTimesheet, useRejectTimesheet } from "@/hooks/useTimesheets";
import { useTeachers } from "@/hooks/useTeachers";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Check, X, Calendar, Clock } from "lucide-react";
import { AlertDialogConfirm } from "@/components/ui/alert-dialog-confirm";

const LIMIT_ALL = 5000;

const MONTH_NAMES: Record<string, string> = {
  "1": "January", "2": "February", "3": "March", "4": "April",
  "5": "May", "6": "June", "7": "July", "8": "August",
  "9": "September", "10": "October", "11": "November", "12": "December",
};

function getMonthYearLabel(month: string, year: string): string {
  const name = MONTH_NAMES[month] || month;
  return `${name} ${year}`;
}

export default function TimesheetsManagementPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [teacherFilter, setTeacherFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear().toString());

  const [approveDialog, setApproveDialog] = useState<{ open: boolean; timesheetId: string }>({
    open: false,
    timesheetId: "",
  });

  // Fetch all (no paging): when month/year selected backend returns all for that month
  const { data: timesheetsData, isLoading, error } = useTimesheets(
    1,
    LIMIT_ALL,
    statusFilter === "all" ? undefined : statusFilter,
    teacherFilter === "all" ? undefined : teacherFilter,
    monthFilter === "all" ? undefined : monthFilter,
    yearFilter === "all" ? undefined : yearFilter
  );

  // Fetch teachers for filter dropdown
  const { data: teachers, isLoading: isLoadingTeachers } = useTeachers(1, 1000);

  const approveMutation = useApproveTimesheet();
  const rejectMutation = useRejectTimesheet();

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedTimesheetId, setSelectedTimesheetId] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState("");

  // All displayed rows (from API; when month/year set, API already filtered)
  const displayedTimesheets = timesheetsData?.data ?? [];

  // Total hours for displayed data (full month when month filter set, or all fetched)
  const totals = useMemo(() => {
    const totalMinutes = displayedTimesheets.reduce((sum, timesheet) => {
      return sum + timesheet.hoursWorked * 60 + timesheet.minutesWorked;
    }, 0);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return { hours, minutes };
  }, [displayedTimesheets]);

  const handleApproveClick = (id: string) => {
    setApproveDialog({ open: true, timesheetId: id });
  };

  const handleApproveConfirm = () => {
    approveMutation.mutate(approveDialog.timesheetId, {
      onSuccess: () => {
        toast.success("Timesheet approved successfully!");
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to approve timesheet");
      },
    });
  };

  const handleRejectClick = (id: string) => {
    setSelectedTimesheetId(id);
    setRejectDialogOpen(true);
  };

  const handleRejectSubmit = () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    rejectMutation.mutate(
      { id: selectedTimesheetId, reason: rejectionReason },
      {
        onSuccess: () => {
          toast.success("Timesheet rejected successfully!");
          setRejectDialogOpen(false);
          setRejectionReason("");
          setSelectedTimesheetId("");
        },
        onError: (error: any) => {
          toast.error(error.message || "Failed to reject timesheet");
        },
      }
    );
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
          <h1 className="text-3xl font-bold">Timesheet Management</h1>
          <p className="text-muted-foreground">
            Review and approve teacher timesheets
          </p>
        </div>
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
            <div className="w-[200px]">
              <Label htmlFor="teacher" className="text-xs">Teacher</Label>
              <Select 
                value={teacherFilter} 
                onValueChange={setTeacherFilter}
                disabled={isLoadingTeachers}
              >
                <SelectTrigger id="teacher">
                  <SelectValue placeholder="All teachers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All teachers</SelectItem>
                  {teachers?.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName}
                    </SelectItem>
                  ))}
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
          <CardTitle>All Timesheets</CardTitle>
          <CardDescription>
            Review and manage teacher working hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-auto max-h-[calc(100vh-20rem)]">
              <Table>
              <TableHeader>
                <TableRow className="sticky top-0 bg-muted/95 backdrop-blur supports-[backdrop-filter]:bg-muted/60 z-10 border-b">
                  <TableHead>Teacher</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedTimesheets.length > 0 ? (
                  displayedTimesheets.map((timesheet) => (
                    <TableRow key={timesheet.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {timesheet.teacher.firstName} {timesheet.teacher.lastName}
                          </p>
                        </div>
                      </TableCell>
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
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {timesheet.hoursWorked}h {timesheet.minutesWorked}m
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {timesheet.description || "-"}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(timesheet.status)}</TableCell>
                      <TableCell>
                        {timesheet.submittedAt ? (
                          <span className="text-sm">
                            {new Date(timesheet.submittedAt).toLocaleString()}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {timesheet.status === "SUBMITTED" && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:bg-green-50"
                              onClick={() => handleApproveClick(timesheet.id)}
                              disabled={approveMutation.isPending}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => handleRejectClick(timesheet.id)}
                              disabled={rejectMutation.isPending}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        {timesheet.status === "APPROVED" && (
                          <span className="text-xs text-green-600">
                            Approved at{" "}
                            {new Date(timesheet.approvedAt!).toLocaleDateString()}
                          </span>
                        )}
                        {timesheet.status === "REJECTED" && (
                          <div className="text-xs">
                            <p className="text-red-600 font-medium">Rejected</p>
                            {timesheet.rejectionReason && (
                              <p className="text-muted-foreground mt-1">
                                {timesheet.rejectionReason}
                              </p>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No timesheets found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              {displayedTimesheets.length > 0 && (
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2} className="font-bold">
                      {monthFilter !== "all" && yearFilter !== "all"
                        ? `Total (${getMonthYearLabel(monthFilter, yearFilter)})`
                        : "Total"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-bold text-base">
                          {totals.hours}h {totals.minutes}m
                        </span>
                      </div>
                    </TableCell>
                    <TableCell colSpan={4}></TableCell>
                  </TableRow>
                </TableFooter>
              )}
              </Table>
            </div>
          </div>

          {displayedTimesheets.length > 0 && (
            <p className="text-sm text-muted-foreground pt-4">
              Showing {displayedTimesheets.length} timesheet
              {displayedTimesheets.length !== 1 ? "s" : ""}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Timesheet</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this timesheet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for rejection</Label>
              <Textarea
                id="reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectionReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Rejecting...
                </>
              ) : (
                "Reject Timesheet"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <AlertDialogConfirm
        open={approveDialog.open}
        onOpenChange={(open) => setApproveDialog({ ...approveDialog, open })}
        onConfirm={handleApproveConfirm}
        title="Approve Timesheet"
        description="Are you sure you want to approve this timesheet? This action will mark it as approved."
        confirmText="Approve"
        cancelText="Cancel"
      />
    </div>
  );
}

