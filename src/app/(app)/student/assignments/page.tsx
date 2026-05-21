'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, FileText, Upload, CheckCircle, AlertCircle, RefreshCw, ExternalLink } from "lucide-react";
import { formatDistanceToNow, format, isPast } from 'date-fns';

interface Assignment {
  _id: string;
  title: string;
  description: string;
  subject: string;
  class: string;
  totalMarks: number;
  dueDate: string;
  rubric?: string;
  submissions: any[];
  published: boolean;
  createdAt: string;
  teacherId?: {
    name: string;
    email: string;
  };
}

export default function StudentAssignmentsPage() {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [submissionData, setSubmissionData] = useState({
    content: '',
    fileUrl: '',
    comments: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/assignments');
      const data = await response.json();
      
      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch assignments",
          variant: "destructive",
        });
        return;
      }

      if (data.success) {
        setAssignments(data.data);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch assignments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedAssignment) return;

    if (!submissionData.content && !submissionData.fileUrl) {
      toast({
        title: "Error",
        description: "Please provide either content or a file URL",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/assignments/${selectedAssignment._id}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error || "Failed to submit assignment",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Assignment submitted successfully",
      });

      setIsSubmitDialogOpen(false);
      setSubmissionData({ content: '', fileUrl: '', comments: '' });
      fetchAssignments();
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast({
        title: "Error",
        description: "Failed to submit assignment",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isOverdue = (dueDate: string) => {
    return isPast(new Date(dueDate));
  };

  const hasSubmitted = (assignment: Assignment) => {
    return Array.isArray(assignment.submissions) && assignment.submissions.length > 0;
  };

  const isSubmissionGraded = (assignment: Assignment) => {
    const latestSubmission = getLatestSubmission(assignment);
    return latestSubmission?.grade !== null && latestSubmission?.grade !== undefined;
  };

  const getLatestSubmission = (assignment: Assignment) => {
    if (!Array.isArray(assignment.submissions) || assignment.submissions.length === 0) {
      return null;
    }

    return assignment.submissions[0];
  };

  const getStatusBadge = (assignment: Assignment) => {
    if (hasSubmitted(assignment)) {
      if (isSubmissionGraded(assignment)) {
        return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Graded</Badge>;
      }
      return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Under Review</Badge>;
    }
    if (isOverdue(assignment.dueDate)) {
      return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Overdue</Badge>;
    }
    return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
  };

  const pendingAssignments = assignments.filter(a => !hasSubmitted(a) && !isOverdue(a.dueDate));
  const overdueAssignments = assignments.filter(a => !hasSubmitted(a) && isOverdue(a.dueDate));
  const submittedAssignments = assignments.filter(a => hasSubmitted(a));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Assignments</h1>
          <p className="text-muted-foreground">View and submit your course assignments</p>
        </div>
        <Button variant="outline" onClick={fetchAssignments}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">To Submit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingAssignments.length}</div>
            <p className="text-xs text-muted-foreground">Assignments not submitted yet</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overdueAssignments.length}</div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{submittedAssignments.length}</div>
            <p className="text-xs text-muted-foreground">
              {submittedAssignments.filter((assignment) => isSubmissionGraded(assignment)).length} graded
            </p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold">No assignments yet</p>
            <p className="text-sm text-muted-foreground">
              Your teachers will post assignments here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {pendingAssignments.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Pending Assignments</h2>
              <div className="space-y-4">
                {pendingAssignments.map((assignment) => (
                  <Card key={assignment._id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle>{assignment.title}</CardTitle>
                          <CardDescription>
                            {assignment.subject} • {assignment.class} • {assignment.teacherId?.name}
                          </CardDescription>
                        </div>
                        {getStatusBadge(assignment)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {assignment.description && (
                        <p className="text-sm text-muted-foreground">{assignment.description}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Due: {format(new Date(assignment.dueDate), 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDistanceToNow(new Date(assignment.dueDate), { addSuffix: true })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>{assignment.totalMarks} marks</span>
                        </div>
                      </div>

                      {assignment.rubric && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium mb-1">Rubric:</p>
                          <p className="text-sm text-muted-foreground">{assignment.rubric}</p>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setIsSubmitDialogOpen(true);
                        }}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Submit Assignment
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {overdueAssignments.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Overdue Assignments</h2>
              <div className="space-y-4">
                {overdueAssignments.map((assignment) => (
                  <Card key={assignment._id} className="border-destructive">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle>{assignment.title}</CardTitle>
                          <CardDescription>
                            {assignment.subject} • {assignment.class} • {assignment.teacherId?.name}
                          </CardDescription>
                        </div>
                        {getStatusBadge(assignment)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {assignment.description && (
                        <p className="text-sm text-muted-foreground">{assignment.description}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2 text-destructive">
                          <Calendar className="h-4 w-4" />
                          <span>Was due: {format(new Date(assignment.dueDate), 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>{assignment.totalMarks} marks</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setIsSubmitDialogOpen(true);
                        }}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Submit Late
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {submittedAssignments.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Submitted Assignments</h2>
              <div className="space-y-4">
                {submittedAssignments.map((assignment) => (
                  (() => {
                    const submission = getLatestSubmission(assignment);

                    return (
                  <Card key={assignment._id} className="border-green-200">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle>{assignment.title}</CardTitle>
                          <CardDescription>
                            {assignment.subject} • {assignment.class} • {assignment.teacherId?.name}
                          </CardDescription>
                        </div>
                        {getStatusBadge(assignment)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Submitted on:{' '}
                            {submission?.submittedAt
                              ? format(new Date(submission.submittedAt), 'MMM dd, yyyy')
                              : format(new Date(assignment.createdAt), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        {submission?.grade !== null && submission?.grade !== undefined ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span>Graded: {submission.grade}/{assignment.totalMarks}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber-500" />
                            <span>Under review</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>{assignment.totalMarks} marks</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                    );
                  })()
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Submit Assignment Dialog */}
      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submit Assignment</DialogTitle>
            <DialogDescription>
              {selectedAssignment?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content">Your Answer/Solution</Label>
              <Textarea
                id="content"
                placeholder="Type your answer here or paste text content..."
                className="min-h-[200px]"
                value={submissionData.content}
                onChange={(e) => setSubmissionData({ ...submissionData, content: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fileUrl">File URL (Optional)</Label>
              <div className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-muted-foreground" />
                <Input
                  id="fileUrl"
                  placeholder="https://drive.google.com/... or any file link"
                  value={submissionData.fileUrl}
                  onChange={(e) => setSubmissionData({ ...submissionData, fileUrl: e.target.value })}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Link to your Google Drive, Dropbox, or any accessible file
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comments">Additional Comments (Optional)</Label>
              <Textarea
                id="comments"
                placeholder="Any notes or comments for your teacher..."
                value={submissionData.comments}
                onChange={(e) => setSubmissionData({ ...submissionData, comments: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsSubmitDialogOpen(false);
                  setSubmissionData({ content: '', fileUrl: '', comments: '' });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Assignment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
