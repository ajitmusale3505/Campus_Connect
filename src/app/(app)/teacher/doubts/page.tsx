'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, MessageSquare, CheckCircle, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface Doubt {
  _id: string;
  question: string;
  text: string;
  subject?: string;
  timestamp: Date;
  upvotes: number;
  upvotedBy: string[];
  isResolved: boolean;
  resolvedBy?: any;
  answers: Array<{
    _id: string;
    text: string;
    upvotes: number;
    isAnonymous: boolean;
    authorId?: any;
    createdAt: Date;
  }>;
  isAnonymous: boolean;
  studentId?: any;
}

const DoubtItem = ({ doubt, onAnswerPosted, onResolve }: { 
  doubt: Doubt; 
  onAnswerPosted: () => void;
  onResolve: (doubtId: string) => void;
}) => {
  const [showReply, setShowReply] = useState(false);
  const [answer, setAnswer] = useState('');
  const [posting, setPosting] = useState(false);
  const { toast } = useToast();

  const handlePostAnswer = async () => {
    if (!answer.trim()) {
      toast({
        title: "Error",
        description: "Please enter an answer",
        variant: "destructive",
      });
      return;
    }

    try {
      setPosting(true);
      const response = await fetch(`/api/doubts/${doubt._id}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: answer, isAnonymous: false }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error || "Failed to post answer",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Your answer has been posted",
      });
      setAnswer('');
      setShowReply(false);
      onAnswerPosted();
    } catch (error) {
      console.error('Error posting answer:', error);
      toast({
        title: "Error",
        description: "Failed to post answer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPosting(false);
    }
  };

  const handleResolve = async () => {
    try {
      const response = await fetch(`/api/doubts/${doubt._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error || "Failed to resolve doubt",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Doubt marked as resolved",
      });
      onResolve(doubt._id);
    } catch (error) {
      console.error('Error resolving doubt:', error);
      toast({
        title: "Error",
        description: "Failed to resolve doubt. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">
                {doubt.isAnonymous ? 'Anonymous Student' : doubt.studentId?.name || 'Student'}
              </CardTitle>
              <CardDescription>
                {formatDistanceToNow(new Date(doubt.timestamp), { addSuffix: true })}
                {doubt.subject && <span className="ml-2">• {doubt.subject}</span>}
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant={doubt.isResolved ? "default" : "destructive"}>
              {doubt.isResolved ? 'Resolved' : 'Unresolved'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap">{doubt.question || doubt.text}</p>
        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <ThumbsUp className="h-4 w-4" />
            <span>{doubt.upvotes} Upvotes</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span>{doubt.answers?.length || 0} Answers</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4">
        {doubt.answers && doubt.answers.length > 0 && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="replies">
              <AccordionTrigger>View Answers ({doubt.answers.length})</AccordionTrigger>
              <AccordionContent className="space-y-4">
                {doubt.answers.map((ans) => (
                  <div key={ans._id} className="flex gap-3 bg-muted/50 rounded-lg p-4">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {ans.isAnonymous ? 'A' : ans.authorId?.name?.charAt(0) || 'T'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">
                          {ans.isAnonymous ? 'Anonymous' : ans.authorId?.name || 'Teacher'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(ans.createdAt), { addSuffix: true })}
                        </span>
                        {ans.upvotes > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            {ans.upvotes}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{ans.text}</p>
                    </div>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        <div className="flex gap-2 w-full">
          <Button variant="outline" onClick={() => setShowReply(!showReply)}>
            {showReply ? 'Cancel Reply' : 'Reply to this doubt'}
          </Button>
          {!doubt.isResolved && (
            <Button variant="secondary" onClick={handleResolve}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Resolved
            </Button>
          )}
        </div>

        {showReply && (
          <div className="w-full space-y-2">
            <Textarea
              placeholder="Type your answer here..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button 
                variant="secondary" 
                onClick={() => {
                  setShowReply(false);
                  setAnswer('');
                }}
              >
                Cancel
              </Button>
              <Button onClick={handlePostAnswer} disabled={posting}>
                {posting ? 'Posting...' : 'Post Answer'}
              </Button>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default function DoubtsPage() {
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'resolved'>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchDoubts();
  }, []);

  const fetchDoubts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/doubts');
      const data = await response.json();

      if (data.success) {
        setDoubts(data.data);
      }
    } catch (error) {
      console.error('Error fetching doubts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch doubts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = (doubtId: string) => {
    setDoubts(prev => 
      prev.map(d => d._id === doubtId ? { ...d, isResolved: true } : d)
    );
  };

  const filteredDoubts = doubts.filter(doubt => {
    if (filter === 'unresolved') return !doubt.isResolved;
    if (filter === 'resolved') return doubt.isResolved;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Student Doubts</h1>
          <p className="text-muted-foreground">
            View, answer, and resolve student questions.
          </p>
        </div>
        <Button variant="outline" onClick={fetchDoubts}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All ({doubts.length})
        </Button>
        <Button
          variant={filter === 'unresolved' ? 'default' : 'outline'}
          onClick={() => setFilter('unresolved')}
        >
          Unresolved ({doubts.filter(d => !d.isResolved).length})
        </Button>
        <Button
          variant={filter === 'resolved' ? 'default' : 'outline'}
          onClick={() => setFilter('resolved')}
        >
          Resolved ({doubts.filter(d => d.isResolved).length})
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredDoubts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold">No doubts found</p>
            <p className="text-sm text-muted-foreground">
              {filter === 'unresolved' 
                ? 'All doubts have been resolved!'
                : filter === 'resolved'
                ? 'No resolved doubts yet.'
                : 'Students will post their doubts here.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDoubts.map(doubt => (
            <DoubtItem 
              key={doubt._id} 
              doubt={doubt} 
              onAnswerPosted={fetchDoubts}
              onResolve={handleResolve}
            />
          ))}
        </div>
      )}
    </div>
  );
}
