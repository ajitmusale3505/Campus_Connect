'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

type Grievance = {
  _id: string;
  subject: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'submitted' | 'under-review' | 'assigned' | 'in-progress' | 'resolved' | 'closed';
  submittedBy?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
};

const statusOptions: Array<Grievance['status']> = [
  'submitted',
  'under-review',
  'assigned',
  'in-progress',
  'resolved',
  'closed',
];

export default function PrincipalGrievancesPage() {
  const { toast } = useToast();
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchGrievances = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/grievances');
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch grievances');
      }

      setGrievances(data.data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch grievances',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrievances();
  }, []);

  const filteredGrievances = useMemo(
    () =>
      grievances.filter((grievance) => {
        const matchesStatus = statusFilter === 'all' || grievance.status === statusFilter;
        const keyword = search.toLowerCase();
        const matchesSearch =
          grievance.subject.toLowerCase().includes(keyword) ||
          grievance.description.toLowerCase().includes(keyword) ||
          grievance.category.toLowerCase().includes(keyword) ||
          (grievance.submittedBy?.name || '').toLowerCase().includes(keyword);

        return matchesStatus && matchesSearch;
      }),
    [grievances, search, statusFilter]
  );

  const updateStatus = async (id: string, status: Grievance['status']) => {
    try {
      setUpdatingId(id);
      const response = await fetch(`/api/grievances/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update grievance status');
      }

      setGrievances((prev) => prev.map((item) => (item._id === id ? { ...item, status } : item)));
      toast({ title: 'Success', description: 'Grievance status updated' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update grievance status',
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const severityVariant = (severity: Grievance['severity']) => {
    if (severity === 'critical' || severity === 'high') return 'destructive';
    if (severity === 'medium') return 'default';
    return 'outline';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Grievances</h1>
        <p className="text-muted-foreground">Review and resolve institutional grievances</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Grievance Queue</CardTitle>
          <CardDescription>Live grievance records with status controls</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              placeholder="Search by subject, description, category, submitter..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status} className="capitalize">
                    {status.replace('-', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <p className="text-muted-foreground">Loading grievances...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGrievances.map((grievance) => (
                  <TableRow key={grievance._id}>
                    <TableCell className="font-medium">{grievance.subject}</TableCell>
                    <TableCell className="capitalize">{grievance.category}</TableCell>
                    <TableCell>
                      <Badge variant={severityVariant(grievance.severity)} className="capitalize">
                        {grievance.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {grievance.status.replace('-', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{grievance.submittedBy?.name || 'Unknown'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {statusOptions.map((status) => (
                          <Button
                            key={status}
                            size="sm"
                            variant={grievance.status === status ? 'default' : 'outline'}
                            disabled={updatingId === grievance._id || grievance.status === status}
                            onClick={() => updateStatus(grievance._id, status)}
                            className="capitalize"
                          >
                            {status.replace('-', ' ')}
                          </Button>
                        ))}
                      </div>
                    </TableCell>
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
