
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BookOpen, MessageSquare, ClipboardList, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import AttendanceChart from '@/components/dashboard/AttendanceChart';
import MarksChart from '@/components/dashboard/MarksChart';
import AiChatbot from '@/components/dashboard/AiChatbot';
import NoticesPanel from '@/components/dashboard/NoticesPanel';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

type AttendanceRecord = {
  _id: string;
  date: string;
  status: 'present' | 'absent' | 'late';
};

type MarkRecord = {
  _id: string;
  assessment: string;
  score: number;
  total: number;
  subject: string;
  date: string;
};

type AssignmentRecord = {
  _id: string;
  dueDate: string;
  submissions?: Array<any>;
};

export default function StudentDashboard() {
  const { toast } = useToast();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [marks, setMarks] = useState<MarkRecord[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loading, setLoading] = useState(true);

  const [showEscalationDialog, setShowEscalationDialog] = useState(false);
  const [escalationSubmitting, setEscalationSubmitting] = useState(false);
  const [escalationData, setEscalationData] = useState({
    title: '',
    description: '',
    category: 'academic',
    priority: 'medium',
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [attendanceRes, marksRes, assignmentsRes, notificationsRes] = await Promise.all([
        fetch('/api/attendance'),
        fetch('/api/marks'),
        fetch('/api/assignments'),
        fetch('/api/notifications?unreadOnly=true'),
      ]);

      const [attendanceData, marksData, assignmentsData, notificationsData] = await Promise.all([
        attendanceRes.json(),
        marksRes.json(),
        assignmentsRes.json(),
        notificationsRes.json(),
      ]);

      if (attendanceData.success) {
        setAttendanceRecords(attendanceData.data || []);
      }

      if (marksData.success) {
        setMarks(marksData.data || []);
      }

      if (assignmentsData.success) {
        setAssignments(assignmentsData.data || []);
      }

      if (notificationsData.success) {
        setUnreadNotifications((notificationsData.data || []).length);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const attendance = useMemo(() => {
    const months = new Map<string, { total: number; present: number }>();

    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const label = date.toLocaleString('en-US', { month: 'short' });
      months.set(label, { total: 0, present: 0 });
    }

    attendanceRecords.forEach((record) => {
      const label = new Date(record.date).toLocaleString('en-US', { month: 'short' });
      if (!months.has(label)) {
        months.set(label, { total: 0, present: 0 });
      }

      const month = months.get(label)!;
      month.total += 1;
      if (record.status === 'present' || record.status === 'late') {
        month.present += 1;
      }
    });

    return Array.from(months.entries()).map(([month, value]) => ({
      month,
      value: value.total ? (value.present / value.total) * 100 : 0,
    }));
  }, [attendanceRecords]);

  const averageAttendance = attendance.length
    ? attendance.reduce((acc, month) => acc + month.value, 0) / attendance.length
    : 0;

  const overallPercentage = marks.length
    ? (marks.reduce((acc, mark) => acc + mark.score / (mark.total || 1), 0) / marks.length) * 100
    : 0;

  const lastMark = marks[0];

  const pendingAssignments = assignments.filter((assignment) => {
    const hasSubmitted = Array.isArray(assignment.submissions) && assignment.submissions.length > 0;
    return !hasSubmitted;
  });

  const overdueAssignments = pendingAssignments.filter((assignment) => new Date(assignment.dueDate) < new Date());

  const handleRaiseEscalation = async () => {
    if (!escalationData.title.trim() || !escalationData.description.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Title and description are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setEscalationSubmitting(true);
      const response = await fetch('/api/escalations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(escalationData),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to raise escalation');
      }

      toast({
        title: 'Escalation Raised',
        description: 'Your issue has been submitted to HOD for review',
      });

      setShowEscalationDialog(false);
      setEscalationData({
        title: '',
        description: '',
        category: 'academic',
        priority: 'medium',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to raise escalation',
        variant: 'destructive',
      });
    } finally {
      setEscalationSubmitting(false);
    }
  };

  return (
    <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 xl:col-span-2">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg. Attendance</CardDescription>
              <CardTitle className="text-4xl">{loading ? '--' : `${averageAttendance.toFixed(1)}%`}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Based on your recorded attendance
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Overall Marks</CardDescription>
              <CardTitle className="text-4xl">{loading ? '--' : `${overallPercentage.toFixed(1)}%`}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                {lastMark
                  ? `Last assessment: ${lastMark.score}/${lastMark.total} on ${lastMark.assessment}`
                  : 'No marks recorded yet'}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Assignments Due</CardDescription>
              <CardTitle className="text-4xl">{loading ? '--' : pendingAssignments.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                {loading ? 'Loading...' : `${overdueAssignments.length} overdue`}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Unread Notices</CardDescription>
              <CardTitle className="text-4xl">{loading ? '--' : unreadNotifications}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Notifications pending review
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Attendance Trend</CardTitle>
                    <CardDescription>Your attendance over the last 6 months.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AttendanceChart data={attendance} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Marks Distribution</CardTitle>
                    <CardDescription>Your performance across recent assessments.</CardDescription>
                </CardHeader>
                <CardContent>
                    <MarksChart data={marks} />
                </CardContent>
            </Card>
        </div>
        <div className="grid gap-4">
             <AiChatbot />
        </div>
      </div>

      <div className="grid auto-rows-max items-start gap-4 md:gap-8">
        <Card>
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Your most-used links, just a click away.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <Link href="/student/chat/general">
                    <Button variant="outline" className="w-full justify-between">
                        Ask a Doubt <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </Link>
                <Link href="/student/library">
                    <Button variant="outline" className="w-full justify-between">
                        Digital Library <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </Link>
                <Link href="/student/assignments">
                    <Button variant="outline" className="w-full justify-between">
                        View Assignments <ClipboardList className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </Link>
                <Button variant="outline" className="w-full justify-between" onClick={() => setShowEscalationDialog(true)}>
                  Raise Escalation <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </Button>
            </CardContent>
        </Card>
        <NoticesPanel viewAllHref="/student/notices" />
      </div>

      <Dialog open={showEscalationDialog} onOpenChange={setShowEscalationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Raise Escalation</DialogTitle>
            <DialogDescription>Report an issue to HOD for prompt resolution.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Issue title"
              value={escalationData.title}
              onChange={(event) => setEscalationData((prev) => ({ ...prev, title: event.target.value }))}
            />

            <Textarea
              placeholder="Describe your issue"
              value={escalationData.description}
              onChange={(event) => setEscalationData((prev) => ({ ...prev, description: event.target.value }))}
            />

            <div className="grid grid-cols-2 gap-3">
              <Select
                value={escalationData.category}
                onValueChange={(value) => setEscalationData((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="chat-abuse">Chat Abuse</SelectItem>
                  <SelectItem value="harassment">Harassment</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={escalationData.priority}
                onValueChange={(value) => setEscalationData((prev) => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEscalationDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRaiseEscalation} disabled={escalationSubmitting}>
              {escalationSubmitting ? 'Submitting...' : 'Submit Escalation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
