'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Flag, MessageSquare, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Escalation = {
  _id: string;
  title: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'assigned' | 'in-progress' | 'resolved' | 'closed';
  reportedBy?: { _id: string; name: string };
  assignedTo?: { _id: string; name: string };
  createdAt: string;
};

type Teacher = {
  _id: string;
  name: string;
};

export default function EscalationsPage() {
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedEscalation, setSelectedEscalation] = useState<Escalation | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'open' | 'assigned' | 'in-progress' | 'resolved' | 'closed'>('assigned');
  const [notes, setNotes] = useState('');
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quickAssigningId, setQuickAssigningId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchEscalations();
    fetchTeachers();
  }, []);

  const fetchEscalations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/escalations');
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch escalations');
      }

      setEscalations(data.data || []);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to fetch escalations', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/users?role=teacher');
      const data = await response.json();
      if (response.ok && data.success) {
        setTeachers(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch teachers', error);
    }
  };

  const handleAssign = async () => {
    if (!selectedEscalation) return;

    if (!selectedTeacherId && selectedStatus === 'assigned') {
      toast({ title: 'Missing Selection', description: 'Please select a teacher for assignment.', variant: 'destructive' });
      return;
    }

    try {
      setSaving(true);
      const payload: Record<string, any> = {
        status: selectedStatus,
        notes,
      };

      if (selectedTeacherId) {
        payload.teacherId = selectedTeacherId;
      }

      const response = await fetch(`/api/escalations/${selectedEscalation._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update escalation');
      }

      toast({ title: 'Escalation Updated', description: 'Escalation assignment/status updated successfully.' });
      setShowAssignDialog(false);
      setSelectedEscalation(null);
      setSelectedTeacherId('');
      setSelectedStatus('assigned');
      setNotes('');
      fetchEscalations();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update escalation', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleQuickAssign = async (escalationId: string, teacherId: string) => {
    try {
      setQuickAssigningId(escalationId);

      const response = await fetch(`/api/escalations/${escalationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId,
          status: 'assigned',
          activityAction: 'hod-teacher-assigned',
          notes: 'Teacher assigned from escalation table',
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to assign teacher');
      }

      toast({ title: 'Teacher Assigned', description: 'Escalation assigned successfully.' });
      fetchEscalations();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to assign teacher', variant: 'destructive' });
    } finally {
      setQuickAssigningId(null);
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, any> = {
      critical: 'destructive',
      high: 'destructive',
      medium: 'secondary',
      low: 'outline',
    };
    return <Badge variant={variants[priority]}>{priority}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Escalation Center</h1>
        <p className="text-muted-foreground">Manage flagged issues and student concerns</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Escalations</CardTitle>
            <Flag className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{escalations.filter(e => e.status === 'open').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{escalations.filter(e => e.status === 'assigned').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved This Week</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '--' : escalations.filter(e => e.status === 'resolved' || e.status === 'closed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '--' : `${Math.max(0, escalations.filter(e => e.status !== 'resolved').length)} open`}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Escalations</CardTitle>
          <CardDescription>Track and assign escalation tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Reported By</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {escalations.map((esc) => (
                <TableRow key={esc._id}>
                  <TableCell className="font-medium">{esc.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{esc.category}</Badge>
                  </TableCell>
                  <TableCell>{getPriorityBadge(esc.priority)}</TableCell>
                  <TableCell>{esc.reportedBy?.name || 'Unknown'}</TableCell>
                  <TableCell>
                    <Select
                      value={esc.assignedTo?._id}
                      onValueChange={(value) => handleQuickAssign(esc._id, value)}
                      disabled={quickAssigningId === esc._id || saving}
                    >
                      <SelectTrigger className="h-8 w-[180px]">
                        <SelectValue placeholder="Assign Teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers.map((teacher) => (
                          <SelectItem key={teacher._id} value={teacher._id}>
                            {teacher.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant={esc.status === 'open' ? 'destructive' : 'secondary'}>
                      {esc.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedEscalation(esc);
                        setSelectedTeacherId(esc.assignedTo?._id || '');
                        setSelectedStatus(esc.status === 'open' ? 'assigned' : esc.status);
                        setNotes('');
                        setShowAssignDialog(true);
                      }}
                    >
                      {esc.status === 'open' ? 'Assign' : 'View'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Escalation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <h4 className="font-medium mb-2">Issue Details</h4>
              <p className="text-sm text-muted-foreground">{selectedEscalation?.title}</p>
            </div>

            <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
              <SelectTrigger>
                <SelectValue placeholder="Assign to Faculty/Admin" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher._id} value={teacher._id}>{teacher.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Update Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Textarea placeholder="Add notes..." value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={saving}>{saving ? 'Saving...' : 'Assign'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
