'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type StudentMark = {
  _id: string;
  subject: string;
  assessment: string;
  score: number;
  total: number;
  semester?: string;
  date: string;
};

export default function StudentMarksPage() {
  const { toast } = useToast();
  const [marks, setMarks] = useState<StudentMark[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMarks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/marks');
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch marks');
      }

      setMarks(data.data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch marks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarks();
  }, []);

  const markRows = useMemo(
    () =>
      marks.map((mark) => ({
        ...mark,
        percentage: mark.total > 0 ? (mark.score / mark.total) * 100 : 0,
      })),
    [marks]
  );

  const overallAverage = markRows.length
    ? markRows.reduce((sum, mark) => sum + mark.percentage, 0) / markRows.length
    : 0;

  const subjectSummary = useMemo(() => {
    const bySubject = new Map<string, { totalPercentage: number; count: number }>();

    markRows.forEach((mark) => {
      if (!bySubject.has(mark.subject)) {
        bySubject.set(mark.subject, { totalPercentage: 0, count: 0 });
      }

      const entry = bySubject.get(mark.subject)!;
      entry.totalPercentage += mark.percentage;
      entry.count += 1;
    });

    return Array.from(bySubject.entries()).map(([subject, value]) => ({
      subject,
      average: value.count ? value.totalPercentage / value.count : 0,
      assessments: value.count,
    }));
  }, [markRows]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Marks</h1>
          <p className="text-muted-foreground">Track subject-wise performance and overall average</p>
        </div>

        <Button variant="outline" onClick={fetchMarks}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overall Average</CardDescription>
            <CardTitle className="text-3xl">{loading ? '--' : `${overallAverage.toFixed(1)}%`}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Assessments</CardDescription>
            <CardTitle className="text-3xl">{loading ? '--' : markRows.length}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Subjects Covered</CardDescription>
            <CardTitle className="text-3xl">{loading ? '--' : subjectSummary.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subject-wise Summary</CardTitle>
          <CardDescription>Average score by subject</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading summary...</p>
          ) : subjectSummary.length === 0 ? (
            <p className="text-muted-foreground">No marks available yet.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {subjectSummary.map((subject) => (
                <div key={subject.subject} className="rounded-lg border p-4">
                  <p className="font-medium">{subject.subject}</p>
                  <p className="text-2xl font-bold mt-1">{subject.average.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">{subject.assessments} assessment(s)</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assessment Details</CardTitle>
          <CardDescription>All recorded marks</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading marks...</p>
          ) : markRows.length === 0 ? (
            <p className="text-muted-foreground">No marks published yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Assessment</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {markRows.map((mark) => (
                  <TableRow key={mark._id}>
                    <TableCell className="font-medium">{mark.subject}</TableCell>
                    <TableCell>{mark.assessment}</TableCell>
                    <TableCell>
                      {mark.score}/{mark.total}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          mark.percentage >= 75 ? 'default' : mark.percentage >= 60 ? 'secondary' : 'destructive'
                        }
                      >
                        {mark.percentage.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(mark.date).toLocaleDateString()}</TableCell>
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
