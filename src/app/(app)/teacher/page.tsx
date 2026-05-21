
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, BookOpen, Calendar, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import StudentsList from "@/components/dashboard/StudentsList";
import NoticesPanel from '@/components/dashboard/NoticesPanel';

type Assignment = {
    _id: string;
    title: string;
    class: string;
    subject: string;
    dueDate: string;
    submissions: any[];
};

type AttendanceRecord = {
    status: 'present' | 'absent' | 'late';
};

type DoubtRecord = {
    isResolved: boolean;
};

export default function TeacherDashboard() {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [doubts, setDoubts] = useState<DoubtRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            const [assignmentsRes, attendanceRes, doubtsRes] = await Promise.all([
                fetch('/api/assignments'),
                fetch('/api/attendance'),
                fetch('/api/doubts'),
            ]);

            const [assignmentsData, attendanceData, doubtsData] = await Promise.all([
                assignmentsRes.json(),
                attendanceRes.json(),
                doubtsRes.json(),
            ]);

            if (assignmentsData.success) {
                setAssignments(assignmentsData.data || []);
            }

            if (attendanceData.success) {
                setAttendance(attendanceData.data || []);
            }

            if (doubtsData.success) {
                setDoubts(doubtsData.data || []);
            }
        } finally {
            setLoading(false);
        }
    };

    const pendingAssignments = useMemo(
        () =>
            assignments.map((assignment) => ({
                id: assignment._id,
                title: assignment.title,
                class: assignment.class,
                submitted: assignment.submissions?.length || 0,
                total: assignment.submissions?.length || 0,
                dueDate: new Date(assignment.dueDate).toLocaleDateString(),
            })),
        [assignments]
    );

    const timetable = useMemo(
        () =>
            assignments.slice(0, 4).map((assignment) => ({
                time: new Date(assignment.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                subject: assignment.subject,
                class: assignment.class,
                type: 'Review',
            })),
        [assignments]
    );

    const averageAttendance = attendance.length
        ? (attendance.filter((record) => record.status === 'present' || record.status === 'late').length / attendance.length) * 100
        : 0;

    const openDoubts = doubts.filter((doubt) => !doubt.isResolved).length;

  return (
    <>
    <div className="grid gap-4 md:gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 grid gap-4 auto-rows-max">
            {/* KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Avg. Class Attendance</CardDescription>
                        <CardTitle className="text-4xl">{loading ? '--' : `${averageAttendance.toFixed(1)}%`}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground">Calculated from recorded attendance entries</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Open Doubts</CardDescription>
                        <CardTitle className="text-4xl">{loading ? '--' : openDoubts}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground">Active unresolved student doubts</div>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Assignments */}
            <Card>
                <CardHeader>
                    <CardTitle>Pending Assignment Reviews</CardTitle>
                    <CardDescription>Assignments that need your attention.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Class</TableHead>
                                <TableHead className="text-center">Submissions</TableHead>
                                <TableHead className="text-right">Due Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pendingAssignments.map(assignment => (
                                <TableRow key={assignment.id}>
                                    <TableCell className="font-medium">{assignment.title}</TableCell>
                                    <TableCell>{assignment.class}</TableCell>
                                    <TableCell className="text-center">{assignment.submitted}/{assignment.total}</TableCell>
                                    <TableCell className="text-right">{assignment.dueDate}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter>
                    <Button size="sm" variant="outline" className="ml-auto">
                        View All <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Button>
                </CardFooter>
            </Card>
        </div>

        {/* Timetable */}
        <div className="lg:col-span-1 grid gap-4 auto-rows-max">
            <Card>
                <CardHeader>
                    <CardTitle>Today's Timetable</CardTitle>
                    <CardDescription>{new Date().toDateString()}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    {timetable.length > 0 ? timetable.map((slot, index) => (
                        <div key={index} className="flex items-center gap-4">
                            <div className="text-sm text-muted-foreground w-24">{slot.time}</div>
                            <div className="flex-1">
                                {slot.subject !== 'Free' ? (
                                    <>
                                        <p className="font-semibold">{slot.subject}</p>
                                        <p className="text-xs text-muted-foreground">{slot.class}</p>
                                    </>
                                ) : (
                                    <p className="text-muted-foreground italic">Free Slot</p>
                                )}
                            </div>
                            {slot.type && <Badge variant={slot.type === 'Lab' ? 'destructive' : 'secondary'}>{slot.type}</Badge>}
                        </div>
                                        )) : (
                                            <p className="text-sm text-muted-foreground">No scheduled items available yet.</p>
                                        )}
                </CardContent>
                <CardFooter>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/teacher/timetable">View Full Timetable</Link>
                    </Button>
                </CardFooter>
            </Card>
            <NoticesPanel viewAllHref="/teacher/notifications" />
        </div>
    </div>

    {/* Students List Section */}
    <div className="mt-8">
      <StudentsList />
    </div>
    </>
  );
}
