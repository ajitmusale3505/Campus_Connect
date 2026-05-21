'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

type Escalation = {
  _id: string;
  title: string;
  description: string;
  category: 'chat-abuse' | 'academic' | 'harassment' | 'technical' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'assigned' | 'in-progress' | 'resolved' | 'closed';
  assignedTo?: { _id: string; name: string };
  createdAt: string;
};

export default function StudentEscalationsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'academic',
    priority: 'medium',
  });

  const fetchEscalations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/escalations');
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch escalations');
      }

      setEscalations(data.data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch escalations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEscalations();
  }, []);

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Title and description are required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/escalations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create escalation');
      }

      toast({
        title: 'Escalation Submitted',
        description: 'Your escalation has been raised successfully.',
      });

      setFormData({
        title: '',
        description: '',
        category: 'academic',
        priority: 'medium',
      });

      fetchEscalations();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create escalation',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const summary = useMemo(() => {
    const open = escalations.filter((item) => item.status === 'open').length;
    const inProgress = escalations.filter((item) => item.status === 'assigned' || item.status === 'in-progress').length;
    const resolved = escalations.filter((item) => item.status === 'resolved' || item.status === 'closed').length;
    return { open, inProgress, resolved };
  }, [escalations]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Escalations</h1>
        <p className="text-muted-foreground">Raise issues and track their resolution status</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
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
          <CardTitle>Raise New Escalation</CardTitle>
          <CardDescription>Submit an issue to HOD for review and assignment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Issue title"
            value={formData.title}
            onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
          />

          <Textarea
            placeholder="Describe the issue in detail"
            value={formData.description}
            onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
          />

          <div className="grid gap-3 md:grid-cols-2">
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="academic">Academic</SelectItem>
                <SelectItem value="chat-abuse">Chat Abuse</SelectItem>
                <SelectItem value="harassment">Harassment</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, priority: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Raise Escalation'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Escalation History</CardTitle>
          <CardDescription>Track your submitted escalations</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading escalations...</p>
          ) : escalations.length === 0 ? (
            <p className="text-muted-foreground">No escalations raised yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {escalations.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell className="capitalize">{item.category}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.priority === 'critical' || item.priority === 'high'
                            ? 'destructive'
                            : item.priority === 'medium'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {item.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.assignedTo?.name || 'Unassigned'}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === 'resolved' || item.status === 'closed' ? 'default' : 'secondary'}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
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
