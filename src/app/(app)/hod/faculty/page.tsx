'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Calendar as CalendarIcon, User, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useAuth } from '@/hooks/use-auth';

interface LeaveRequest {
  _id: string;
  facultyId: { _id?: string; name: string; email: string };
  startDate: string;
  endDate: string;
  reason: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  substituteTeacherId?: { _id?: string; name: string };
}

interface Faculty {
  _id: string;
  name: string;
  email: string;
  department?: string;
}

export default function FacultyManagementPage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [availableFaculty, setAvailableFaculty] = useState<Faculty[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [substituteTeacher, setSubstituteTeacher] = useState('');
  const [comments, setComments] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchLeaveRequests();
    fetchAvailableFaculty();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/leaves');
      if (!res.ok) throw new Error('Failed to fetch leave requests');
      const data = await res.json();
      setLeaveRequests(data.data || []);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to fetch leave requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableFaculty = async () => {
    try {
      // Fetch all teachers that can act as substitutes
      const res = await fetch('/api/users?role=teacher');
      if (res.ok) {
        const data = await res.json();
        setAvailableFaculty(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch faculty:', error);
    }
  };

  const handleApprove = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setShowApprovalDialog(true);
  };

  const handleReject = async (requestId: string) => {
    try {
      setProcessingId(requestId);
      const res = await fetch(`/api/leaves/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'rejected',
          reviewedBy: user?.id,
          reviewedAt: new Date(),
        }),
      });

      if (!res.ok) throw new Error('Failed to reject leave');

      toast({
        title: "Leave Request Rejected",
        description: "The faculty member will be notified.",
      });
      fetchLeaveRequests();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to reject leave request",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleSubmitApproval = async () => {
    if (!selectedRequest) return;
    
    try {
      if (!substituteTeacher) {
        toast({
          title: "Missing Information",
          description: "Please assign a substitute teacher",
          variant: "destructive",
        });
        return;
      }

      setProcessingId(selectedRequest._id);
      
      const res = await fetch(`/api/leaves/${selectedRequest._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'approved',
          substituteTeacherId: substituteTeacher,
          comments,
          reviewedBy: user?.id,
          reviewedAt: new Date(),
        }),
      });

      if (!res.ok) throw new Error('Failed to approve leave');

      toast({
        title: "Leave Request Approved",
        description: "Substitute teacher has been assigned and notified.",
      });
      
      setShowApprovalDialog(false);
      setSubstituteTeacher('');
      setComments('');
      fetchLeaveRequests();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to approve leave request",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-600">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      sick: 'bg-red-100 text-red-800',
      personal: 'bg-blue-100 text-blue-800',
      conference: 'bg-green-100 text-green-800',
      emergency: 'bg-orange-100 text-orange-800',
    };
    return <Badge className={`capitalize ${colors[type?.toLowerCase()] || ''}`}>{type}</Badge>;
  };

  // Stats calculation
  const pendingCount = leaveRequests.filter(r => r.status === 'pending').length;
  
  // Calculate today's leave (simplified check)
  const today = new Date();
  today.setHours(0,0,0,0);
  const onLeaveToday = leaveRequests.filter(r => {
    if (r.status !== 'approved') return false;
    const start = new Date(r.startDate);
    const end = new Date(r.endDate);
    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999);
    return today >= start && today <= end;
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Faculty Management</h1>
          <p className="text-muted-foreground">Manage leave requests and staffing</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showCalendarView ? "default" : "outline"}
            onClick={() => setShowCalendarView(!showCalendarView)}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            Calendar View
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Require your approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Leave Today</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onLeaveToday}</div>
            <p className="text-xs text-muted-foreground">Faculty members</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Substitutes</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableFaculty.length}</div>
            <p className="text-xs text-muted-foreground">Faculty available</p>
          </CardContent>
        </Card>
      </div>

      {/* Leave Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
          <CardDescription>Review and approve faculty leave applications</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : leaveRequests.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              No leave requests found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Substitute</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveRequests.map((request) => (
                  <TableRow key={request._id}>
                    <TableCell>
                      <div className="font-medium">{request.facultyId?.name || 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground">{request.facultyId?.email || ''}</div>
                    </TableCell>
                    <TableCell>{getTypeBadge(request.type)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {request.startDate && format(new Date(request.startDate), 'MMM dd')} - {request.endDate && format(new Date(request.endDate), 'MMM dd')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {request.startDate && request.endDate ? 
                          Math.ceil((new Date(request.endDate).getTime() - new Date(request.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
                          : 0} days
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="truncate text-sm" title={request.reason}>{request.reason}</div>
                    </TableCell>
                    <TableCell>
                      {request.substituteTeacherId ? (
                        <div className="text-sm">{request.substituteTeacherId.name}</div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="text-right">
                      {request.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleApprove(request)}
                            disabled={processingId === request._id}
                          >
                            <Check className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleReject(request._id)}
                            disabled={processingId === request._id}
                          >
                            {processingId === request._id ? <Loader2 className="h-4 w-4 animate-spin text-red-500" /> : <X className="h-4 w-4 text-red-500" />}
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Approve Leave Request</DialogTitle>
            <DialogDescription>
              Assign a substitute teacher for {selectedRequest?.facultyId?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <h4 className="font-medium mb-2">Leave Details</h4>
              <div className="text-sm space-y-1 text-muted-foreground">
                <p>Duration: {selectedRequest?.startDate && format(new Date(selectedRequest.startDate), 'PPP')} - {selectedRequest?.endDate && format(new Date(selectedRequest.endDate), 'PPP')}</p>
                <p>Reason: {selectedRequest?.reason}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Assign Substitute Teacher *</label>
              <Select value={substituteTeacher} onValueChange={setSubstituteTeacher}>
                <SelectTrigger>
                  <SelectValue placeholder="Select available faculty" />
                </SelectTrigger>
                <SelectContent>
                  {availableFaculty.length > 0 ? availableFaculty.map((faculty) => (
                    <SelectItem key={faculty._id} value={faculty._id}>
                      <div>
                        <div>{faculty.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {faculty.department || faculty.email}
                        </div>
                      </div>
                    </SelectItem>
                  )) : (
                    <SelectItem value="none" disabled>No faculty available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Comments (Optional)</label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add any additional notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)} disabled={processingId !== null}>
              Cancel
            </Button>
            <Button onClick={handleSubmitApproval} disabled={processingId !== null}>
              {processingId !== null && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Approve & Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

