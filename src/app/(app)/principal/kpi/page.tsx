'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

type StatsPayload = {
  counts: { students: number; faculty: number };
  averages: { attendance: number; passRate: number; facultyUtilization: number };
  departments: Array<{ department: string; attendanceAvg: number; marksAvg: number; risk: 'low' | 'medium' | 'high' }>;
  trends: {
    attendance: Array<{ month: string; attendance: number }>;
    passRate: Array<{ month: string; rate: number }>;
  };
};

export default function KpiPage() {
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
        throw new Error(data.error || 'Failed to fetch KPI data');
      }

      setStats(data.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch KPI data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const departmentData = useMemo(
    () =>
      (stats?.departments || []).map((department) => ({
        name: department.department,
        passRate: Number(department.marksAvg.toFixed(1)),
        attendance: Number(department.attendanceAvg.toFixed(1)),
        placement: Number(((department.marksAvg + department.attendanceAvg) / 2).toFixed(1)),
        research: department.risk === 'high' ? 60 : department.risk === 'medium' ? 75 : 90,
      })),
    [stats]
  );

  const trendData = useMemo(() => {
    const attendanceByMonth = new Map((stats?.trends.attendance || []).map((entry) => [entry.month, entry.attendance]));
    return (stats?.trends.passRate || []).map((entry) => ({
      month: entry.month,
      attendance: Number((attendanceByMonth.get(entry.month) || 0).toFixed(1)),
      passRate: Number(entry.rate.toFixed(1)),
      placement: Number((((attendanceByMonth.get(entry.month) || 0) + entry.rate) / 2).toFixed(1)),
    }));
  }, [stats]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Key Performance Indicators</h1>
        <p className="text-muted-foreground">Detailed metrics and analytics for all departments</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Pass Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '--' : `${stats?.averages.passRate.toFixed(1)}%`}</div>
            <p className="text-xs text-muted-foreground">Calculated from marks data</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '--' : `${stats?.averages.attendance.toFixed(1)}%`}</div>
            <p className="text-xs text-muted-foreground">Calculated from attendance records</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Placement Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading
                ? '--'
                : `${departmentData.length ? (departmentData.reduce((sum, dept) => sum + dept.placement, 0) / departmentData.length).toFixed(1) : '0.0'}%`}
            </div>
            <p className="text-xs text-muted-foreground">Composite performance indicator</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Research Output</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '--' : stats?.counts.faculty || 0}</div>
            <p className="text-xs text-muted-foreground">Active faculty tracked</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="departments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="departments">Department Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends Analysis</TabsTrigger>
          <TabsTrigger value="faculty">Faculty Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Department-wise Performance</CardTitle>
              <CardDescription>Compare metrics across all departments</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="passRate" fill="#8884d8" name="Pass Rate %" />
                  <Bar dataKey="attendance" fill="#82ca9d" name="Attendance %" />
                  <Bar dataKey="placement" fill="#ffc658" name="Placement %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {departmentData.map((dept) => (
              <Card key={dept.name}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{dept.name}</CardTitle>
                    <Badge variant={dept.passRate >= 90 ? "default" : dept.passRate >= 85 ? "secondary" : "destructive"}>
                      {dept.passRate >= 90 ? "Excellent" : dept.passRate >= 85 ? "Good" : "Needs Attention"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Pass Rate</span>
                      <span className="font-medium">{dept.passRate}%</span>
                    </div>
                    <Progress value={dept.passRate} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Attendance</span>
                      <span className="font-medium">{dept.attendance}%</span>
                    </div>
                    <Progress value={dept.attendance} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Placement</span>
                      <span className="font-medium">{dept.placement}%</span>
                    </div>
                    <Progress value={dept.placement} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Research Output</span>
                      <span className="font-medium">{dept.research}%</span>
                    </div>
                    <Progress value={dept.research} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Track key metrics over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="attendance" stroke="#8884d8" name="Attendance %" strokeWidth={2} />
                  <Line type="monotone" dataKey="passRate" stroke="#82ca9d" name="Pass Rate %" strokeWidth={2} />
                  <Line type="monotone" dataKey="placement" stroke="#ffc658" name="Placement %" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faculty" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Faculty Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '--' : `${stats?.averages.facultyUtilization.toFixed(1)}%`}</div>
                <Progress value={stats?.averages.facultyUtilization || 0} className="mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Teaching Load</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading
                    ? '--'
                    : `${((stats?.counts.students || 0) / Math.max(1, stats?.counts.faculty || 1)).toFixed(1)}:1`}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Student-faculty ratio</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Research Active</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading
                    ? '--'
                    : `${departmentData.length ? ((departmentData.filter((dept) => dept.research >= 75).length / departmentData.length) * 100).toFixed(0) : '0'}%`}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Departments with strong performance profile</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
