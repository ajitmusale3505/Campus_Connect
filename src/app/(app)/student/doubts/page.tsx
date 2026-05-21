'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, ThumbsUp, Paperclip, Send, TrendingUp, User } from "lucide-react";

interface Doubt {
  _id: string;
  question: string;
  subject: string;
  answers: Answer[];
  upvotes: number;
  createdAt: Date;
  isAnonymous: boolean;
}

interface Answer {
  _id: string;
  text: string;
  upvotes: number;
  createdAt: Date;
  isAnonymous: boolean;
  files?: string[];
}

export default function DoubtsPage() {
  const { toast } = useToast();
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDoubt, setNewDoubt] = useState({
    question: '',
    subject: '',
    isAnonymous: true,
  });
  const [selectedDoubt, setSelectedDoubt] = useState<string | null>(null);
  const [newAnswer, setNewAnswer] = useState('');

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
    } finally {
      setLoading(false);
    }
  };

  const handlePostDoubt = async () => {
    if (!newDoubt.question.trim() || !newDoubt.subject.trim()) {
      toast({
        title: "Error",
        description: "Please enter both question and subject",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/doubts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newDoubt,
          text: newDoubt.question, // Add text field to satisfy model requirements
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error || "Failed to post doubt",
          variant: "destructive",
        });
        return;
      }

      if (data.success) {
        toast({
          title: "Success",
          description: "Your doubt has been posted anonymously",
        });
        setNewDoubt({ question: '', subject: '', isAnonymous: true });
        fetchDoubts();
      }
    } catch (error) {
      console.error('Error posting doubt:', error);
      toast({
        title: "Error",
        description: "Failed to post doubt. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePostAnswer = async (doubtId: string) => {
    if (!newAnswer.trim()) {
      toast({
        title: "Error",
        description: "Please enter an answer",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/doubts/${doubtId}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: newAnswer,
          isAnonymous: true,
        }),
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

      if (data.success) {
        toast({
          title: "Success",
          description: "Your answer has been posted",
        });
        setNewAnswer('');
        setSelectedDoubt(null);
        fetchDoubts();
      }
    } catch (error) {
      console.error('Error posting answer:', error);
      toast({
        title: "Error",
        description: "Failed to post answer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpvote = async (doubtId: string, answerId?: string) => {
    try {
      const url = answerId 
        ? `/api/doubts/${doubtId}/answers/${answerId}/upvote`
        : `/api/doubts/${doubtId}/upvote`;
      
      const response = await fetch(url, { method: 'POST' });
      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error || "Failed to upvote",
          variant: "destructive",
        });
        return;
      }

      if (response.ok) {
        fetchDoubts();
        toast({
          title: "Success",
          description: "Upvoted successfully",
        });
      }
    } catch (error) {
      console.error('Error upvoting:', error);
      toast({
        title: "Error",
        description: "Failed to upvote. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Anonymous Peer Doubts</h1>
        <p className="text-muted-foreground">
          Ask questions and help your peers anonymously
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Doubts</CardDescription>
            <CardTitle className="text-3xl">{doubts.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Community questions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Resolved Today</CardDescription>
            <CardTitle className="text-3xl">
              {doubts.filter(d => d.answers.length > 0).length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Questions answered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Your Contribution</CardDescription>
            <CardTitle className="text-3xl">0</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Answers provided</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Post a New Doubt</CardTitle>
          <CardDescription>
            Your identity will remain anonymous. Only your peers can see this.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Subject (e.g., Data Structures, Physics, etc.)"
              value={newDoubt.subject}
              onChange={(e) => setNewDoubt({ ...newDoubt, subject: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Textarea
              placeholder="Describe your doubt in detail..."
              rows={4}
              value={newDoubt.question}
              onChange={(e) => setNewDoubt({ ...newDoubt, question: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Paperclip className="h-4 w-4 mr-2" />
                Attach File
              </Button>
            </div>
            
            <Button onClick={handlePostDoubt}>
              <Send className="h-4 w-4 mr-2" />
              Post Anonymously
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Recent Doubts</h2>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : doubts.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No doubts posted yet</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          doubts.map((doubt) => (
            <Card key={doubt._id}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">Anonymous Student</p>
                        <Badge variant="outline">{doubt.subject}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(doubt.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <p className="text-sm">{doubt.question}</p>
                      
                      <div className="flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUpvote(doubt._id)}
                        >
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          {doubt.upvotes} Upvotes
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedDoubt(
                            selectedDoubt === doubt._id ? null : doubt._id
                          )}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          {doubt.answers.length} Answers
                        </Button>
                      </div>
                    </div>
                  </div>

                  {selectedDoubt === doubt._id && (
                    <div className="ml-14 space-y-4 border-l-2 border-muted pl-4">
                      {doubt.answers.map((answer) => (
                        <div key={answer._id} className="space-y-2">
                          <div className="flex items-start gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 space-y-1">
                              <p className="text-sm font-medium">Anonymous Peer</p>
                              <p className="text-sm text-muted-foreground">{answer.text}</p>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpvote(doubt._id, answer._id)}
                              >
                                <TrendingUp className="h-3 w-3 mr-1" />
                                {answer.upvotes} Helpful
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="space-y-2">
                        <Textarea
                          placeholder="Write your answer..."
                          rows={3}
                          value={newAnswer}
                          onChange={(e) => setNewAnswer(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setSelectedDoubt(null);
                              setNewAnswer('');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button onClick={() => handlePostAnswer(doubt._id)}>
                            Post Answer
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
