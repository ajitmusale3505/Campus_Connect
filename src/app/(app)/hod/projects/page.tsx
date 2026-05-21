'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Calendar, Users, Award, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Project = {
  _id: string;
  projectTitle: string;
  students: Array<{ _id: string; name: string }>;
  guideId?: { _id: string; name: string };
  status: string;
  statusLabel?: string;
  milestones?: Array<{ status: string }>;
  grade?: number;
  presentationDate?: string;
};

type Teacher = {
  _id: string;
  name: string;
};

export default function ProjectsPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAllocationDialog, setShowAllocationDialog] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [allocating, setAllocating] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [createForm, setCreateForm] = useState({
    projectTitle: '',
    department: '',
    batch: '',
    description: '',
    guideId: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
    fetchTeachers();
  }, []);

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

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/users?role=teacher');
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to load teachers');
      }

      setTeachers(data.data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load teachers',
        variant: 'destructive',
      });
    }
  };

  const getStatusLabel = (project: Project) => {
    if (project.statusLabel) return project.statusLabel;
    if (project.status === 'ongoing') return 'active';
    if (project.status === 'proposed') return 'upcoming';
    return project.status;
  };

  const activeProjects = projects.filter((project) => getStatusLabel(project) === 'active');
  const completedProjects = projects.filter((project) => getStatusLabel(project) === 'completed');
  const upcomingProjects = projects.filter((project) => getStatusLabel(project) === 'upcoming');

  const seminars = useMemo(
    () =>
      upcomingProjects.map((project) => ({
        id: project._id,
        title: project.projectTitle,
        date: project.presentationDate ? new Date(project.presentationDate).toLocaleDateString() : 'TBD',
        speaker: project.guideId?.name || 'Guide not assigned',
        attendees: project.students?.length || 0,
      })),
    [upcomingProjects]
  );

  const averageGrade = completedProjects.length
    ? completedProjects.reduce((sum, project) => sum + Number(project.grade || 0), 0) / completedProjects.length
    : 0;

  const handleCreateProject = async () => {
    if (!createForm.projectTitle || !createForm.department || !createForm.batch || !createForm.description || !createForm.guideId) {
      toast({
        title: 'Missing Details',
        description: 'Please fill all required fields to create a project.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setCreating(true);
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectTitle: createForm.projectTitle,
          department: createForm.department,
          batch: createForm.batch,
          description: createForm.description,
          guideId: createForm.guideId,
          status: 'proposed',
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create project');
      }

      toast({ title: 'Project Created', description: 'New project created successfully.' });
      setShowCreateDialog(false);
      setCreateForm({
        projectTitle: '',
        department: '',
        batch: '',
        description: '',
        guideId: '',
      });
      fetchProjects();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create project',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleAllocateGuide = async () => {
    if (!selectedProjectId || !selectedTeacherId) {
      toast({
        title: 'Missing Selection',
        description: 'Please choose both project and guide.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setAllocating(true);
      const response = await fetch(`/api/projects/${selectedProjectId}/assign-guide`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId: selectedTeacherId }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to assign guide');
      }

      toast({ title: 'Guide Assigned', description: 'Project guide assigned successfully.' });
      setShowAllocationDialog(false);
      setSelectedProjectId('');
      setSelectedTeacherId('');
      fetchProjects();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign guide',
        variant: 'destructive',
      });
    } finally {
      setAllocating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Project & Seminar Oversight</h1>
          <p className="text-muted-foreground">Manage project allocations and seminar scheduling</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowAllocationDialog(true)}>
            Allocate Guide
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Project
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '--' : activeProjects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '--' : completedProjects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Seminars</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '--' : upcomingProjects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Grade</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '--' : `${averageGrade.toFixed(1)}%`}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="seminars">Seminars</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Allocations</CardTitle>
              <CardDescription>Track project progress and milestones</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Title</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Guide</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Milestones</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => {
                    const completedMilestones = (project.milestones || []).filter((milestone) => milestone.status === 'completed').length;
                    const totalMilestones = project.milestones?.length || 0;
                    const progress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

                    return (
                    <TableRow key={project._id}>
                      <TableCell className="font-medium">{project.projectTitle}</TableCell>
                      <TableCell>
                        <div className="text-sm">{(project.students || []).map((student) => student.name).join(', ') || 'No students assigned'}</div>
                      </TableCell>
                      <TableCell>{project.guideId?.name || 'Not Assigned'}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Progress value={progress} className="h-2" />
                          <span className="text-xs text-muted-foreground">{progress.toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {completedMilestones}/{totalMilestones}
                      </TableCell>
                      <TableCell>
                        <Badge>{getStatusLabel(project)}</Badge>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seminars" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Seminars</CardTitle>
              <CardDescription>Upcoming department seminars and presentations</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Speaker</TableHead>
                    <TableHead>Attendees</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {seminars.map((seminar) => (
                    <TableRow key={seminar.id}>
                      <TableCell className="font-medium">{seminar.title}</TableCell>
                      <TableCell>{seminar.date}</TableCell>
                      <TableCell>{seminar.speaker}</TableCell>
                      <TableCell>{seminar.attendees}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">View Details</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="projectTitle">Project Title</Label>
              <Input
                id="projectTitle"
                placeholder="Enter project title"
                value={createForm.projectTitle}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, projectTitle: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                placeholder="e.g. Computer Engineering"
                value={createForm.department}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, department: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch">Batch</Label>
              <Input
                id="batch"
                placeholder="e.g. 2025"
                value={createForm.batch}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, batch: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Guide</Label>
              <Select value={createForm.guideId} onValueChange={(value) => setCreateForm((prev) => ({ ...prev, guideId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Guide" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher._id} value={teacher._id}>{teacher.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief project description"
                value={createForm.description}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateProject} disabled={creating}>
              {creating ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAllocationDialog} onOpenChange={setShowAllocationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allocate Guide to Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select Project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project._id} value={project._id}>{project.projectTitle}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
              <SelectTrigger>
                <SelectValue placeholder="Select Guide" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher._id} value={teacher._id}>{teacher.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAllocationDialog(false)}>Cancel</Button>
            <Button onClick={handleAllocateGuide} disabled={allocating}>
              {allocating ? 'Allocating...' : 'Allocate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
