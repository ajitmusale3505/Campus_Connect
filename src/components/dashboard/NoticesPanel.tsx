'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Notice = {
  _id: string;
  title: string;
  content: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  publishDate?: string;
  createdAt?: string;
};

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

function priorityVariant(priority: Notice['priority']) {
  if (priority === 'urgent' || priority === 'high') return 'destructive';
  if (priority === 'medium') return 'secondary';
  return 'outline';
}

export default function NoticesPanel({ viewAllHref, limit = 4 }: { viewAllHref: string; limit?: number }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notices');
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch notices');
      }

      const allNotices: Notice[] = Array.isArray(data.data) ? data.data : [];
      setNotices(allNotices.slice(0, limit));
    } catch (error) {
      console.error('Failed to load notices panel:', error);
      setNotices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
    const interval = setInterval(fetchNotices, 45000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notices</CardTitle>
        <CardDescription>Latest updates published by principal</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading notices...</p>
        ) : notices.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notices available right now.</p>
        ) : (
          notices.map((notice) => (
            <div key={notice._id} className="rounded-md border p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium leading-tight">{notice.title}</p>
                <Badge variant={priorityVariant(notice.priority)} className="capitalize">
                  {notice.priority}
                </Badge>
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{notice.content}</p>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span className="capitalize">{notice.category}</span>
                <span>{formatDate(notice.publishDate || notice.createdAt)}</span>
              </div>
            </div>
          ))
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href={viewAllHref}>View All Notices</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
