'use client';

import { useEffect, useMemo, useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Notice = {
  _id: string;
  title: string;
  content?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  publishDate?: string;
  createdAt?: string;
};

const priorityClass: Record<Notice['priority'], string> = {
  urgent: 'border-red-200 bg-red-600 text-white',
  high: 'border-red-200 bg-red-600 text-white',
  medium: 'border-amber-200 bg-amber-500 text-white',
  low: 'border-blue-200 bg-blue-600 text-white',
};

function formatDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function AnnouncementTicker() {
  const [notices, setNotices] = useState<Notice[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchNotices = async () => {
      try {
        const response = await fetch('/api/notices', { cache: 'no-store' });
        const result = await response.json();
        if (isMounted && result.success) {
          setNotices(result.data || []);
        }
      } catch (error) {
        console.error('Failed to load announcement ticker', error);
      }
    };

    fetchNotices();
    const interval = setInterval(fetchNotices, 5 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const tickerItems = useMemo(
    () =>
      notices
        .filter((notice) => ['urgent', 'high', 'medium', 'low'].includes(notice.priority))
        .slice(0, 8),
    [notices]
  );

  const fallbackItems: Notice[] = [
    {
      _id: 'fallback-exams',
      title: 'SPPU academic updates will appear here',
      priority: 'low',
      publishDate: new Date().toISOString(),
    },
  ];

  const items = tickerItems.length > 0 ? tickerItems : fallbackItems;

  return (
    <section
      aria-live="polite"
      className="flex h-9 min-w-0 flex-1 overflow-hidden rounded-md bg-[#1E3A5F] text-[13px] text-white shadow-sm"
    >
      <div className="flex shrink-0 items-center gap-2 border-r border-white/15 px-3">
        <GraduationCap className="h-4 w-4" />
        <span className="hidden whitespace-nowrap font-semibold lg:inline">Campus Connect</span>
      </div>
      <div className="group relative flex min-w-0 flex-1 items-center overflow-hidden">
        <div className="ticker-track flex min-w-max items-center gap-5 px-4 group-hover:[animation-play-state:paused]">
          {[...items, ...items].map((notice, index) => (
            <div key={`${notice._id}-${index}`} className="flex items-center gap-2 whitespace-nowrap">
              <Badge className={cn('h-5 rounded px-1.5 text-[10px] uppercase', priorityClass[notice.priority])}>
                {notice.priority === 'urgent' ? 'High' : notice.priority}
              </Badge>
              <span>{notice.title}</span>
              <span className="text-white/65">{formatDate(notice.publishDate || notice.createdAt)}</span>
              <span className="text-white/45">•</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
