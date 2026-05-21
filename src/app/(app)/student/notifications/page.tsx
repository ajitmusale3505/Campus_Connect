'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Bell, BellOff, Award, DollarSign, Calendar, AlertTriangle, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  _id: string;
  text: string;
  type: 'info' | 'warning' | 'success' | 'error';
  category: 'scholarship' | 'fee' | 'event' | 'general';
  timestamp: Date;
  read: boolean;
  link?: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications');
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        toast({
          title: "Success",
          description: "All notifications marked as read",
        });
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
        toast({
          title: "Deleted",
          description: "Notification deleted successfully",
        });
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const filterNotifications = (category: string) => {
    if (category === 'all') return notifications;
    return notifications.filter(n => n.category === category);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'scholarship':
        return <Award className="h-4 w-4" />;
      case 'fee':
        return <DollarSign className="h-4 w-4" />;
      case 'event':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'error':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const scholarshipCount = notifications.filter(n => n.category === 'scholarship' && !n.read).length;
  const feeCount = notifications.filter(n => n.category === 'fee' && !n.read).length;
  const eventCount = notifications.filter(n => n.category === 'event' && !n.read).length;

  const NotificationCard = ({ notification }: { notification: Notification }) => (
    <Card className={`${!notification.read ? 'border-l-4 border-l-primary' : ''}`}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-lg ${getTypeColor(notification.type)}`}>
            {getCategoryIcon(notification.category)}
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <p className={`text-sm ${!notification.read ? 'font-semibold' : ''}`}>
                  {notification.text}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(notification.timestamp).toLocaleString()}
                </p>
              </div>
              
              <Badge variant="outline" className="capitalize">
                {notification.category}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAsRead(notification._id)}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Mark as read
                </Button>
              )}
              {notification.link && (
                <Button variant="ghost" size="sm" asChild>
                  <a href={notification.link}>View Details</a>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteNotification(notification._id)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead}>
            <Check className="h-4 w-4 mr-2" />
            Mark All as Read
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Notifications</CardDescription>
            <CardTitle className="text-3xl">{notifications.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {unreadCount} unread
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Scholarships</CardDescription>
            <CardTitle className="text-3xl">{scholarshipCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              New opportunities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Fee Dues</CardDescription>
            <CardTitle className="text-3xl">{feeCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Payment reminders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Events</CardDescription>
            <CardTitle className="text-3xl">{eventCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Upcoming invites
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            All ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="scholarship">
            <Award className="h-4 w-4 mr-2" />
            Scholarships ({filterNotifications('scholarship').length})
          </TabsTrigger>
          <TabsTrigger value="fee">
            <DollarSign className="h-4 w-4 mr-2" />
            Fee Dues ({filterNotifications('fee').length})
          </TabsTrigger>
          <TabsTrigger value="event">
            <Calendar className="h-4 w-4 mr-2" />
            Events ({filterNotifications('event').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <BellOff className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No notifications yet</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filterNotifications('all').map((notification) => (
              <NotificationCard key={notification._id} notification={notification} />
            ))
          )}
        </TabsContent>

        <TabsContent value="scholarship" className="space-y-4 mt-6">
          {filterNotifications('scholarship').length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No scholarship notifications</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filterNotifications('scholarship').map((notification) => (
              <NotificationCard key={notification._id} notification={notification} />
            ))
          )}
        </TabsContent>

        <TabsContent value="fee" className="space-y-4 mt-6">
          {filterNotifications('fee').length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No fee notifications</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filterNotifications('fee').map((notification) => (
              <NotificationCard key={notification._id} notification={notification} />
            ))
          )}
        </TabsContent>

        <TabsContent value="event" className="space-y-4 mt-6">
          {filterNotifications('event').length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No event notifications</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filterNotifications('event').map((notification) => (
              <NotificationCard key={notification._id} notification={notification} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
