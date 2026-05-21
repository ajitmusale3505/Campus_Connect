'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

const classWiseMarks = [
  { class: 'Sem 1', avg: 72, pass: 85, fail: 15 },
  { class: 'Sem 2', avg: 75, pass: 88, fail: 12 },
  { class: 'Sem 3', avg: 78, pass: 90, fail: 10 },
  { class: 'Sem 4', avg: 80, pass: 92, fail: 8 },
];

const batchComparison = [
  { batch: '2020-24', internal: 75, midTerm: 78, endSem: 80 },
  { batch: '2021-25', internal: 78, midTerm: 80, endSem: 82 },
  { batch: '2022-26', internal: 76, midTerm: 79, endSem: 81 },
  { batch: '2023-27', internal: 77, midTerm: 81, endSem: 83 },
];

export default function AnalyticsPage() {
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedBatch, setSelectedBatch] = useState('all');

  const exportReport = (type: string) => {
    // Mock export functionality
    const data = type === 'class' ? classWiseMarks : batchComparison;
    const csv = Object.keys(data[0]).join(',') + '\n' + 
                data.map(row => Object.values(row).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Performance Analytics</h1>
          <p className="text-muted-foreground">Comprehensive department performance insights</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dept Average</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">76.3%</div>
            <p className="text-xs text-muted-foreground">+2.4% from last semester</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">88.8%</div>
            <p className="text-xs text-muted-foreground">+1.2% from last semester</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performers</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">Students above 90%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Need Support</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Students below 50%</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="class" className="space-y-4">
        <TabsList>
          <TabsTrigger value="class">Class-wise Analysis</TabsTrigger>
          <TabsTrigger value="batch">Batch Comparison</TabsTrigger>
          <TabsTrigger value="subject">Subject Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="class" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Class-wise Internal Marks</CardTitle>
                <CardDescription>Semester-wise performance breakdown</CardDescription>
              </div>
              <Button variant="outline" onClick={() => exportReport('class')}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classWiseMarks}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="class" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avg" fill="hsl(var(--primary))" name="Average" />
                    <Bar dataKey="pass" fill="hsl(var(--chart-2))" name="Pass %" />
                    <Bar dataKey="fail" fill="hsl(var(--destructive))" name="Fail %" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batch" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Batch-wise Comparative Analysis</CardTitle>
                <CardDescription>Compare performance across different batches</CardDescription>
              </div>
              <Button variant="outline" onClick={() => exportReport('batch')}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={batchComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="batch" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="internal" stroke="hsl(var(--chart-1))" name="Internal" strokeWidth={2} />
                    <Line type="monotone" dataKey="midTerm" stroke="hsl(var(--chart-2))" name="Mid-Term" strokeWidth={2} />
                    <Line type="monotone" dataKey="endSem" stroke="hsl(var(--chart-3))" name="End-Sem" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subject" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subject-wise Performance</CardTitle>
              <CardDescription>Analysis by subject and topic</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Semesters</SelectItem>
                    <SelectItem value="1">Semester 1</SelectItem>
                    <SelectItem value="2">Semester 2</SelectItem>
                    <SelectItem value="3">Semester 3</SelectItem>
                    <SelectItem value="4">Semester 4</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-center text-muted-foreground py-8">
                  Subject-wise performance charts will be displayed here
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
