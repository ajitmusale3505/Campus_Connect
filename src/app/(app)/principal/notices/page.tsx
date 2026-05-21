'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Send, Eye, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/use-auth';

interface Notice {
  _id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  targetAudience: {
    departments?: string[];
    years?: number[];
    roles?: string[];
    specific?: string[];
  };
  isActive: boolean;
  createdAt: string;
}

export default function NoticesPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('medium');
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();

  const departments = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'IT', 'Chemical'];
  const years = [1, 2, 3, 4];
  const roles = ['student', 'teacher', 'hod'];

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notices');
      if (!res.ok) throw new Error('Failed to fetch notices');
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch notices');
      setNotices(data.data || []);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to load notices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleCreate = async () => {
    if (!title || !content || !category) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        title,
        content,
        category,
        priority,
        targetAudience: {
          departments: selectedDepts,
          years: selectedYears,
          roles: selectedRoles,
        },
      };

      const endpoint = editingNoticeId ? `/api/notices/${editingNoticeId}` : '/api/notices';
      const method = editingNoticeId ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save notice');

      toast({
        title: editingNoticeId ? "Notice Updated" : "Notice Created Successfully",
        description: editingNoticeId
          ? "Notice updated successfully"
          : "The notice has been published to target audience",
      });
      
      setShowCreateDialog(false);
      setEditingNoticeId(null);
      setTitle('');
      setContent('');
      setCategory('');
      setSelectedDepts([]);
      setSelectedYears([]);
      setSelectedRoles([]);
      
      // Refresh list
      fetchNotices();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to create notice",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (notice: Notice) => {
    setEditingNoticeId(notice._id);
    setTitle(notice.title);
    setContent(notice.content);
    setCategory(notice.category);
    setPriority(notice.priority);
    setSelectedDepts(notice.targetAudience?.departments || []);
    setSelectedYears(notice.targetAudience?.years || []);
    setSelectedRoles(notice.targetAudience?.roles || []);
    setShowCreateDialog(true);
  };

  const handleDelete = async (noticeId: string) => {
    try {
      const res = await fetch(`/api/notices/${noticeId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete notice');
      }

      toast({
        title: 'Notice Deleted',
        description: 'Notice removed successfully.',
      });

      fetchNotices();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete notice',
        variant: 'destructive',
      });
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, any> = {
      urgent: 'destructive',
      high: 'destructive',
      medium: 'secondary',
      low: 'outline',
    };
    return <Badge variant={variants[priority]}>{priority}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Notice Management</h1>
          <p className="text-muted-foreground">Create and manage college-wide circulars</p>
        </div>
        <Button onClick={() => {
          setEditingNoticeId(null);
          setTitle('');
          setContent('');
          setCategory('');
          setPriority('medium');
          setSelectedDepts([]);
          setSelectedYears([]);
          setSelectedRoles([]);
          setShowCreateDialog(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Create Notice
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Published Notices</CardTitle>
          <CardDescription>Manage all college communications</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="flex justify-center p-8">
               <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
             </div>
          ) : notices.length === 0 ? (
             <div className="text-center p-8 text-muted-foreground">
               No notices published yet.
             </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Target Audience</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notices.map((notice) => (
                  <TableRow key={notice._id}>
                    <TableCell className="font-medium">{notice.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{notice.category}</Badge>
                    </TableCell>
                    <TableCell className="capitalize">{getPriorityBadge(notice.priority)}</TableCell>
                    <TableCell className="max-w-[150px] truncate" title={[
                      ...(notice.targetAudience?.departments || []),
                      ...(notice.targetAudience?.years || []).map((year) => `Year ${year}`),
                      ...(notice.targetAudience?.roles || []),
                    ].join(', ') || 'All'}>
                      {[
                        ...(notice.targetAudience?.departments || []),
                        ...(notice.targetAudience?.years || []).map((year) => `Year ${year}`),
                        ...(notice.targetAudience?.roles || []),
                      ].join(', ') || 'All'}
                    </TableCell>
                    <TableCell>{new Date(notice.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge className="capitalize">{notice.isActive ? 'active' : 'inactive'}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(notice)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(notice._id)}>
                          Delete
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

      {/* Create Notice Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Notice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter notice title"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category *</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="administrative">Administrative</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="examination">Examination</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Content *</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter notice content..."
                rows={6}
              />
            </div>

            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium">Target Audience</h4>

              <div className="space-y-2">
                <label className="text-sm font-medium">Departments</label>
                <div className="grid grid-cols-3 gap-2">
                  {departments.map((dept) => (
                    <div key={dept} className="flex items-center space-x-2">
                      <Checkbox
                        id={dept}
                        checked={selectedDepts.includes(dept)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedDepts([...selectedDepts, dept]);
                          } else {
                            setSelectedDepts(selectedDepts.filter(d => d !== dept));
                          }
                        }}
                      />
                      <label htmlFor={dept} className="text-sm">{dept}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Year</label>
                <div className="flex gap-4">
                  {years.map((year) => (
                    <div key={year} className="flex items-center space-x-2">
                      <Checkbox
                        id={`year-${year}`}
                        checked={selectedYears.includes(year)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedYears([...selectedYears, year]);
                          } else {
                            setSelectedYears(selectedYears.filter(y => y !== year));
                          }
                        }}
                      />
                      <label htmlFor={`year-${year}`} className="text-sm">Year {year}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Roles</label>
                <div className="flex gap-4">
                  {roles.map((role) => (
                    <div key={role} className="flex items-center space-x-2">
                      <Checkbox
                        id={`role-${role}`}
                        checked={selectedRoles.includes(role)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedRoles([...selectedRoles, role]);
                          } else {
                            setSelectedRoles(selectedRoles.filter(r => r !== role));
                          }
                        }}
                      />
                      <label htmlFor={`role-${role}`} className="text-sm capitalize">{role}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {editingNoticeId ? 'Update Notice' : 'Publish Notice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

