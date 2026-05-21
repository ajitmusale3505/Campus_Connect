'use client';

import { useState, lazy, Suspense } from 'react';
import { CornerDownLeft, Loader2, Bot } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { ScrollArea } from '../ui/scroll-area';

// Lazy load AI chatbot function to reduce initial bundle
const loadAiChatbot = () => import('@/ai/flows/ai-chatbot-student').then(m => m.aiChatbotStudent);

interface Message {
    id: string;
    text: string;
    source: 'user' | 'ai';
}

export default function AiChatbot() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !user) return;

    const userMessage: Message = {
        id: `user-${Date.now()}`,
        text: inputValue,
        source: 'user'
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
        const aiChatbotStudent = await loadAiChatbot();
        const aiResponseText = await aiChatbotStudent({
            userId: user.id,
            message: inputValue,
        });

        const aiMessage: Message = {
            id: `ai-${Date.now()}`,
            text: aiResponseText,
            source: 'ai',
        };
        setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
        console.error(error);
        const errorMessage: Message = {
            id: `err-${Date.now()}`,
            text: 'Sorry, I am having trouble connecting. Please try again later.',
            source: 'ai'
        };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Bot /> AI Assistant
        </CardTitle>
        <CardDescription>
          Ask me anything about your courses, schedule, or college policies.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ScrollArea className="h-[200px] w-full rounded-md border p-4 space-y-4">
            {messages.length === 0 && (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                    No messages yet. Start the conversation!
                </div>
            )}
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex items-start gap-2 ${
                  message.source === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.source === 'ai' && <Bot className="h-5 w-5 flex-shrink-0 text-primary" />}
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 ${
                    message.source === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
                <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 flex-shrink-0 text-primary" />
                    <div className="bg-muted px-3 py-2 rounded-lg">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground"/>
                    </div>
                </div>
            )}
          </ScrollArea>
          <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
            <Input
              id="message"
              placeholder="Ask me anything..."
              className="flex-1"
              autoComplete="off"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()}>
              <CornerDownLeft className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
