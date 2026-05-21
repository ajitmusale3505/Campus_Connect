
'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Upload, CheckCircle, FileWarning } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import StudentsList from "@/components/dashboard/StudentsList";
import { useToast } from "@/hooks/use-toast";

interface Student {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export default function AttendancePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [selectAll, setSelectAll] = useState(false);
  const [uploadError, setUploadError] = useState<string[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { toast } = useToast();

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
        // Initialize all students as present by default
        const initialAttendance: Record<string, boolean> = {};
        data.data.forEach((student: Student) => {
          initialAttendance[student._id] = true;
        });
        setAttendance(initialAttendance);
        setSelectAll(true);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      toast({
        title: "Error",
        description: "Failed to fetch students",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    const newAttendance: Record<string, boolean> = {};
    students.forEach(student => {
      newAttendance[student._id] = checked;
    });
    setAttendance(newAttendance);
  };

  const handleStudentToggle = (studentId: string, checked: boolean) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: checked
    }));
    
    // Update select all checkbox state
    const allChecked = students.every(s => 
      s._id === studentId ? checked : attendance[s._id]
    );
    setSelectAll(allChecked);
  };

  const handleSaveAttendance = async () => {
    try {
      setSaving(true);
      const today = new Date().toISOString().split('T')[0];
      
      // Prepare attendance records
      const attendanceRecords = students.map(student => ({
        userId: student._id,
        date: today,
        status: attendance[student._id] ? 'present' : 'absent',
        subject: 'BSc CS - Sem 3',
      }));

      // Save each attendance record
      const promises = attendanceRecords.map(record =>
        fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record),
        })
      );

      const results = await Promise.all(promises);
      const allSuccess = results.every(r => r.ok);

      if (allSuccess) {
        const presentCount = Object.values(attendance).filter(Boolean).length;
        const absentCount = students.length - presentCount;
        
        toast({
          title: "Attendance Saved Successfully",
          description: `Present: ${presentCount}, Absent: ${absentCount}`,
        });
      } else {
        throw new Error('Some attendance records failed to save');
      }
    } catch (err) {
      console.error('Error saving attendance:', err);
      toast({
        title: "Error",
        description: "Failed to save attendance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const downloadCSVTemplate = () => {
    const csvContent = [
      'Roll Number,Name,Email,Status',
      'Example: 001,John Doe,john@example.com,Present',
      'Example: 002,Jane Smith,jane@example.com,Absent',
      ...students.map(s => `${s._id},${s.name},${s.email},Present`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_template_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const errors: string[] = [];
        const newAttendance: Record<string, boolean> = { ...attendance };

        // Skip header row
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith('Example:')) continue; // Skip example rows
          
          const [rollNumber, name, email, status] = line.split(',').map(s => s.trim());
          
          if (!rollNumber || !status) {
            errors.push(`Line ${i + 1}: Missing required fields`);
            continue;
          }

          const student = students.find(s => s._id === rollNumber || s.email === email);
          if (!student) {
            errors.push(`Line ${i + 1}: Student not found (${rollNumber || email})`);
            continue;
          }

          if (!['Present', 'Absent'].includes(status)) {
            errors.push(`Line ${i + 1}: Invalid status "${status}" (must be Present or Absent)`);
            continue;
          }

          newAttendance[student._id] = status === 'Present';
        }

        setAttendance(newAttendance);
        setUploadError(errors);
        setShowUploadDialog(true);

        if (errors.length === 0) {
          toast({
            title: "CSV Uploaded Successfully",
            description: `Attendance updated for ${Object.keys(newAttendance).length} students`,
          });
        }
      } catch (err) {
        console.error('CSV parsing error:', err);
        toast({
          title: "Error",
          description: "Failed to parse CSV file",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold">Manage Attendance</h1>
            <p className="text-muted-foreground">Mark attendance for BSc CS - Sem 3 for today.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadCSVTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Download Template
          </Button>
          <label>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleCSVUpload}
            />
            <Button variant="outline" asChild>
              <span>
                <Upload className="mr-2 h-4 w-4" />
                Upload CSV
              </span>
            </Button>
          </label>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Manual Attendance</CardTitle>
          <CardDescription>Select students who are present. (All students are marked present by default)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                      />
                  </TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No students found
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student, index) => (
                    <TableRow key={student._id}>
                      <TableCell>
                        <Checkbox 
                          id={`student-${student._id}`}
                          checked={attendance[student._id] || false}
                          onCheckedChange={(checked) => 
                            handleStudentToggle(student._id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell className="text-muted-foreground">{student.email}</TableCell>
                      <TableCell>
                        {attendance[student._id] ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            Present
                          </span>
                        ) : (
                          <span className="text-red-600">Absent</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button 
          size="lg" 
          onClick={handleSaveAttendance}
          disabled={saving || loading}
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            'Save Attendance'
          )}
        </Button>
      </div>

      {/* Registered Students List Section */}
      <div className="mt-8">
        <StudentsList />
      </div>

      {/* CSV Upload Error Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>CSV Upload Results</DialogTitle>
            <DialogDescription>
              {uploadError.length === 0 
                ? "All records processed successfully" 
                : `Found ${uploadError.length} error(s) in CSV file`}
            </DialogDescription>
          </DialogHeader>
          {uploadError.length > 0 && (
            <Alert variant="destructive">
              <FileWarning className="h-4 w-4" />
              <AlertDescription>
                <div className="max-h-[300px] overflow-y-auto space-y-1">
                  {uploadError.map((error, index) => (
                    <div key={index} className="text-sm">{error}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Close
            </Button>
            {uploadError.length === 0 && (
              <Button onClick={() => {
                setShowUploadDialog(false);
                handleSaveAttendance();
              }}>
                Save Attendance
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
