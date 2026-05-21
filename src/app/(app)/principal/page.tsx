'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  GraduationCap, 
  CalendarCheck, 
  AlertTriangle,
  Award,
  Building2 
} from "lucide-react";
import Link from "next/link";
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import StudentsList from "@/components/dashboard/StudentsList";
import { useToast } from '@/hooks/use-toast';

type StatsPayload = {
  counts: {
    students: number;
    faculty: number;
  };
  averages: {
    attendance: number;
    passRate: number;
    facultyUtilization: number;
  };
  departments: Array<{
    department: string;
    attendanceAvg: number;
    marksAvg: number;
    risk: 'low' | 'medium' | 'high';
  }>;
  trends: {
    attendance: Array<{ month: string; attendance: number }>;
    passRate: Array<{ month: string; rate: number }>;
  };
};

export default function PrincipalDashboard() {
  const { toast } = useToast();
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/stats');
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch dashboard stats');
      }

      setStats(data.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch dashboard stats',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const departmentRiskData = useMemo(
    () =>
      (stats?.departments || []).map((department) => ({
        dept: department.department,
        attendance: Number(department.attendanceAvg.toFixed(1)),
        passRate: Number(department.marksAvg.toFixed(1)),
        accreditationScore: Number(((department.attendanceAvg + department.marksAvg) / 2).toFixed(1)),
        risk: department.risk,
      })),
    [stats]
  );

  const attendanceTrend = stats?.trends.attendance || [];
  const passRateTrend = (stats?.trends.passRate || []).map((point) => ({ sem: point.month, rate: point.rate }));

  const atRiskDepartments = departmentRiskData.filter(d => d.risk === 'high' || d.risk === 'medium');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Executive Dashboard</h1>
        <p className="text-muted-foreground">College-level KPIs and predictive analytics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '--' : stats?.counts.students || 0}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500" /> Live enrollment count
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Faculty</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '--' : stats?.counts.faculty || 0}</div>
            <p className="text-xs text-muted-foreground">Teaching staff count</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '--' : `${stats?.averages.attendance.toFixed(1)}%`}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500" /> Average from attendance records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Pass Rate</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '--' : `${stats?.averages.passRate.toFixed(1)}%`}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500" /> Based on marks in database
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faculty Utilization</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '--' : `${stats?.averages.facultyUtilization.toFixed(1)}%`}</div>
            <p className="text-xs text-muted-foreground">Optimal range: 85-95%</p>
          </CardContent>
        </Card>
      </div>

      {/* Predictive Analytics - Risk Alert */}
      {atRiskDepartments.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Accreditation Risk Alert</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-2">
              {atRiskDepartments.map((dept, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="font-medium">{dept.dept}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={dept.risk === 'high' ? 'destructive' : 'secondary'}>
                      Score: {dept.accreditationScore}% | {dept.risk} risk
                    </Badge>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/principal/kpi">View Details</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Trend</CardTitle>
            <CardDescription>Monthly college-wide attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="attendance" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pass Rate Trend</CardTitle>
            <CardDescription>Semester-wise pass rate progression</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={passRateTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sem" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="rate" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Notices & Events</CardTitle>
            <CardDescription>Manage college communications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full" asChild>
              <Link href="/principal/notices">Create Notice</Link>
            </Button>
            <Button className="w-full" variant="outline" asChild>
              <Link href="/principal/events">Schedule Event</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Records & Reports</CardTitle>
            <CardDescription>Access student and faculty data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full" asChild>
              <Link href="/principal/records">View Records</Link>
            </Button>
            <Button className="w-full" variant="outline" asChild>
              <Link href="/principal/accreditation">Accreditation Reports</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Escalations</CardTitle>
            <CardDescription>Review complete escalation reports and statuses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full" asChild>
              <Link href="/principal/escalations">View Escalation Reports</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Students List Section */}
      <StudentsList />
    </div>
  );
}
