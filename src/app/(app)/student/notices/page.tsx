'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type NoticePriority = 'low' | 'medium' | 'high' | 'urgent';
type NoticeCategory = 'academic' | 'administrative' | 'event' | 'examination' | 'general';

type Notice = {
  _id: string;
  title: string;
  content: string;
  priority: NoticePriority;
  category: NoticeCategory;
  publishDate?: string;
  createdAt?: string;
  createdBy?: {
    name?: string;
  };
};

const categoryOptions: Array<'all' | NoticeCategory> = [
  'all',
  'academic',
  'administrative',
  'event',
  'examination',
  'general',
];

const priorityOptions: Array<'all' | NoticePriority> = ['all', 'low', 'medium', 'high', 'urgent'];

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function priorityVariant(priority: NoticePriority) {
  if (priority === 'urgent' || priority === 'high') return 'destructive';
  if (priority === 'medium') return 'secondary';
  return 'outline';
}

export default function StudentNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | NoticeCategory>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | NoticePriority>('all');

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notices');
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch notices');
      }

      setNotices(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error('Failed to fetch student notices:', error);
      setNotices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const filteredNotices = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return notices.filter((notice) => {
      const categoryMatched = categoryFilter === 'all' || notice.category === categoryFilter;
      const priorityMatched = priorityFilter === 'all' || notice.priority === priorityFilter;

      if (!keyword) {
        return categoryMatched && priorityMatched;
      }

      const searchMatched =
        notice.title.toLowerCase().includes(keyword) ||
        notice.content.toLowerCase().includes(keyword) ||
        notice.category.toLowerCase().includes(keyword);

      return categoryMatched && priorityMatched && searchMatched;
    });
  }, [notices, search, categoryFilter, priorityFilter]);

  const summary = useMemo(
    () => ({
      total: notices.length,
      urgent: notices.filter((notice) => notice.priority === 'urgent').length,
      high: notices.filter((notice) => notice.priority === 'high').length,
      events: notices.filter((notice) => notice.category === 'event').length,
    }),
    [notices]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Notices</h1>
          <p className="text-muted-foreground">Official notices published for students</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/student/notifications">Open Notifications</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Notices</CardDescription>
            <CardTitle className="text-3xl">{loading ? '--' : summary.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Urgent</CardDescription>
            <CardTitle className="text-3xl">{loading ? '--' : summary.urgent}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>High Priority</CardDescription>
            <CardTitle className="text-3xl">{loading ? '--' : summary.high}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Events</CardDescription>
            <CardTitle className="text-3xl">{loading ? '--' : summary.events}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Notices</CardTitle>
          <CardDescription>Search by title/content and filter by category or priority</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Input
            placeholder="Search notices..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as 'all' | NoticeCategory)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((category) => (
                <SelectItem key={category} value={category} className="capitalize">
                  {category === 'all' ? 'All Categories' : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as 'all' | NoticePriority)}>
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
          <CardTitle>Latest Notices</CardTitle>
          <CardDescription>Showing notices targeted for your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading notices...</p>
          ) : filteredNotices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notices found for current filters.</p>
          ) : (
            filteredNotices.map((notice) => (
              <div key={notice._id} className="rounded-md border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{notice.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {notice.createdBy?.name ? `By ${notice.createdBy.name}` : 'By Principal'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">{notice.category}</Badge>
                    <Badge variant={priorityVariant(notice.priority)} className="capitalize">
                      {notice.priority}
                    </Badge>
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{notice.content}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Published on {formatDate(notice.publishDate || notice.createdAt)}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
