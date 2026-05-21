'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/use-auth';
import { BookOpen, Download, QrCode } from 'lucide-react';

type Summary = {
  subject: { _id: string; code: string; name: string; type: string };
  batch?: { _id: string; batchCode: string } | null;
  teacher?: { name: string } | null;
  totalLectures: number;
  present: number;
  late: number;
  absent: number;
  attended: number;
  percentage: number;
};

function tone(percentage: number) {
  if (percentage >= 75) return 'text-green-600';
  if (percentage >= 60) return 'text-amber-600';
  return 'text-red-600';
}

export default function StudentAttendancePage() {
  const { user, refreshUser } = useAuth();
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshUser();
    fetch('/api/attendance/summary/me')
      .then((res) => res.json())
      .then((data) => setSummaries(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  const downloadQr = () => {
    if (!user?.qrCode) return;
    const a = document.createElement('a');
    a.href = user.qrCode;
    a.download = `${user.enrollmentNumber || user.name}-attendance-qr.png`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Attendance</h1>
          <p className="text-muted-foreground">Subject-wise attendance and QR code. Open View Details for the attendance calendar and full history.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><QrCode className="h-5 w-5" /> My Attendance QR</CardTitle>
          <CardDescription>Show this QR to your teacher during attendance scanning. Refresh the page once if you still see an older dense QR.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center">
          {user?.qrCode ? (
            <img src={user.qrCode} alt="Student attendance QR code" className="h-44 w-44 rounded-lg border bg-white p-2" />
          ) : (
            <div className="flex h-44 w-44 items-center justify-center rounded-lg border bg-muted text-center text-sm text-muted-foreground">
              QR code not generated. Re-register or ask admin to refresh profile.
            </div>
          )}
          <div className="space-y-2">
            <p className="font-medium">{user?.name}</p>
            <p className="text-sm text-muted-foreground">Enrollment: {user?.enrollmentNumber || '-'}</p>
            <p className="text-sm text-muted-foreground">Roll No: {user?.rollNumber || '-'}</p>
            <Button onClick={downloadQr} disabled={!user?.qrCode}>
              <Download className="mr-2 h-4 w-4" /> Download QR
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <Card><CardContent className="p-6 text-sm text-muted-foreground">Loading attendance...</CardContent></Card>
        ) : summaries.length === 0 ? (
          <Card><CardContent className="p-6 text-sm text-muted-foreground">No subjects or attendance records found for your semester.</CardContent></Card>
        ) : summaries.map((summary) => (
          <Card key={summary.subject._id} className="transition hover:-translate-y-1 hover:shadow-lg">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">{summary.subject.name}</CardTitle>
                  <CardDescription>{summary.subject.code} • {summary.batch?.batchCode || 'No active batch'}</CardDescription>
                </div>
                <Badge variant="outline">{summary.subject.type}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-2 flex items-end justify-between">
                  <span className={`text-3xl font-bold ${tone(summary.percentage)}`}>{summary.percentage}%</span>
                  <span className="text-sm text-muted-foreground">{summary.attended}/{summary.totalLectures} attended</span>
                </div>
                <Progress value={summary.percentage} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="rounded-md bg-muted p-2"><strong>{summary.present}</strong><br />Present</div>
                <div className="rounded-md bg-muted p-2"><strong>{summary.absent}</strong><br />Absent</div>
                <div className="rounded-md bg-muted p-2"><strong>{summary.late}</strong><br />Late</div>
              </div>
              <Button asChild className="w-full" variant="outline">
                <Link href={`/student/attendance/${summary.subject._id}`}>
                  <BookOpen className="mr-2 h-4 w-4" /> View Calendar & History
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
