'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';

type RecordItem = {
  _id: string;
  date: string;
  timestamp: string;
  status: 'present' | 'absent' | 'late';
  teacherId?: { name: string };
  batchId?: { batchCode: string };
};

type Detail = {
  subject: { _id: string; code: string; name: string };
  totalLectures: number;
  present: number;
  late: number;
  absent: number;
  attended: number;
  percentage: number;
  requiredMoreLectures: number;
  records: RecordItem[];
};

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function AttendanceDetailPage({ params }: { params: { subjectId: string } }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [month, setMonth] = useState(() => new Date());

  useEffect(() => {
    fetch(`/api/attendance/summary/me/${params.subjectId}`)
      .then((res) => res.json())
      .then((data) => setDetail(data.data || null));
  }, [params.subjectId]);

  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [month]);

  const records = detail?.records || [];

  const exportCsv = () => {
    if (!detail) return;
    const rows = [
      ['Date', 'Day', 'Lecture No.', 'Status', 'Teacher', 'Timestamp'],
      ...records.map((record, index) => [
        new Date(record.date).toLocaleDateString(),
        new Date(record.date).toLocaleDateString(undefined, { weekday: 'long' }),
        records.length - index,
        record.status,
        record.teacherId?.name || '',
        new Date(record.timestamp).toLocaleString(),
      ]),
    ];
    const blob = new Blob([rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${detail.subject.code}_attendance.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!detail) {
    return <div className="p-6 text-muted-foreground">Loading attendance detail...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{detail.subject.name}</h1>
          <p className="text-muted-foreground">{detail.subject.code} attendance detail</p>
        </div>
        <Button onClick={exportCsv}><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
      </div>

      {detail.percentage < 75 && detail.totalLectures > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            Your attendance is below the required 75%. You need {detail.requiredMoreLectures} more lectures to be eligible.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardDescription>Attendance</CardDescription><CardTitle>{detail.percentage}%</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Total Lectures</CardDescription><CardTitle>{detail.totalLectures}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Present/Late</CardDescription><CardTitle>{detail.attended}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Absent</CardDescription><CardTitle>{detail.absent}</CardTitle></CardHeader></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Attendance Calendar</CardTitle>
              <CardDescription>{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 text-center text-sm">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <div key={day} className="font-medium text-muted-foreground">{day}</div>)}
            {days.map((day) => {
              const record = records.find((item) => sameDay(new Date(item.date), day));
              const isCurrentMonth = day.getMonth() === month.getMonth();
              const statusClass = record?.status === 'present' || record?.status === 'late'
                ? 'bg-green-100 text-green-800 border-green-300'
                : record?.status === 'absent'
                  ? 'bg-red-100 text-red-800 border-red-300'
                  : day.getDay() === 0
                    ? 'bg-slate-100 text-slate-500'
                    : 'bg-muted';
              return (
                <div key={day.toISOString()} title={record ? `${record.status} • ${new Date(record.timestamp).toLocaleString()}` : ''} className={`min-h-16 rounded-md border p-2 transition hover:scale-[1.02] ${statusClass} ${!isCurrentMonth ? 'opacity-40' : ''}`}>
                  <div className="font-semibold">{day.getDate()}</div>
                  {record && <div className="mt-1 text-xs capitalize">{record.status}</div>}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
          <CardDescription>Latest records first.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Lecture No.</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record, index) => (
                <TableRow key={record._id}>
                  <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(record.date).toLocaleDateString(undefined, { weekday: 'long' })}</TableCell>
                  <TableCell>{records.length - index}</TableCell>
                  <TableCell><Badge variant={record.status === 'absent' ? 'destructive' : 'secondary'}>{record.status}</Badge></TableCell>
                  <TableCell>{record.teacherId?.name || '-'}</TableCell>
                  <TableCell>{new Date(record.timestamp).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
