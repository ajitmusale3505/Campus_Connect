'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

type Milestone = {
  title: string;
  description?: string;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed' | 'delayed';
};

type Project = {
  _id: string;
  projectTitle: string;
  department?: string;
  batch?: string;
  students: Array<{ _id: string; name: string }>;
  guideId?: { _id: string; name: string } | string;
  coGuideId?: { _id: string; name: string } | string;
  status: string;
  statusLabel?: string;
  milestones?: Milestone[];
  presentationDate?: string;
};

function getStatusLabel(project: Project) {
  if (project.statusLabel) return project.statusLabel;
  if (project.status === 'ongoing') return 'active';
  if (project.status === 'proposed') return 'upcoming';
  return project.status;
}

function toDateInput(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export default function TeacherProjectsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingMilestones, setEditingMilestones] = useState<Milestone[]>([]);
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    dueDate: '',
    description: '',
  });

  const getProjectRole = (project: Project) => {
    const guideId = typeof project.guideId === 'string' ? project.guideId : project.guideId?._id;
    const coGuideId = typeof project.coGuideId === 'string' ? project.coGuideId : project.coGuideId?._id;

    if (user?.id && coGuideId === user.id) return 'Co-Guide';
    if (user?.id && guideId === user.id) return 'Guide';
    return 'Assigned';
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects');
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to load projects');
      }

      setProjects(data.data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load projects',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const openProgressDialog = (project: Project) => {
    setEditingProject(project);
    setEditingMilestones(
      (project.milestones || []).map((milestone) => ({
        ...milestone,
        dueDate: toDateInput(milestone.dueDate),
      }))
    );
    setNewMilestone({
      title: '',
      dueDate: '',
      description: '',
    });
  };

  const closeProgressDialog = () => {
    setEditingProject(null);
    setEditingMilestones([]);
    setNewMilestone({
      title: '',
      dueDate: '',
      description: '',
    });
  };

  const addMilestone = () => {
    if (!newMilestone.title.trim() || !newMilestone.dueDate) {
      toast({
        title: 'Missing Details',
        description: 'Milestone title and due date are required.',
        variant: 'destructive',
      });
      return;
    }

    setEditingMilestones((previous) => [
      ...previous,
      {
        title: newMilestone.title.trim(),
        description: newMilestone.description.trim(),
        dueDate: newMilestone.dueDate,
        status: 'pending',
      },
    ]);

    setNewMilestone({
      title: '',
      dueDate: '',
      description: '',
    });
  };

  const updateMilestoneStatus = (index: number, status: Milestone['status']) => {
    setEditingMilestones((previous) =>
      previous.map((milestone, milestoneIndex) =>
        milestoneIndex === index ? { ...milestone, status } : milestone
      )
    );
  };

  const removeMilestone = (index: number) => {
    setEditingMilestones((previous) => previous.filter((_, milestoneIndex) => milestoneIndex !== index));
  };

  const saveProgress = async () => {
    if (!editingProject) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/projects/${editingProject._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestones: editingMilestones.map((milestone) => ({
            ...milestone,
            dueDate: new Date(milestone.dueDate),
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update project progress');
      }

      toast({
        title: 'Progress Updated',
        description: 'Project milestones were updated successfully.',
      });

      closeProgressDialog();
      fetchProjects();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update project progress',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const summary = useMemo(() => {
    const active = projects.filter((project) => getStatusLabel(project) === 'active').length;
    const upcoming = projects.filter((project) => getStatusLabel(project) === 'upcoming').length;
    const completed = projects.filter((project) => getStatusLabel(project) === 'completed').length;

    return { active, upcoming, completed };
  }, [projects]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Allocated Projects</h1>
        <p className="text-muted-foreground">Projects where you are assigned as guide or co-guide</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-3xl">{loading ? '--' : summary.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Upcoming</CardDescription>
            <CardTitle className="text-3xl">{loading ? '--' : summary.upcoming}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl">{loading ? '--' : summary.completed}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Project List</CardTitle>
          <CardDescription>Auto-filtered from project allocations</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading projects...</p>
          ) : projects.length === 0 ? (
            <p className="text-muted-foreground">No projects allocated yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => {
                  const completedMilestones = (project.milestones || []).filter(
                    (milestone) => milestone.status === 'completed'
                  ).length;
                  const totalMilestones = project.milestones?.length || 0;
                  const progress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

                  return (
                    <TableRow key={project._id}>
                      <TableCell className="font-medium">{project.projectTitle}</TableCell>
                      <TableCell>{project.department || 'N/A'}</TableCell>
                      <TableCell>
                        {(project.students || []).map((student) => student.name).join(', ') || 'No students assigned'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getProjectRole(project)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 min-w-[120px]">
                          <Progress value={progress} className="h-2" />
                          <span className="text-xs text-muted-foreground">{progress.toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge>{getStatusLabel(project)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => openProgressDialog(project)}>
                          Update Progress
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingProject} onOpenChange={(open) => (!open ? closeProgressDialog() : undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Progress: {editingProject?.projectTitle}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-md border p-3">
              <p className="text-sm font-medium mb-2">Add Milestone</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="milestone-title">Title</Label>
                  <Input
                    id="milestone-title"
                    value={newMilestone.title}
                    onChange={(event) =>
                      setNewMilestone((previous) => ({ ...previous, title: event.target.value }))
                    }
                    placeholder="e.g. Module 1 Complete"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="milestone-due-date">Due Date</Label>
                  <Input
                    id="milestone-due-date"
                    type="date"
                    value={newMilestone.dueDate}
                    onChange={(event) =>
                      setNewMilestone((previous) => ({ ...previous, dueDate: event.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <Button size="sm" variant="outline" onClick={addMilestone}>Add</Button>
              </div>
            </div>

            <div className="space-y-2 max-h-[280px] overflow-auto">
              {editingMilestones.length === 0 ? (
                <p className="text-sm text-muted-foreground">No milestones yet. Add one to start tracking progress.</p>
              ) : (
                editingMilestones.map((milestone, index) => (
                  <div key={`${milestone.title}-${index}`} className="rounded-md border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-sm">{milestone.title}</p>
                        <p className="text-xs text-muted-foreground">Due: {toDateInput(milestone.dueDate) || '-'}</p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => removeMilestone(index)}>
                        Remove
                      </Button>
                    </div>
                    <div className="mt-2">
                      <Select
                        value={milestone.status}
                        onValueChange={(value) => updateMilestoneStatus(index, value as Milestone['status'])}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="delayed">Delayed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeProgressDialog}>Cancel</Button>
            <Button onClick={saveProgress} disabled={saving}>
              {saving ? 'Saving...' : 'Save Progress'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
