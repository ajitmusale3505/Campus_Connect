'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function TestNotificationsPage() {
  const { toast } = useToast();
  const [userId, setUserId] = useState('');
  const [text, setText] = useState('');
  const [type, setType] = useState('info');
  const [category, setCategory] = useState('general');
  const [loading, setLoading] = useState(false);

  const createNotification = async () => {
    if (!userId || !text) {
      toast({
        title: "Error",
        description: "User ID and text are required",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          text,
          type,
          category,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Notification created successfully",
        });
        // Reset form
        setText('');
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create notification",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating notification:', error);
      toast({
        title: "Error",
        description: "Failed to create notification",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/notifications${userId ? `?userId=${userId}` : ''}`);
      const data = await response.json();
      
      if (data.success) {
        console.log('Notifications:', data.data);
        toast({
          title: "Success",
          description: `Found ${data.data.length} notifications`,
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch notifications",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch notifications",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Test Notifications</h1>
        <p className="text-muted-foreground">Create and test notifications</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Notification</CardTitle>
          <CardDescription>Push a test notification to a user</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">User ID *</label>
            <Input 
              placeholder="Enter MongoDB User ID (e.g., 507f1f77bcf86cd799439011)" 
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              You can find user IDs by checking the database or network requests after login
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Message *</label>
            <Textarea 
              placeholder="Notification message..." 
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="scholarship">Scholarship</SelectItem>
                  <SelectItem value="fee">Fee</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={createNotification} disabled={loading}>
              {loading ? "Creating..." : "Create Notification"}
            </Button>
            <Button onClick={fetchNotifications} variant="outline">
              Fetch Notifications
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">1. Login as any user (student, teacher, etc.)</p>
          <p className="text-sm">2. Open browser DevTools (F12) → Network tab</p>
          <p className="text-sm">3. Look for any API request and find the user ID in the response</p>
          <p className="text-sm">4. Copy the user ID and paste it in the "User ID" field above</p>
          <p className="text-sm">5. Create a notification and check the notifications page for that user</p>
          <p className="text-sm font-semibold mt-4">Alternative: Check console logs for notifications data</p>
        </CardContent>
      </Card>
    </div>
  );
}
