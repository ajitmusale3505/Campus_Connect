
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Check, X, Download, AlertTriangle, TrendingDown, Users, BookOpen } from "lucide-react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Line, LineChart, Tooltip } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import StudentsList from "@/components/dashboard/StudentsList";
import { useToast } from '@/hooks/use-toast';
import NoticesPanel from '@/components/dashboard/NoticesPanel';

type DashboardStats = {
  counts: {
    students: number;
    faculty: number;
  };
  averages: {
    attendance: number;
    marks: number;
    passRate: number;
  };
  trends: {
    attendance: Array<{ month: string; attendance: number }>;
    passRate: Array<{ month: string; rate: number }>;
  };
  departments: Array<{
    department: string;
    attendanceAvg: number;
    marksAvg: number;
    risk: 'low' | 'medium' | 'high';
  }>;
};

type LeaveRequest = {
  _id: string;
  facultyId?: { _id: string; name: string };
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
};

type Assignment = {
  _id: string;
  dueDate: string;
  teacherId?: { name: string };
};

export default function HodDashboard() {
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const [statsRes, leavesRes, assignmentsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/leaves'),
        fetch('/api/assignments'),
      ]);

      const [statsData, leavesData, assignmentsData] = await Promise.all([
        statsRes.json(),
        leavesRes.json(),
        assignmentsRes.json(),
      ]);

      if (!statsRes.ok || !statsData.success) {
        throw new Error(statsData.error || 'Failed to load admin stats');
      }

      setStats(statsData.data);
      setLeaveRequests(leavesData.success ? leavesData.data || [] : []);
      setAssignments(assignmentsData.success ? assignmentsData.data || [] : []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load dashboard',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const attendanceData = useMemo(
    () =>
      (stats?.departments || []).map((department) => ({
        name: department.department,
        value: Number(department.attendanceAvg.toFixed(1)),
      })),
    [stats]
  );

  const passFailData = useMemo(
    () =>
      (stats?.trends.passRate || []).map((point) => ({
        name: point.month,
        pass: Number(point.rate.toFixed(1)),
        fail: Number((100 - point.rate).toFixed(1)),
      })),
    [stats]
  );

  const riskCourses = useMemo(
    () =>
      (stats?.departments || [])
        .filter((department) => department.risk !== 'low')
        .map((department) => ({
          course: `${department.department}`,
          type: department.attendanceAvg < 75 ? 'Low Attendance' : 'Low Marks',
          value: department.attendanceAvg < 75
            ? `${department.attendanceAvg.toFixed(1)}%`
            : `${department.marksAvg.toFixed(1)}%`,
          severity: department.risk,
        })),
    [stats]
  );

  const workloadData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const byTeacherDay: Record<string, number> = {};

    assignments.forEach((assignment) => {
      const teacher = assignment.teacherId?.name;
      if (!teacher) return;

      const date = new Date(assignment.dueDate);
      const dayIndex = date.getDay();
      if (dayIndex === 0 || dayIndex === 6) return;

      const day = days[dayIndex - 1];
      const key = `${teacher}__${day}`;
      byTeacherDay[key] = (byTeacherDay[key] || 0) + 1;
    });

    return Object.entries(byTeacherDay).map(([key, value]) => {
      const [faculty, day] = key.split('__');
      return { faculty, day, hours: value };
    });
  }, [assignments]);

  const facultyNames = useMemo(() => {
    const names = Array.from(new Set(workloadData.map((item) => item.faculty)));
    return names.slice(0, 5);
  }, [workloadData]);

  const pendingLeaves = leaveRequests.filter((request) => request.status === 'pending');

  const handleLeaveAction = async (leaveId: string, status: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/leaves/${leaveId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update leave request');
      }

      toast({
        title: `Leave ${status}`,
        description: `Leave request has been ${status}.`,
      });

      fetchDashboard();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update leave request',
        variant: 'destructive',
      });
    }
  };

  const exportPendingLeaves = () => {
    const rows = pendingLeaves.map((request) => [
      request.facultyId?.name || 'Unknown',
      new Date(request.startDate).toLocaleDateString(),
      new Date(request.endDate).toLocaleDateString(),
      request.status,
    ]);

    const csv = [['Faculty', 'Start Date', 'End Date', 'Status'], ...rows]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hod-leave-approvals-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <>
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Faculty</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '--' : stats?.counts.faculty || 0}</div>
            <p className="text-xs text-muted-foreground">Live count from user records</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '--' : assignments.length}</div>
            <p className="text-xs text-muted-foreground">Assignments and course work tracked</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Attendance</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '--' : `${stats?.averages.attendance.toFixed(1)}%`}</div>
            <p className="text-xs text-muted-foreground">Average across attendance records</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{riskCourses.length}</div>
            <p className="text-xs text-muted-foreground">Courses need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Alerts */}
      {riskCourses.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Risk Alerts for Courses</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-2">
              {riskCourses.map((risk, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="font-medium">{risk.course}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={risk.severity === 'high' ? 'destructive' : 'secondary'}>
                      {risk.type}: {risk.value}
                    </Badge>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/hod/analytics">View Details</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

    <div className="grid gap-4 md:gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 grid gap-4 auto-rows-max">
            {/* Analytics Charts */}
            <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Avg. Department Attendance</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[200px]">
                        <ChartContainer config={{}} className="h-full w-full">
                            <BarChart data={attendanceData}>
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                                <Tooltip cursor={false} content={<ChartTooltipContent />} />
                                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Pass/Fail Ratio</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[200px]">
                        <ChartContainer config={{}} className="h-full w-full">
                           <LineChart data={passFailData}>
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                                <Tooltip content={<ChartTooltipContent />} />
                                <Line type="monotone" dataKey="pass" stroke="hsl(var(--primary))" />
                                <Line type="monotone" dataKey="fail" stroke="hsl(var(--destructive))" />
                            </LineChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Faculty Workload */}
            <Card>
                <CardHeader>
                    <CardTitle>Faculty Workload Heatmap</CardTitle>
                    <CardDescription>Weekly teaching hours distribution.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-6 gap-1 text-center text-xs">
                        <div></div>
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => <div key={day} className="font-semibold">{day}</div>)}
                        {facultyNames.length > 0 ? facultyNames.map(faculty => (
                            <>
                                <div key={faculty} className="text-right pr-2 font-semibold">{faculty}</div>
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => {
                                    const item = workloadData.find(w => w.day === day && w.faculty === faculty);
                                    const hours = item ? item.hours : 0;
                                    const opacity = hours > 0 ? Math.min(hours / 5, 1) : 0;
                                    return (
                                        <div key={`${faculty}-${day}`} className="h-10 w-full rounded-md" style={{ backgroundColor: `hsla(var(--primary), ${opacity})` }} title={`${faculty}, ${day}: ${hours} hours`}></div>
                                    )
                                })}
                            </>
                            )) : <div className="col-span-6 text-muted-foreground text-center py-4">No workload records available.</div>}
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Leave Approvals */}
        <div className="lg:col-span-1 grid gap-4 auto-rows-max">
          <NoticesPanel viewAllHref="/hod/notifications" />
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Leave Approvals</CardTitle>
                        <CardDescription>Pending faculty leave requests.</CardDescription>
                    </div>
                    <Button variant="outline" onClick={exportPendingLeaves}><Download className="mr-2 h-4 w-4" /> Export</Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Faculty</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pendingLeaves.map(request => (
                                <TableRow key={request._id}>
                                    <TableCell>
                                        <div className="font-medium">{request.facultyId?.name || 'Unknown'}</div>
                                        <div className="text-xs text-muted-foreground">
                                          {new Date(request.startDate).toLocaleDateString()} to {new Date(request.endDate).toLocaleDateString()}
                                        </div>
                                    </TableCell>
                                    <TableCell><Badge variant="destructive">{request.status}</Badge></TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleLeaveAction(request._id, 'approved')}>
                                          <Check className="h-4 w-4 text-green-500" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleLeaveAction(request._id, 'rejected')}>
                                          <X className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/hod/faculty">View All Approvals</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    </div>
    </div>

    {/* Students List Section */}
    <div className="mt-8">
      <StudentsList />
    </div>
    </>
  );
}
