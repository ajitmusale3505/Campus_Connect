'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, TrendingUp, TrendingDown, Download, AlertTriangle, CheckCircle } from "lucide-react";
import { Line, LineChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { useToast } from '@/hooks/use-toast';

interface Student {
  _id: string;
  name: string;
  email: string;
  rollNumber?: string;
  department?: string;
  avatarUrl?: string;
}

interface StudentProgress {
  student: Student;
  attendance: {
    average: number;
    trend: 'up' | 'down' | 'stable';
    data: Array<{ month: string; value: number }>;
  };
  marks: {
    average: number;
    trend: 'up' | 'down' | 'stable';
    data: Array<{ subject: string; score: number; total: number }>;
  };
  chatParticipation: {
    doubtsPosted: number;
    answersGiven: number;
    helpful: number;
  };
  alerts: string[];
}

export default function StudentProgressPage() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentProgress | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/students?role=student');
      const data = await response.json();
      
      if (data.success) {
        setStudents(data.data);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildStudentProgress = async (studentId: string): Promise<StudentProgress> => {
    const student = students.find(s => s._id === studentId);
    if (!student) {
      throw new Error('Student not found');
    }

    const [attendanceRes, marksRes, doubtsRes] = await Promise.all([
      fetch(`/api/attendance?userId=${studentId}`),
      fetch(`/api/marks?studentId=${studentId}`),
      fetch(`/api/doubts?studentId=${studentId}`),
    ]);

    const [attendanceData, marksData, doubtsData] = await Promise.all([
      attendanceRes.json(),
      marksRes.json(),
      doubtsRes.json(),
    ]);

    const attendanceRecords = attendanceData.success ? (attendanceData.data || []) : [];
    const marksRecords = marksData.success ? (marksData.data || []) : [];
    const doubtsRecords = doubtsData.success ? (doubtsData.data || []) : [];

    const monthStats = new Map<string, { total: number; present: number }>();
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const key = date.toLocaleString('en-US', { month: 'short' });
      monthStats.set(key, { total: 0, present: 0 });
    }

    attendanceRecords.forEach((record: any) => {
      const key = new Date(record.date).toLocaleString('en-US', { month: 'short' });
      if (!monthStats.has(key)) {
        monthStats.set(key, { total: 0, present: 0 });
      }

      const current = monthStats.get(key)!;
      current.total += 1;
      if (record.status === 'present' || record.status === 'late') {
        current.present += 1;
      }
    });

    const attendanceSeries = Array.from(monthStats.entries()).map(([month, value]) => ({
      month,
      value: value.total ? (value.present / value.total) * 100 : 0,
    }));

    const attendanceAverage = attendanceSeries.length
      ? attendanceSeries.reduce((sum, point) => sum + point.value, 0) / attendanceSeries.length
      : 0;

    const attendanceTrend: 'up' | 'down' | 'stable' =
      attendanceSeries.length >= 2
        ? attendanceSeries[attendanceSeries.length - 1].value > attendanceSeries[0].value
          ? 'up'
          : attendanceSeries[attendanceSeries.length - 1].value < attendanceSeries[0].value
            ? 'down'
            : 'stable'
        : 'stable';

    const marksBySubject = new Map<string, { scoreSum: number; totalSum: number }>();
    marksRecords.forEach((mark: any) => {
      if (!marksBySubject.has(mark.subject)) {
        marksBySubject.set(mark.subject, { scoreSum: 0, totalSum: 0 });
      }
      const bucket = marksBySubject.get(mark.subject)!;
      bucket.scoreSum += Number(mark.score || 0);
      bucket.totalSum += Number(mark.total || 0);
    });

    const marksSeries = Array.from(marksBySubject.entries()).map(([subject, totals]) => ({
      subject,
      score: totals.totalSum > 0 ? (totals.scoreSum / totals.totalSum) * 100 : 0,
      total: 100,
    }));

    const marksAverage = marksSeries.length
      ? marksSeries.reduce((sum, row) => sum + row.score, 0) / marksSeries.length
      : 0;

    const marksTrend: 'up' | 'down' | 'stable' =
      marksRecords.length >= 2
        ? (marksRecords[0].score / Math.max(1, marksRecords[0].total)) * 100 >
          (marksRecords[marksRecords.length - 1].score / Math.max(1, marksRecords[marksRecords.length - 1].total)) * 100
          ? 'up'
          : 'down'
        : 'stable';

    const alerts: string[] = [];
    if (attendanceAverage < 75) {
      alerts.push('Attendance below 75% threshold');
    }
    if (marksAverage < 60) {
      alerts.push('Overall marks below 60% - intervention recommended');
    }

    return {
      student,
      attendance: {
        average: Number(attendanceAverage.toFixed(1)),
        trend: attendanceTrend,
        data: attendanceSeries,
      },
      marks: {
        average: Number(marksAverage.toFixed(1)),
        trend: marksTrend,
        data: marksSeries,
      },
      chatParticipation: {
        doubtsPosted: doubtsRecords.length,
        answersGiven: doubtsRecords.reduce((sum: number, doubt: any) => sum + (doubt.answers?.length || 0), 0),
        helpful: doubtsRecords.reduce((sum: number, doubt: any) => sum + (doubt.upvotes || 0), 0),
      },
      alerts,
    };
  };

  const fetchStudentProgress = async (studentId: string) => {
    try {
      const progress = await buildStudentProgress(studentId);
      setSelectedStudent(progress);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch student progress',
        variant: 'destructive',
      });
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.rollNumber && student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const exportStudentPDF = async (studentId: string) => {
    try {
      const progress =
        selectedStudent && selectedStudent.student._id === studentId
          ? selectedStudent
          : await buildStudentProgress(studentId);

      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF();

      let cursorY = 20;
      const lineHeight = 8;

      pdf.setFontSize(16);
      pdf.text('CampusConnect - Student Progress Report', 14, cursorY);
      cursorY += lineHeight * 2;

      pdf.setFontSize(12);
      pdf.text(`Student: ${progress.student.name}`, 14, cursorY);
      cursorY += lineHeight;
      pdf.text(`Email: ${progress.student.email}`, 14, cursorY);
      cursorY += lineHeight;
      pdf.text(`Department: ${progress.student.department || 'N/A'}`, 14, cursorY);
      cursorY += lineHeight * 2;

      pdf.text(`Average Attendance: ${progress.attendance.average.toFixed(1)}%`, 14, cursorY);
      cursorY += lineHeight;
      pdf.text(`Average Marks: ${progress.marks.average.toFixed(1)}%`, 14, cursorY);
      cursorY += lineHeight;
      pdf.text(`Doubts Posted: ${progress.chatParticipation.doubtsPosted}`, 14, cursorY);
      cursorY += lineHeight;
      pdf.text(`Answers Given: ${progress.chatParticipation.answersGiven}`, 14, cursorY);
      cursorY += lineHeight * 2;

      pdf.setFontSize(13);
      pdf.text('Subject-wise Marks:', 14, cursorY);
      cursorY += lineHeight;
      pdf.setFontSize(11);

      progress.marks.data.forEach((subject) => {
        pdf.text(`- ${subject.subject}: ${subject.score.toFixed(1)}%`, 16, cursorY);
        cursorY += lineHeight;
      });

      if (progress.alerts.length > 0) {
        cursorY += lineHeight;
        pdf.setFontSize(13);
        pdf.text('Alerts:', 14, cursorY);
        cursorY += lineHeight;
        pdf.setFontSize(11);
        progress.alerts.forEach((alert) => {
          pdf.text(`- ${alert}`, 16, cursorY);
          cursorY += lineHeight;
        });
      }

      pdf.save(`student-progress-${progress.student.name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate progress PDF',
        variant: 'destructive',
      });
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Student Progress Tracker</h1>
        <p className="text-muted-foreground">Monitor individual student performance and progress</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search students by name, email, or roll number..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <p className="text-muted-foreground">No students found</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredStudents.map((student) => (
            <Card key={student._id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={student.avatarUrl} />
                      <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-muted-foreground">{student.email}</p>
                      {student.rollNumber && (
                        <p className="text-xs text-muted-foreground">Roll: {student.rollNumber}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button onClick={() => fetchStudentProgress(student._id)}>
                          View Progress
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        {selectedStudent && selectedStudent.student._id === student._id && (
                          <>
                            <DialogHeader>
                              <DialogTitle className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={selectedStudent.student.avatarUrl} />
                                    <AvatarFallback>{getInitials(selectedStudent.student.name)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p>{selectedStudent.student.name}</p>
                                    <p className="text-sm font-normal text-muted-foreground">
                                      {selectedStudent.student.department}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => exportStudentPDF(student._id)}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Export PDF
                                </Button>
                              </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-6 mt-4">
                              {/* Alerts */}
                              {selectedStudent.alerts.length > 0 && (
                                <div className="space-y-2">
                                  {selectedStudent.alerts.map((alert, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
                                    >
                                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                      <p className="text-sm">{alert}</p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* KPI Cards */}
                              <div className="grid gap-4 md:grid-cols-3">
                                <Card>
                                  <CardHeader className="pb-2">
                                    <CardDescription>Avg. Attendance</CardDescription>
                                    <CardTitle className="text-3xl flex items-center gap-2">
                                      {selectedStudent.attendance.average}%
                                      {selectedStudent.attendance.trend === 'up' ? (
                                        <TrendingUp className="h-5 w-5 text-green-600" />
                                      ) : selectedStudent.attendance.trend === 'down' ? (
                                        <TrendingDown className="h-5 w-5 text-red-600" />
                                      ) : null}
                                    </CardTitle>
                                  </CardHeader>
                                </Card>

                                <Card>
                                  <CardHeader className="pb-2">
                                    <CardDescription>Avg. Marks</CardDescription>
                                    <CardTitle className="text-3xl flex items-center gap-2">
                                      {selectedStudent.marks.average}%
                                      {selectedStudent.marks.trend === 'up' ? (
                                        <TrendingUp className="h-5 w-5 text-green-600" />
                                      ) : selectedStudent.marks.trend === 'down' ? (
                                        <TrendingDown className="h-5 w-5 text-red-600" />
                                      ) : null}
                                    </CardTitle>
                                  </CardHeader>
                                </Card>

                                <Card>
                                  <CardHeader className="pb-2">
                                    <CardDescription>Chat Participation</CardDescription>
                                    <CardTitle className="text-3xl">
                                      {selectedStudent.chatParticipation.doubtsPosted + 
                                       selectedStudent.chatParticipation.answersGiven}
                                    </CardTitle>
                                  </CardHeader>
                                </Card>
                              </div>

                              <Tabs defaultValue="attendance">
                                <TabsList className="grid w-full grid-cols-3">
                                  <TabsTrigger value="attendance">Attendance</TabsTrigger>
                                  <TabsTrigger value="marks">Marks</TabsTrigger>
                                  <TabsTrigger value="participation">Participation</TabsTrigger>
                                </TabsList>

                                <TabsContent value="attendance" className="space-y-4">
                                  <Card>
                                    <CardHeader>
                                      <CardTitle>Attendance Trend</CardTitle>
                                      <CardDescription>Monthly attendance percentage</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                      <ChartContainer config={{}} className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                          <LineChart data={selectedStudent.attendance.data}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="month" />
                                            <YAxis />
                                            <Tooltip content={<ChartTooltipContent />} />
                                            <Line
                                              type="monotone"
                                              dataKey="value"
                                              stroke="#8884d8"
                                              strokeWidth={2}
                                            />
                                          </LineChart>
                                        </ResponsiveContainer>
                                      </ChartContainer>
                                    </CardContent>
                                  </Card>
                                </TabsContent>

                                <TabsContent value="marks" className="space-y-4">
                                  <Card>
                                    <CardHeader>
                                      <CardTitle>Subject-wise Performance</CardTitle>
                                      <CardDescription>Recent assessment scores</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                      <ChartContainer config={{}} className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                          <BarChart data={selectedStudent.marks.data}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="subject" />
                                            <YAxis />
                                            <Tooltip content={<ChartTooltipContent />} />
                                            <Bar dataKey="score" fill="#8884d8" />
                                          </BarChart>
                                        </ResponsiveContainer>
                                      </ChartContainer>
                                    </CardContent>
                                  </Card>
                                </TabsContent>

                                <TabsContent value="participation" className="space-y-4">
                                  <Card>
                                    <CardHeader>
                                      <CardTitle>Community Engagement</CardTitle>
                                      <CardDescription>Doubt chatroom statistics</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                      <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <div>
                                          <p className="text-sm text-muted-foreground">Doubts Posted</p>
                                          <p className="text-2xl font-bold">
                                            {selectedStudent.chatParticipation.doubtsPosted}
                                          </p>
                                        </div>
                                        <CheckCircle className="h-8 w-8 text-muted-foreground" />
                                      </div>

                                      <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <div>
                                          <p className="text-sm text-muted-foreground">Answers Given</p>
                                          <p className="text-2xl font-bold">
                                            {selectedStudent.chatParticipation.answersGiven}
                                          </p>
                                        </div>
                                        <CheckCircle className="h-8 w-8 text-muted-foreground" />
                                      </div>

                                      <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <div>
                                          <p className="text-sm text-muted-foreground">Helpful Votes Received</p>
                                          <p className="text-2xl font-bold">
                                            {selectedStudent.chatParticipation.helpful}
                                          </p>
                                        </div>
                                        <CheckCircle className="h-8 w-8 text-muted-foreground" />
                                      </div>
                                    </CardContent>
                                  </Card>
                                </TabsContent>
                              </Tabs>
                            </div>
                          </>
                        )}
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportStudentPDF(student._id)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
