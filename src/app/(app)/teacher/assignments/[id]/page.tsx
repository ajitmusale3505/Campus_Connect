'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CheckCircle, Clock, FileText, Download, MessageSquare } from "lucide-react";
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function AssignmentDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [assignment, setAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Grading State
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false);
  const [gradeData, setGradeData] = useState({ grade: '', feedback: '' });
  const [grading, setGrading] = useState(false);

  useEffect(() => {
    fetchAssignmentDetails();
  }, [params.id]);

  const fetchAssignmentDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/assignments/${params.id}`);
      const data = await response.json();
      
      if (!response.ok) {
        toast({ title: "Error", description: data.error || "Failed to fetch assignment details", variant: "destructive" });
        return;
      }
      if (data.success) {
        setAssignment(data.data);
      }
    } catch (error) {
      console.error('Error fetching assignment:', error);
      toast({ title: "Error", description: "Failed to fetch assignment details", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmit = async () => {
    if (!selectedSubmission) return;
    
    const numGrade = Number(gradeData.grade);
    if (isNaN(numGrade) || numGrade < 0 || numGrade > assignment.totalMarks) {
      toast({ title: "Error", description: `Grade must be between 0 and ${assignment.totalMarks}`, variant: "destructive" });
      return;
    }

    try {
      setGrading(true);
      const response = await fetch(`/api/assignments/${params.id}/submissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedSubmission.studentId._id,
          grade: numGrade,
          feedback: gradeData.feedback,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({ title: "Error", description: data.error || "Failed to grade submission", variant: "destructive" });
        return;
      }

      toast({ title: "Success", description: "Submission graded successfully" });
      setIsGradeDialogOpen(false);
      fetchAssignmentDetails(); // Refresh list
    } catch (error) {
      console.error('Error grading:', error);
      toast({ title: "Error", description: "Failed to grade submission", variant: "destructive" });
    } finally {
      setGrading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-64" />
        </div>
        <Card><CardHeader><Skeleton className="h-32 w-full" /></CardHeader></Card>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h2 className="text-2xl font-bold mb-2">Assignment Not Found</h2>
        <p className="text-muted-foreground mb-6">The assignment you are looking for does not exist or you do not have permission to view it.</p>
        <Button onClick={() => router.push('/teacher/assignments')}>Go Back</Button>
      </div>
    );
  }

  const submissions = assignment.submissions || [];
  const gradedCount = submissions.filter((s: any) => s.grade !== null).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/teacher/assignments')} className="h-10 w-10">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{assignment.title}</h1>
          <p className="text-muted-foreground">Manage submissions and grading</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Total Marks</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignment.totalMarks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Total Submissions</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Graded</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{gradedCount} / {submissions.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assignment Details</CardTitle>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mt-2">
            <Badge variant="outline">{assignment.subject}</Badge>
            <Badge variant="outline">{assignment.class}</Badge>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> Due: {format(new Date(assignment.dueDate), 'MMM dd, yyyy')}</span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{assignment.description}</p>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold mb-4">Student Submissions</h2>
        {submissions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold">No submissions yet</p>
              <p className="text-sm text-muted-foreground">Students have not submitted anything for this assignment yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub: any) => (
              <Card key={sub._id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{sub.studentId?.name || 'Unknown Student'}</CardTitle>
                      <CardDescription>{sub.studentId?.email}</CardDescription>
                    </div>
                    {sub.grade !== null ? (
                      <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Graded: {sub.grade}/{assignment.totalMarks}</Badge>
                    ) : (
                      <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Needs Grading</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Submitted on: {format(new Date(sub.submittedAt), 'PPpp')}
                  </div>
                  
                  {sub.comments && (
                    <div className="p-3 bg-muted rounded-md text-sm">
                      <span className="font-semibold block mb-1">Student Comments:</span>
                      {sub.comments}
                    </div>
                  )}

                  {sub.attachments && sub.attachments.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm font-semibold">Attachments:</span>
                      <div className="flex flex-wrap gap-2">
                        {sub.attachments.map((att: any, idx: number) => (
                          <a key={idx} href={att.url || att} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded">
                            <Download className="h-4 w-4" /> View File
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {sub.feedback && (
                    <div className="p-3 bg-green-50 rounded-md text-sm border border-green-200">
                      <span className="font-semibold text-green-800 block mb-1">Your Feedback:</span>
                      <span className="text-green-700">{sub.feedback}</span>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="bg-muted/30 pt-4">
                  <Button 
                    onClick={() => {
                      setSelectedSubmission(sub);
                      setGradeData({ grade: sub.grade || '', feedback: sub.feedback || '' });
                      setIsGradeDialogOpen(true);
                    }}
                    variant={sub.grade !== null ? "outline" : "default"}
                  >
                    {sub.grade !== null ? "Edit Grade" : "Grade Submission"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isGradeDialogOpen} onOpenChange={setIsGradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grade Submission</DialogTitle>
            <DialogDescription>
              Grading {selectedSubmission?.studentId?.name}'s submission
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="grade">Marks (out of {assignment?.totalMarks})</Label>
              <Input
                id="grade"
                type="number"
                min="0"
                max={assignment?.totalMarks}
                value={gradeData.grade}
                onChange={(e) => setGradeData({ ...gradeData, grade: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback (Optional)</Label>
              <Textarea
                id="feedback"
                placeholder="Great job! / Needs improvement on..."
                value={gradeData.feedback}
                onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsGradeDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleGradeSubmit} disabled={grading}>
              {grading ? "Saving..." : "Save Grade"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
