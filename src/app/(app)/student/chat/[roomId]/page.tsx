'use client';

import { useState, useEffect, useRef } from 'react';
import ChatWindow from "@/components/chat/ChatWindow";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function ChatRoomPage({ params }: { params: { roomId: string } }) {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [roomName, setRoomName] = useState("Loading...");
  
  // Use a ref to track the latest messages without triggering re-renders in setInterval
  const messagesRef = useRef<any[]>([]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/chat/${params.roomId}`);
      if (res.ok) {
        const data = await res.json();
        // Set room name based on roomId
        const name = params.roomId === 'general' ? 'General Doubts' : 
                     params.roomId === 'assignments' ? 'Assignment Help' : 
                     params.roomId === 'events' ? 'Event Discussion' : 'Chat Room';
        setRoomName(name);
        
        // Map db message format to ChatWindow format
        const formattedMessages = data.map((msg: any) => ({
          id: msg._id,
          text: msg.text,
          attachments: msg.attachments || [],
          timestamp: msg.timestamp,
          upvotes: msg.upvotes || 0,
          author: {
            id: msg.authorId?._id || 'unknown',
            name: msg.isAnonymous ? 'Anonymous' : (msg.authorId?.name || 'Unknown User'),
            role: msg.authorId?.role || 'student',
            avatarUrl: msg.isAnonymous ? 'https://picsum.photos/seed/anon/100/100' : (msg.authorId?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.authorId?.name || 'User')}&background=random`),
            anonymous: msg.isAnonymous
          },
          replies: msg.replies || [],
        }));
        
        // Only update if messages length changed to avoid constant re-renders
        if (formattedMessages.length !== messagesRef.current.length) {
          setMessages(formattedMessages);
          messagesRef.current = formattedMessages;
        }
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMessages();
      // Poll every 3 seconds for new messages
      const intervalId = setInterval(fetchMessages, 3000);
      return () => clearInterval(intervalId);
    }
  }, [user, params.roomId]);

  const handleSendMessage = async (
    text: string,
    isAnonymous: boolean,
    attachments: { name: string; url: string; type: 'image' | 'pdf' | 'document' }[] = []
  ) => {
    if (!user) return;
    
    // Optimistic update
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      text,
      attachments,
      timestamp: new Date().toISOString(),
      upvotes: 0,
      author: {
        id: user.id,
        name: isAnonymous ? 'Anonymous' : user.name,
        role: user.role,
        avatarUrl: isAnonymous ? 'https://picsum.photos/seed/anon/100/100' : (user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`),
        anonymous: isAnonymous
      },
      replies: []
    };
    
    setMessages(prev => [...prev, optimisticMsg]);
    
    try {
      const res = await fetch(`/api/chat/${params.roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          isAnonymous,
          attachments,
        })
      });
      
      if (!res.ok) throw new Error("Failed to send message");
      
      // Fetch latest messages from server to get real IDs
      fetchMessages();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      // Revert optimistic update 
      fetchMessages();
    }
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center p-8">Loading chat...</div>;
  }

  if (!user) {
    return <div className="flex h-full items-center justify-center p-8 text-muted-foreground">User not found. Please log in again.</div>;
  }

  const currentUser = {
    id: user.id || 'unknown',
    name: user.name,
    email: user.email || 'student@example.com',
    role: user.role,
    avatarUrl: user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`,
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <ChatWindow
        roomName={roomName}
        messages={messages}
        currentUser={currentUser}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
