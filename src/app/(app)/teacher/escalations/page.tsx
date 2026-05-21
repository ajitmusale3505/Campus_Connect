'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

type Escalation = {
  _id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'assigned' | 'in-progress' | 'resolved' | 'closed';
  reportedBy?: {
    name: string;
    email: string;
  };
  createdAt: string;
};

export default function TeacherEscalationsPage() {
  const { toast } = useToast();
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  const updateStatus = async (escalationId: string, status: Escalation['status']) => {
    try {
      setUpdatingId(escalationId);
      const response = await fetch(`/api/escalations/${escalationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          notes: notesMap[escalationId] || '',
          activityAction: 'teacher-status-update',
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update escalation status');
      }

      toast({
        title: 'Status Updated',
        description: `Escalation moved to ${status}`,
      });

      fetchEscalations();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update escalation status',
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Assigned Escalations</h1>
        <p className="text-muted-foreground">Review and update escalation status for your assigned cases</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Assigned</CardDescription>
            <CardTitle className="text-3xl">{loading ? '--' : escalations.length}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Assigned</CardDescription>
            <CardTitle className="text-3xl">
              {loading ? '--' : escalations.filter((item) => item.status === 'assigned').length}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Progress</CardDescription>
            <CardTitle className="text-3xl">
              {loading ? '--' : escalations.filter((item) => item.status === 'in-progress').length}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Resolved</CardDescription>
            <CardTitle className="text-3xl">
              {loading ? '--' : escalations.filter((item) => item.status === 'resolved' || item.status === 'closed').length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Escalation Queue</CardTitle>
          <CardDescription>Only escalations assigned to you are shown</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading escalations...</p>
          ) : escalations.length === 0 ? (
            <p className="text-muted-foreground">No escalations assigned to you.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Updated Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {escalations.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                      </div>
                    </TableCell>
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
                    <TableCell>
                      <Badge variant={item.status === 'resolved' || item.status === 'closed' ? 'default' : 'secondary'}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.reportedBy?.name || 'Unknown'}</TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <Select
                          value={item.status}
                          onValueChange={(value) => updateStatus(item._id, value as Escalation['status'])}
                          disabled={updatingId === item._id}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="assigned">Assigned</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>

                        <Textarea
                          rows={2}
                          placeholder="Optional status note"
                          value={notesMap[item._id] || ''}
                          onChange={(event) =>
                            setNotesMap((previous) => ({
                              ...previous,
                              [item._id]: event.target.value,
                            }))
                          }
                        />

                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingId === item._id}
                          onClick={() => updateStatus(item._id, item.status)}
                        >
                          {updatingId === item._id ? 'Saving...' : 'Save Note'}
                        </Button>
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
