
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingDown, AlertCircle, Save } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface Student {
  _id: string;
  name: string;
  email: string;
  rollNumber?: string;
}

interface Mark {
  studentId: string;
  score: number;
}

export default function MarksPage() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assessmentType, setAssessmentType] = useState('mid-term');
  const [subject, setSubject] = useState('');
  const [totalMarks, setTotalMarks] = useState(100);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [belowAverageStudents, setBelowAverageStudents] = useState<Student[]>([]);

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
        // Initialize marks
        const initialMarks: Record<string, number> = {};
        data.data.forEach((student: Student) => {
          initialMarks[student._id] = 0;
        });
        setMarks(initialMarks);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkChange = (studentId: string, value: string) => {
    const score = parseFloat(value) || 0;
    setMarks(prev => ({ ...prev, [studentId]: score }));
  };

  const calculateAverage = (): string => {
    const validMarks = Object.values(marks).filter(m => m > 0);
    if (validMarks.length === 0) return '0';
    return (validMarks.reduce((a, b) => a + b, 0) / validMarks.length).toFixed(2);
  };

  const findBelowAverageStudents = () => {
    const average = parseFloat(calculateAverage());
    const below = students.filter(student => {
      const studentMark = marks[student._id] || 0;
      return studentMark > 0 && studentMark < average;
    });
    setBelowAverageStudents(below);
    setShowAnalytics(true);
  };

  const handleSaveMarks = async () => {
    if (!subject) {
      toast({
        title: "Error",
        description: "Please select a subject",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const marksData = Object.entries(marks)
        .filter(([_, score]) => score > 0)
        .map(([studentId, score]) => ({
          userId: studentId,
          subject,
          assessment: assessmentType,
          score,
          total: totalMarks,
        }));

      const promises = marksData.map(mark =>
        fetch('/api/marks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mark),
        })
      );

      const responses = await Promise.all(promises);

      for (const response of responses) {
        const payload = await response.json();
        if (!response.ok || !payload.success) {
          throw new Error(payload.error || 'Failed to save marks');
        }
      }

      const interventionCount = marksData.filter(mark => (mark.score / totalMarks) * 100 < 60).length;

      toast({
        title: "Success",
        description:
          interventionCount > 0
            ? `Marks saved successfully. ${interventionCount} low-score intervention notification(s) sent.`
            : `Marks saved successfully. Class average: ${calculateAverage()}%`,
      });

      // Show analytics
      findBelowAverageStudents();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save marks",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const sendInterventionTips = async () => {
    const userIds = belowAverageStudents.map(student => student._id);

    if (userIds.length === 0) {
      toast({
        title: 'No Students Selected',
        description: 'No below-average students to notify.',
      });
      return;
    }

    try {
      const response = await fetch('/api/notifications/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds,
          text: `Intervention tip from your teacher for ${subject || 'this assessment'}: revise weak topics and practice previous questions.`,
          type: 'warning',
          category: 'general',
          link: '/student/marks',
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send intervention tips');
      }

      toast({
        title: 'Notifications Sent',
        description: 'Intervention suggestions sent to selected students.',
      });
      setShowAnalytics(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send intervention tips',
        variant: 'destructive',
      });
    }
  };

  const exportMarks = () => {
    const csvContent = [
      ['Roll Number', 'Name', 'Email', 'Marks', 'Percentage'],
      ...students.map(student => [
        student.rollNumber || student._id,
        student.name,
        student.email,
        marks[student._id] || 0,
        ((marks[student._id] || 0) / totalMarks * 100).toFixed(2) + '%'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marks_${subject}_${assessmentType}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold">Enter Marks</h1>
            <p className="text-muted-foreground">Record and analyze student assessment scores</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={exportMarks}>
              <Download className="mr-2 h-4 w-4" /> Export Report
            </Button>
            <Button variant="outline" onClick={findBelowAverageStudents}>
              <TrendingDown className="mr-2 h-4 w-4" /> View Analytics
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assessment Details</CardTitle>
          <CardDescription>Configure assessment information before entering marks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="e.g., Mathematics"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="assessmentType">Assessment Type</Label>
              <Select value={assessmentType} onValueChange={setAssessmentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Internal Test</SelectItem>
                  <SelectItem value="mid-term">Mid-Term Exam</SelectItem>
                  <SelectItem value="end-sem">End Semester</SelectItem>
                  <SelectItem value="assignment">Assignment</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalMarks">Total Marks</Label>
              <Input
                id="totalMarks"
                type="number"
                value={totalMarks}
                onChange={(e) => setTotalMarks(parseInt(e.target.value) || 100)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Student Marks Entry</CardTitle>
          <CardDescription>Enter marks for each student (Max: {totalMarks})</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-[150px]">Marks</TableHead>
                  <TableHead className="w-[100px]">Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student, index) => (
                  <TableRow key={student._id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell className="text-muted-foreground">{student.email}</TableCell>
                    <TableCell>
                        <Input
                          type="number"
                          placeholder="0"
                          min="0"
                          max={totalMarks}
                          value={marks[student._id] || ''}
                          onChange={(e) => handleMarkChange(student._id, e.target.value)}
                        />
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        (marks[student._id] || 0) / totalMarks >= 0.9 ? 'default' :
                        (marks[student._id] || 0) / totalMarks >= 0.6 ? 'secondary' :
                        'destructive'
                      }>
                        {((marks[student._id] || 0) / totalMarks * 100).toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter className="justify-between">
            <div className="text-sm">
                Class Average: <span className="font-bold text-2xl text-primary">{calculateAverage()}%</span>
                <span className="text-muted-foreground ml-2">
                  ({Object.values(marks).filter(m => m > 0).length}/{students.length} students)
                </span>
            </div>
            <Button size="lg" onClick={handleSaveMarks} disabled={saving || loading}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Marks
                </>
              )}
            </Button>
        </CardFooter>
      </Card>

      <Dialog open={showAnalytics} onOpenChange={setShowAnalytics}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Performance Analytics</DialogTitle>
            <DialogDescription>
              Students performing below class average - consider intervention
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <p className="font-medium">Intervention Suggested</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {belowAverageStudents.length} student(s) scored below the class average of {calculateAverage()}%
              </p>
            </div>

            {belowAverageStudents.length > 0 ? (
              <div className="space-y-2">
                {belowAverageStudents.map(student => (
                  <div key={student._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-muted-foreground">{student.email}</p>
                    </div>
                    <Badge variant="destructive">
                      {marks[student._id]}/{totalMarks}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                All students are performing at or above average!
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAnalytics(false)}>
                Close
              </Button>
              <Button onClick={() => {
                sendInterventionTips();
              }}>
                Send Intervention Tips
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
