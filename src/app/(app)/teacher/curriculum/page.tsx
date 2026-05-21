'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'revision-requested';
type DocType = 'syllabus' | 'lab-manual' | 'reference-material' | 'other';

type CurriculumUpdate = {
  _id: string;
  courseCode: string;
  courseName: string;
  department: string;
  semester: number;
  documentType: DocType;
  currentVersion: string;
  status: ReviewStatus;
  reviewComments?: string;
  submittedBy?: {
    name?: string;
  };
  createdAt?: string;
  updatedAt?: string;
};

const initialForm = {
  courseCode: '',
  courseName: '',
  department: '',
  semester: '1',
  documentType: 'syllabus' as DocType,
  currentVersion: '1.0',
  changes: 'Initial submission',
  content: '',
};

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function statusBadge(status: ReviewStatus) {
  if (status === 'pending') return <Badge variant="secondary">Pending</Badge>;
  if (status === 'approved') return <Badge>Approved</Badge>;
  if (status === 'rejected') return <Badge variant="destructive">Rejected</Badge>;
  return <Badge variant="outline">Revision Requested</Badge>;
}

export default function TeacherCurriculumPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updates, setUpdates] = useState<CurriculumUpdate[]>([]);

  const fetchUpdates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/curriculum');
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch curriculum submissions');
      }

      setUpdates(Array.isArray(data.data) ? data.data : []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch curriculum submissions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  const handleSubmit = async () => {
    if (
      !formData.courseCode.trim() ||
      !formData.courseName.trim() ||
      !formData.department.trim() ||
      !formData.content.trim()
    ) {
      toast({
        title: 'Missing Information',
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          semester: Number(formData.semester),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit curriculum update');
      }

      toast({
        title: 'Submitted',
        description: 'Curriculum update submitted for HOD review',
      });

      setFormData(initialForm);
      fetchUpdates();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit curriculum update',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Curriculum Submissions</h1>
        <p className="text-muted-foreground">Create and submit syllabus or resource updates for HOD approval</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Curriculum Update</CardTitle>
          <CardDescription>Submit revised syllabus or lab/reference materials</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Course Code (e.g., CS301)"
              value={formData.courseCode}
              onChange={(event) => setFormData((prev) => ({ ...prev, courseCode: event.target.value }))}
            />
            <Input
              placeholder="Course Name"
              value={formData.courseName}
              onChange={(event) => setFormData((prev) => ({ ...prev, courseName: event.target.value }))}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <Input
              placeholder="Department"
              value={formData.department}
              onChange={(event) => setFormData((prev) => ({ ...prev, department: event.target.value }))}
            />
            <Input
              type="number"
              min={1}
              placeholder="Semester"
              value={formData.semester}
              onChange={(event) => setFormData((prev) => ({ ...prev, semester: event.target.value }))}
            />
            <Select
              value={formData.documentType}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, documentType: value as DocType }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Document Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="syllabus">Syllabus</SelectItem>
                <SelectItem value="lab-manual">Lab Manual</SelectItem>
                <SelectItem value="reference-material">Reference Material</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Version (e.g., 1.0)"
              value={formData.currentVersion}
              onChange={(event) => setFormData((prev) => ({ ...prev, currentVersion: event.target.value }))}
            />
          </div>

          <Textarea
            rows={3}
            placeholder="What changed in this version?"
            value={formData.changes}
            onChange={(event) => setFormData((prev) => ({ ...prev, changes: event.target.value }))}
          />

          <Textarea
            rows={6}
            placeholder="Curriculum content / summary"
            value={formData.content}
            onChange={(event) => setFormData((prev) => ({ ...prev, content: event.target.value }))}
          />

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit for Review'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Submissions</CardTitle>
          <CardDescription>Track status of curriculum updates submitted by you</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading submissions...</p>
          ) : updates.length === 0 ? (
            <p className="text-muted-foreground">No curriculum submissions yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Review Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {updates.map((update) => (
                  <TableRow key={update._id}>
                    <TableCell>
                      <div className="font-medium">{update.courseCode}</div>
                      <div className="text-xs text-muted-foreground">{update.courseName}</div>
                    </TableCell>
                    <TableCell className="capitalize">{update.documentType.replace('-', ' ')}</TableCell>
                    <TableCell>v{update.currentVersion}</TableCell>
                    <TableCell>{statusBadge(update.status)}</TableCell>
                    <TableCell>{formatDate(update.updatedAt || update.createdAt)}</TableCell>
                    <TableCell className="max-w-[260px] truncate">{update.reviewComments?.trim() || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
