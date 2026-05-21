'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, CornerDownLeft, ThumbsUp, User, Shield, MessageSquare, X } from 'lucide-react';
import type { ChatMessage, User as UserType } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const Message = ({ msg, currentUser }: { msg: ChatMessage; currentUser: UserType }) => {
    const isCurrentUser = msg.author.id === currentUser.id;
    const authorName = msg.author.anonymous ? 'Anonymous' : msg.author.name;

    return (
        <div className={cn("flex items-start gap-3", isCurrentUser && "justify-end")}>
            {!isCurrentUser && (
                <Avatar className="h-8 w-8">
                    <AvatarImage src={msg.author.avatarUrl} alt={authorName} />
                    <AvatarFallback>{authorName.charAt(0)}</AvatarFallback>
                </Avatar>
            )}
            <div className={cn("flex flex-col gap-1", isCurrentUser ? 'items-end' : 'items-start')}>
                <div className={cn(
                    "max-w-xs md:max-w-md lg:max-w-lg rounded-lg p-3 text-sm",
                    isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
                )}>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{authorName}</span>
                        {msg.author.role === 'teacher' && <Badge variant="secondary" className="bg-accent/20 text-accent"><Shield className="h-3 w-3 mr-1" />Teacher</Badge>}
                        {msg.author.anonymous && <Badge variant="outline"><User className="h-3 w-3 mr-1" />Anonymous</Badge>}
                    </div>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {msg.attachments.map((attachment, index) => (
                          <a
                            key={`${msg.id}-attachment-${index}`}
                            href={attachment.url}
                            target="_blank"
                            rel="noreferrer"
                            className={cn(
                              'block text-xs underline underline-offset-2',
                              isCurrentUser ? 'text-primary-foreground/90' : 'text-blue-600'
                            )}
                          >
                            {attachment.name}
                          </a>
                        ))}
                      </div>
                    )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                        <ThumbsUp className="h-3 w-3" />
                    </Button>
                    <span>{msg.upvotes}</span>
                </div>
            </div>
            {isCurrentUser && (
                <Avatar className="h-8 w-8">
                    <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
                    <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
            )}
        </div>
    )
}

export default function ChatWindow({
  roomName,
  messages,
  currentUser,
  onSendMessage,
}: {
  roomName: string;
  messages: ChatMessage[];
  currentUser: UserType;
  onSendMessage?: (
    text: string,
    isAnonymous: boolean,
    attachments?: { name: string; url: string; type: 'image' | 'pdf' | 'document' }[]
  ) => Promise<void>;
}) {
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<
    { name: string; url: string; type: 'image' | 'pdf' | 'document' }[]
  >([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageText.trim() && pendingAttachments.length === 0) || isSending || !onSendMessage) return;
    
    setIsSending(true);
    try {
      await onSendMessage(messageText, isAnonymous, pendingAttachments);
      setMessageText('');
      setPendingAttachments([]);
    } catch (error) {
      console.error('Failed to send message', error);
    } finally {
      setIsSending(false);
    }
  };

  const detectAttachmentType = (mimeType: string): 'image' | 'pdf' | 'document' => {
    if (mimeType.startsWith('image/')) {
      return 'image';
    }
    if (mimeType === 'application/pdf') {
      return 'pdf';
    }
    return 'document';
  };

  const handleAttachmentPick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAttachment(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'chat');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Attachment upload failed');
      }

      setPendingAttachments((previous) => [
        ...previous,
        {
          name: file.name,
          url: data.data.url,
          type: detectAttachmentType(file.type),
        },
      ]);
    } catch (error) {
      console.error('Failed to upload attachment', error);
    } finally {
      setUploadingAttachment(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const removePendingAttachment = (indexToRemove: number) => {
    setPendingAttachments((previous) => previous.filter((_, index) => index !== indexToRemove));
  };

  return (
    <Card className="flex flex-1 flex-col h-full overflow-hidden">
      <CardHeader className="py-3 px-4 shadow-sm z-10">
        <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5"/> {roomName}</CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 overflow-hidden relative">
        <ScrollArea className="h-full absolute inset-0 p-4">
          <div className="space-y-6 pb-4">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center p-8 text-muted-foreground text-sm">
                No messages yet. Be the first to start the conversation!
              </div>
            ) : (
              messages.map(msg => (
                <Message key={msg.id} msg={msg} currentUser={currentUser} />
              ))
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="flex-col items-start gap-4 border-t bg-muted/20 p-4">
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          {pendingAttachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {pendingAttachments.map((attachment, index) => (
                <div
                  key={`pending-${attachment.url}-${index}`}
                  className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs"
                >
                  <span className="max-w-[180px] truncate">{attachment.name}</span>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => removePendingAttachment(index)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="relative w-full">
            <Input 
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message..." 
              autoComplete="off"
              disabled={isSending || uploadingAttachment}
              className="pr-10"
            />
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleAttachmentPick}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              disabled={isSending || uploadingAttachment}
              onClick={() => fileInputRef.current?.click()}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch id="anonymous-mode" checked={isAnonymous} onCheckedChange={setIsAnonymous} disabled={isSending || uploadingAttachment} />
              <Label htmlFor="anonymous-mode" className="text-xs cursor-pointer">Post Anonymously</Label>
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={(!messageText.trim() && pendingAttachments.length === 0) || isSending || uploadingAttachment}
            >
              {uploadingAttachment ? 'Uploading...' : isSending ? 'Sending...' : 'Send'} <CornerDownLeft className="ml-2 h-3 w-3" />
            </Button>
          </div>
        </form>
      </CardFooter>
    </Card>
  );
}
