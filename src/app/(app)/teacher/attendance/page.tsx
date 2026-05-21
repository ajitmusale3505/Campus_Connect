'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, CheckCircle, Download, QrCode, RefreshCw, Users } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

type Subject = { _id: string; code: string; name: string; semester: number; year: string; departmentId: string; collegeId: string };
type Batch = { _id: string; batchCode: string; subjectId: Subject; studentIds: Student[] };
type Student = { _id: string; name: string; email: string; rollNumber?: string; enrollmentNumber?: string };
type AttendanceHistory = {
  _id: string;
  date: string;
  timestamp: string;
  status: 'present' | 'absent' | 'late';
  markedVia?: string;
  studentId?: Student;
  teacherId?: { name: string; email?: string };
  subjectId?: Pick<Subject, '_id' | 'code' | 'name' | 'semester' | 'year'>;
  batchId?: { _id: string; batchCode: string };
};

const csvCell = (value: string | number | undefined) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export default function AttendancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeSessionRole, setActiveSessionRole] = useState<string | null | undefined>(undefined);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [manualAttendance, setManualAttendance] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [qrPayload, setQrPayload] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanLog, setScanLog] = useState<string[]>([]);
  const [scanBusy, setScanBusy] = useState(false);
  const [history, setHistory] = useState<AttendanceHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanBusyRef = useRef(false);
  const scannerId = 'qr-attendance-reader';

  const selectedSubject = subjects.find((subject) => subject._id === selectedSubjectId);
  const selectedBatch = batches.find((batch) => batch._id === selectedBatchId);
  const sessionToken = useMemo(() => crypto.randomUUID(), [selectedBatchId, selectedSubjectId, date]);
  const hasFacultySession = ['teacher', 'hod', 'principal'].includes(activeSessionRole || '');

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setActiveSessionRole(data?.data?.role || null))
      .catch(() => setActiveSessionRole(null));
  }, []);

  useEffect(() => {
    if (!user?.departmentId) return;
    const params = new URLSearchParams({ departmentId: user.departmentId });
    fetch(`/api/subjects?${params}`)
      .then((res) => res.json())
      .then((data) => {
        const loaded = data.data || [];
        const assigned = user.subjectIds?.length
          ? loaded.filter((subject: Subject) => user.subjectIds?.includes(subject._id))
          : loaded;
        setSubjects(assigned);
        if (assigned[0]) setSelectedSubjectId(assigned[0]._id);
      });
  }, [user?.departmentId, user?.subjectIds?.join(',')]);

  useEffect(() => {
    if (!selectedSubjectId) return;
    fetch(`/api/batches?subjectId=${selectedSubjectId}&mine=true`)
      .then((res) => res.json())
      .then((data) => {
        const loaded = data.data || [];
        setBatches(loaded);
        setSelectedBatchId(loaded[0]?._id || '');
      });
  }, [selectedSubjectId]);

  useEffect(() => {
    const batch = batches.find((item) => item._id === selectedBatchId);
    if (batch?.studentIds?.length) {
      setStudents(batch.studentIds);
      setManualAttendance(Object.fromEntries(batch.studentIds.map((student) => [student._id, 'present'])));
      return;
    }

    if (!selectedSubject || !user?.departmentId) return;
    const params = new URLSearchParams({
      role: 'student',
      departmentId: user.departmentId,
      semester: String(selectedSubject.semester),
    });
    fetch(`/api/students?${params}`)
      .then((res) => res.json())
      .then((data) => {
        const loaded = data.data || [];
        setStudents(loaded);
        setManualAttendance(Object.fromEntries(loaded.map((student: Student) => [student._id, 'present'])));
      });
  }, [selectedBatchId, selectedSubjectId, batches.length, user?.departmentId]);

  const fetchHistory = async () => {
    if (!hasFacultySession) return;
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams({ mine: 'true', limit: '300' });
      if (selectedSubjectId) params.set('subjectId', selectedSubjectId);
      if (selectedBatchId) params.set('batchId', selectedBatchId);
      if (date) params.set('date', date);
      const response = await fetch(`/api/attendance?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const data = await response.json();
      if (data.success) {
        setHistory(data.data || []);
      } else {
        toast({ title: 'History Load Failed', description: data.error, variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'History Load Failed', description: error.message || 'Could not load attendance history.', variant: 'destructive' });
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [hasFacultySession, selectedSubjectId, selectedBatchId, date]);

  const createBatch = async () => {
    if (!selectedSubjectId) return;
    const response = await fetch('/api/batches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subjectId: selectedSubjectId, academicYear: '2024-25' }),
    });
    const data = await response.json();
    if (data.success) {
      setBatches((prev) => [data.data, ...prev]);
      setSelectedBatchId(data.data._id);
      toast({ title: 'Batch Created', description: data.data.batchCode });
    } else {
      toast({ title: 'Could not create batch', description: data.error, variant: 'destructive' });
    }
  };

  const submitScan = async (payload = qrPayload) => {
    if (!hasFacultySession) {
      toast({
        title: 'Teacher login required',
        description: 'The active browser session is not a teacher/HOD/principal session. Please log out and log in as teacher again.',
        variant: 'destructive',
      });
      return;
    }

    if (!payload || !selectedBatchId || !selectedSubjectId || scanBusyRef.current) return;
    scanBusyRef.current = true;
    setScanBusy(true);
    try {
      const response = await fetch('/api/attendance/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrPayload: payload, sessionToken, batchId: selectedBatchId, subjectId: selectedSubjectId, date }),
      });
      const data = await response.json();
      if (data.success) {
        const studentName = data.data.student.name;
        setScanLog((prev) => [`${studentName} marked present`, ...prev].slice(0, 8));
        toast({ title: 'Attendance Marked', description: `${studentName} marked present.` });
        setQrPayload('');
        fetchHistory();
      } else {
        toast({
          title: 'Scan Failed',
          description: data.error === 'Students cannot mark their own attendance'
            ? 'Your active browser session is still a student account. Log out, then log in as teacher before scanning.'
            : data.error,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({ title: 'Scan Failed', description: error.message || 'Could not submit scan.', variant: 'destructive' });
    } finally {
      setTimeout(() => {
        scanBusyRef.current = false;
        setScanBusy(false);
      }, 900);
    }
  };

  const startScanner = async () => {
    try {
      setScanning(true);
      const scanner = new Html5Qrcode(scannerId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 8,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const edge = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.82);
            return { width: Math.max(260, edge), height: Math.max(260, edge) };
          },
          aspectRatio: 1,
          disableFlip: false,
        },
        async (decodedText) => {
          if (scanBusyRef.current) return;
          await submitScan(decodedText.trim());
        },
        () => {}
      );
    } catch (error: any) {
      setScanning(false);
      toast({ title: 'Camera unavailable', description: error.message || 'Use manual QR payload input instead.', variant: 'destructive' });
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
    }
    scannerRef.current = null;
    setScanning(false);
  };

  useEffect(() => () => {
    if (scannerRef.current?.isScanning) scannerRef.current.stop().catch(() => {});
  }, []);

  const saveManualAttendance = async () => {
    if (!selectedBatchId || !selectedSubjectId) return;
    const response = await fetch('/api/attendance/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        batchId: selectedBatchId,
        subjectId: selectedSubjectId,
        date,
        records: Object.entries(manualAttendance).map(([studentId, status]) => ({ studentId, status })),
      }),
    });
    const data = await response.json();
    if (data.success) {
      toast({ title: 'Attendance Saved', description: `${data.data.length} records updated.` });
      fetchHistory();
    } else {
      toast({ title: 'Save Failed', description: data.error, variant: 'destructive' });
    }
  };

  const exportStudentListCsv = () => {
    const rows = [
      ['Roll Number', 'Name', 'Email', 'Status'],
      ...students.map((student) => [
        student.rollNumber || '',
        student.name,
        student.email,
        manualAttendance[student._id] || 'absent',
      ]),
    ];
    const blob = new Blob([rows.map((row) => row.map(csvCell).join(',')).join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportHistoryCsv = () => {
    const rows = [
      ['Date', 'Day', 'Lecture No.', 'Student', 'Roll Number', 'Subject', 'Batch', 'Status', 'Marked Via', 'Teacher', 'Timestamp'],
      ...history.map((record, index) => [
        new Date(record.date).toLocaleDateString(),
        new Date(record.date).toLocaleDateString(undefined, { weekday: 'long' }),
        history.length - index,
        record.studentId?.name || '',
        record.studentId?.rollNumber || record.studentId?.enrollmentNumber || '',
        record.subjectId ? `${record.subjectId.code} - ${record.subjectId.name}` : '',
        record.batchId?.batchCode || '',
        record.status,
        record.markedVia || '',
        record.teacherId?.name || '',
        new Date(record.timestamp).toLocaleString(),
      ]),
    ];
    const blob = new Blob([rows.map((row) => row.map(csvCell).join(',')).join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_history_${date || 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {!hasFacultySession && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle>Teacher Session Required</CardTitle>
            <CardDescription>
              This scanner can only submit attendance from a teacher, HOD, or principal login. Your active session is {activeSessionRole === undefined ? 'checking...' : activeSessionRole || 'not signed in'}.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Take Attendance</h1>
          <p className="text-muted-foreground">QR scan and manual attendance for assigned SPPU batches.</p>
        </div>
        <Button variant="outline" onClick={exportHistoryCsv} disabled={history.length === 0}>
          <Download className="mr-2 h-4 w-4" /> Export History
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session Setup</CardTitle>
          <CardDescription>Select subject, batch, and date before scanning.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
            <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
            <SelectContent>{subjects.map((subject) => <SelectItem key={subject._id} value={subject._id}>Sem {subject.semester} • {subject.code} - {subject.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
            <SelectTrigger><SelectValue placeholder="Batch" /></SelectTrigger>
            <SelectContent>{batches.map((batch) => <SelectItem key={batch._id} value={batch._id}>{batch.batchCode}</SelectItem>)}</SelectContent>
          </Select>
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          <Button onClick={createBatch} disabled={!selectedSubjectId}>
            <Users className="mr-2 h-4 w-4" /> Create Batch
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="qr">
        <TabsList>
          <TabsTrigger value="qr">QR Scanner</TabsTrigger>
          <TabsTrigger value="manual">Manual Attendance</TabsTrigger>
          <TabsTrigger value="history">Attendance History</TabsTrigger>
        </TabsList>
        <TabsContent value="qr" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><QrCode className="h-5 w-5" /> Camera Scan</CardTitle>
                <CardDescription>Keep the student QR large, bright, and inside the square. New QR codes are simpler and scan faster.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div id={scannerId} className="min-h-[360px] overflow-hidden rounded-lg border bg-black/5" />
                <div className="flex gap-2">
                  <Button onClick={startScanner} disabled={scanning || !selectedBatchId || !hasFacultySession}><Camera className="mr-2 h-4 w-4" /> Start Camera</Button>
                  <Button variant="outline" onClick={stopScanner} disabled={!scanning}>Stop</Button>
                </div>
                <div className="flex gap-2">
                  <Input value={qrPayload} onChange={(event) => setQrPayload(event.target.value)} placeholder="Paste QR token if camera is unavailable" />
                  <Button onClick={() => submitScan()} disabled={!qrPayload || scanBusy || !hasFacultySession}>{scanBusy ? 'Marking...' : 'Mark'}</Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Scan Log</CardTitle>
                <CardDescription>Recent successful scans.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {scanLog.length === 0 ? <p className="text-sm text-muted-foreground">No scans yet.</p> : scanLog.map((item, index) => (
                  <div key={`${item}-${index}`} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" /> {item}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="manual" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual Attendance</CardTitle>
              <CardDescription>Use this for absent marking or when camera scanning is unavailable.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Present</TableHead>
                    <TableHead>Roll</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student._id}>
                      <TableCell>
                        <Checkbox
                          checked={manualAttendance[student._id] !== 'absent'}
                          onCheckedChange={(checked) => setManualAttendance((prev) => ({ ...prev, [student._id]: checked ? 'present' : 'absent' }))}
                        />
                      </TableCell>
                      <TableCell>{student.rollNumber || '-'}</TableCell>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell><Badge variant={manualAttendance[student._id] === 'absent' ? 'destructive' : 'secondary'}>{manualAttendance[student._id] || 'present'}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 flex justify-end">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={exportStudentListCsv} disabled={students.length === 0}>
                    <Download className="mr-2 h-4 w-4" /> Export Sheet
                  </Button>
                  <Button onClick={saveManualAttendance} disabled={!selectedBatchId || students.length === 0 || !hasFacultySession}>Save Manual Attendance</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle>Attendance History</CardTitle>
                  <CardDescription>Stored records for the selected subject, batch, and date.</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={fetchHistory} disabled={historyLoading}>
                    <RefreshCw className="mr-2 h-4 w-4" /> {historyLoading ? 'Loading' : 'Refresh'}
                  </Button>
                  <Button variant="outline" onClick={exportHistoryCsv} disabled={history.length === 0}>
                    <Download className="mr-2 h-4 w-4" /> Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Lecture No.</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Roll</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Marked Via</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground">
                        {historyLoading ? 'Loading attendance history...' : 'No attendance records for this selection.'}
                      </TableCell>
                    </TableRow>
                  ) : history.map((record, index) => (
                    <TableRow key={record._id}>
                      <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(record.date).toLocaleDateString(undefined, { weekday: 'long' })}</TableCell>
                      <TableCell>{history.length - index}</TableCell>
                      <TableCell className="font-medium">{record.studentId?.name || '-'}</TableCell>
                      <TableCell>{record.studentId?.rollNumber || record.studentId?.enrollmentNumber || '-'}</TableCell>
                      <TableCell>{record.subjectId ? `${record.subjectId.code} - ${record.subjectId.name}` : '-'}</TableCell>
                      <TableCell>{record.batchId?.batchCode || '-'}</TableCell>
                      <TableCell><Badge variant={record.status === 'absent' ? 'destructive' : 'secondary'}>{record.status}</Badge></TableCell>
                      <TableCell>{record.markedVia || '-'}</TableCell>
                      <TableCell>{new Date(record.timestamp).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
