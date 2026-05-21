'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Eye, History, FileText, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SyllabusUpdate {
  _id: string;
  courseCode: string;
  courseName: string;
  documentType: string;
  currentVersion: string;
  submittedBy?: { name?: string };
  status: 'pending' | 'approved' | 'rejected' | 'revision-requested';
  effectiveDate?: string;
  reviewComments?: string;
  createdAt?: string;
  updatedAt?: string;
  changeLogs: Array<{
    version: string;
    changes: string;
    effectiveDate: string;
    updatedBy?: { name?: string };
  }>;
}

export default function CurriculumPage() {
  const [syllabusUpdates, setSyllabusUpdates] = useState<SyllabusUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUpdate, setSelectedUpdate] = useState<SyllabusUpdate | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [reviewComments, setReviewComments] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchSyllabusUpdates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/curriculum');
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to load curriculum updates');
      }

      setSyllabusUpdates(data.data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load curriculum updates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSyllabusUpdates();
  }, []);

  const updateReviewStatus = async (status: 'approved' | 'rejected' | 'revision-requested') => {
    if (!selectedUpdate) {
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/curriculum/${selectedUpdate._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          reviewComments,
          effectiveDate: selectedUpdate.effectiveDate,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update review status');
      }

      toast({
        title: status === 'approved' ? 'Document Approved' : status === 'rejected' ? 'Document Rejected' : 'Revision Requested',
        description:
          status === 'approved'
            ? 'The document has been approved.'
            : status === 'rejected'
              ? 'The document has been rejected.'
              : 'Revision request sent to submitter.',
        variant: status === 'rejected' ? 'destructive' : 'default',
      });

      setShowReviewDialog(false);
      setSelectedUpdate(null);
      setReviewComments('');
      fetchSyllabusUpdates();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update review status',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    await updateReviewStatus('approved');
  };

  const handleReject = async () => {
    await updateReviewStatus('rejected');
  };

  const handleRequestRevision = async () => {
    await updateReviewStatus('revision-requested');
  };

  const pendingCount = useMemo(
    () => syllabusUpdates.filter((update) => update.status === 'pending').length,
    [syllabusUpdates]
  );

  const approvedCount = useMemo(
    () => syllabusUpdates.filter((update) => update.status === 'approved').length,
    [syllabusUpdates]
  );

  const totalCount = syllabusUpdates.length;

  const handleReviewOpen = (update: SyllabusUpdate) => {
    setSelectedUpdate(update);
    setReviewComments(update.reviewComments || '');
    setShowReviewDialog(true);
  };

  const formatDisplayDate = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString();
  };

  const handleHistoryOpen = (update: SyllabusUpdate) => {
    setSelectedUpdate(update);
    setShowHistoryDialog(true);
  };

  const handleDialogClose = (open: boolean) => {
    setShowReviewDialog(open);
    if (!open) {
      setSelectedUpdate(null);
      setReviewComments('');
    }
  };

  const handleHistoryDialogClose = (open: boolean) => {
    setShowHistoryDialog(open);
    if (!open) {
      setSelectedUpdate(null);
    }
  };

  const getSubmittedByName = (update: SyllabusUpdate) => update.submittedBy?.name || 'Unknown';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending Review</Badge>;
      case 'approved':
        return <Badge>Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'revision-requested':
        return <Badge variant="outline">Revision Requested</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getDocTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      syllabus: 'bg-blue-100 text-blue-800',
      'lab-manual': 'bg-green-100 text-green-800',
      'reference-material': 'bg-purple-100 text-purple-800',
    };
    return <Badge className={colors[type] || ''}>{type.replace('-', ' ')}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Curriculum & Resources</h1>
        <p className="text-muted-foreground">Review and approve syllabus updates and course materials</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '--' : pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved This Month</CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '--' : approvedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '--' : totalCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Document Reviews</CardTitle>
          <CardDescription>Review and approve curriculum updates with version control</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
            <TabsContent value="pending" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Document Type</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {syllabusUpdates.filter((s) => s.status === 'pending').map((update) => (
                    <TableRow key={update._id}>
                      <TableCell>
                        <div className="font-medium">{update.courseCode}</div>
                        <div className="text-xs text-muted-foreground">{update.courseName}</div>
                      </TableCell>
                      <TableCell>{getDocTypeBadge(update.documentType)}</TableCell>
                      <TableCell>v{update.currentVersion}</TableCell>
                      <TableCell>{getSubmittedByName(update)}</TableCell>
                      <TableCell>{getStatusBadge(update.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReviewOpen(update)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleHistoryOpen(update)}
                          >
                            <History className="h-4 w-4 mr-1" />
                            History
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="approved" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Document Type</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Effective Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {syllabusUpdates.filter((s) => s.status === 'approved').map((update) => (
                    <TableRow key={update._id}>
                      <TableCell>
                        <div className="font-medium">{update.courseCode}</div>
                        <div className="text-xs text-muted-foreground">{update.courseName}</div>
                      </TableCell>
                      <TableCell>{getDocTypeBadge(update.documentType)}</TableCell>
                      <TableCell>v{update.currentVersion}</TableCell>
                      <TableCell>{formatDisplayDate(update.effectiveDate)}</TableCell>
                      <TableCell>{getStatusBadge(update.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleHistoryOpen(update)}
                        >
                          <History className="h-4 w-4 mr-1" />
                          History
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="all" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Document Type</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {syllabusUpdates.map((update) => (
                    <TableRow key={update._id}>
                      <TableCell>
                        <div className="font-medium">{update.courseCode}</div>
                        <div className="text-xs text-muted-foreground">{update.courseName}</div>
                      </TableCell>
                      <TableCell>{getDocTypeBadge(update.documentType)}</TableCell>
                      <TableCell>v{update.currentVersion}</TableCell>
                      <TableCell>{getStatusBadge(update.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleHistoryOpen(update)}
                        >
                          <History className="h-4 w-4 mr-1" />
                          History
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Document</DialogTitle>
            <DialogDescription>
              {selectedUpdate?.courseCode} - {selectedUpdate?.courseName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <h4 className="font-medium mb-2">Document Details</h4>
              <div className="text-sm space-y-1">
                <p>Type: {selectedUpdate?.documentType}</p>
                <p>Version: {selectedUpdate?.currentVersion}</p>
                <p>Submitted by: {selectedUpdate?.submittedBy?.name || 'Unknown'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Review Comments</label>
              <Textarea
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                placeholder="Add your review comments..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={handleRequestRevision} disabled={saving}>
              Request Revision
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={saving}>
              <X className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button onClick={handleApprove} disabled={saving}>
              <Check className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={handleHistoryDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change History</DialogTitle>
            <DialogDescription>
              Version history for {selectedUpdate?.courseCode}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedUpdate?.changeLogs.map((log, index) => (
              <div key={index} className="border-l-2 border-primary pl-4 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline">v{log.version}</Badge>
                  <span className="text-xs text-muted-foreground">{formatDisplayDate(log.effectiveDate)}</span>
                </div>
                <p className="text-sm">{log.changes}</p>
                <p className="mt-1 text-xs text-muted-foreground">Updated by {log.updatedBy?.name || 'Unknown'}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
