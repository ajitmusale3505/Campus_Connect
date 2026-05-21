'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

type EscalationStatus = 'open' | 'assigned' | 'in-progress' | 'resolved' | 'closed';
type EscalationPriority = 'low' | 'medium' | 'high' | 'critical';

type Escalation = {
  _id: string;
  title: string;
  description: string;
  category: string;
  priority: EscalationPriority;
  status: EscalationStatus;
  resolution?: string;
  reportedBy?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
};

const statusOptions: Array<'all' | EscalationStatus> = ['all', 'open', 'assigned', 'in-progress', 'resolved', 'closed'];
const priorityOptions: Array<'all' | EscalationPriority> = ['all', 'low', 'medium', 'high', 'critical'];

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const toLabel = (value: string) => value.replace('-', ' ');

export default function PrincipalEscalationsPage() {
  const { toast } = useToast();
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | EscalationStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | EscalationPriority>('all');

  const fetchEscalations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/escalations');
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch escalation reports');
      }

      setEscalations(data.data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch escalation reports',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEscalations();
  }, []);

  const filteredEscalations = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return escalations.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter;

      if (!keyword) {
        return matchesStatus && matchesPriority;
      }

      const matchesSearch =
        item.title.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword) ||
        item.category.toLowerCase().includes(keyword) ||
        (item.reportedBy?.name || '').toLowerCase().includes(keyword) ||
        (item.assignedTo?.name || '').toLowerCase().includes(keyword);

      return matchesStatus && matchesPriority && matchesSearch;
    });
  }, [escalations, search, statusFilter, priorityFilter]);

  const summary = useMemo(
    () => ({
      total: escalations.length,
      open: escalations.filter((item) => item.status === 'open').length,
      inProgress: escalations.filter((item) => item.status === 'assigned' || item.status === 'in-progress').length,
      resolved: escalations.filter((item) => item.status === 'resolved' || item.status === 'closed').length,
    }),
    [escalations]
  );

  const priorityVariant = (priority: EscalationPriority) => {
    if (priority === 'critical' || priority === 'high') return 'destructive';
    if (priority === 'medium') return 'secondary';
    return 'outline';
  };

  const statusVariant = (status: EscalationStatus) => {
    if (status === 'open') return 'destructive';
    if (status === 'assigned' || status === 'in-progress') return 'secondary';
    if (status === 'resolved') return 'default';
    return 'outline';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Escalation Reports</h1>
        <p className="text-muted-foreground">Complete view of submitted escalations across the campus</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Reports</CardDescription>
            <CardTitle className="text-3xl">{loading ? '--' : summary.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Open</CardDescription>
            <CardTitle className="text-3xl">{loading ? '--' : summary.open}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Progress</CardDescription>
            <CardTitle className="text-3xl">{loading ? '--' : summary.inProgress}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Resolved</CardDescription>
            <CardTitle className="text-3xl">{loading ? '--' : summary.resolved}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter escalation reports</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Input
            placeholder="Search by title, description, category, reporter, assignee..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | EscalationStatus)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status} className="capitalize">
                  {status === 'all' ? 'All Statuses' : toLabel(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={priorityFilter}
            onValueChange={(value) => setPriorityFilter(value as 'all' | EscalationPriority)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              {priorityOptions.map((priority) => (
                <SelectItem key={priority} value={priority} className="capitalize">
                  {priority === 'all' ? 'All Priorities' : priority}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Escalation Reports</CardTitle>
          <CardDescription>Detailed report list with latest status and ownership</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading escalation reports...</p>
          ) : filteredEscalations.length === 0 ? (
            <p className="text-muted-foreground">No escalation reports found for current filters.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reported By</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Resolution</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEscalations.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell>
                      <p className="font-medium">{item.title}</p>
                      <p className="max-w-[280px] truncate text-xs text-muted-foreground">{item.description}</p>
                    </TableCell>
                    <TableCell className="capitalize">{item.category}</TableCell>
                    <TableCell>
                      <Badge variant={priorityVariant(item.priority)} className="capitalize">
                        {item.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(item.status)} className="capitalize">
                        {toLabel(item.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.reportedBy?.name || 'Unknown'}</TableCell>
                    <TableCell>{item.assignedTo?.name || '-'}</TableCell>
                    <TableCell className="max-w-[240px] truncate">{item.resolution?.trim() || '-'}</TableCell>
                    <TableCell>{formatDate(item.updatedAt || item.createdAt)}</TableCell>
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
