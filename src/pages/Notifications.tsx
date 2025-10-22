import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { Bell, BellOff, CheckCircle, AlertCircle, Info, AlertTriangle, Sparkles } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
  related_request_id: string | null;
}

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Enable real-time notifications with sound
  useRealtimeNotifications({
    userId: user?.id,
    onNewNotification: (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    },
    enableSound: true,
    enableToast: true,
  });

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data as Notification[] || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive"
      });
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notification => ({ ...notification, is_read: true }))
      );

      toast({
        title: "Success",
        description: "All notifications marked as read"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive"
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-white" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-white" />;
      case 'error':
        return <AlertCircle className="h-6 w-6 text-white" />;
      default:
        return <Info className="h-6 w-6 text-white" />;
    }
  };

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'from-green-500 to-emerald-500';
      case 'warning':
        return 'from-yellow-500 to-orange-500';
      case 'error':
        return 'from-red-500 to-pink-500';
      default:
        return 'from-blue-500 to-cyan-500';
    }
  };

  const getCardBorderGlow = (type: string, isRead: boolean) => {
    if (isRead) return '';
    switch (type) {
      case 'success':
        return 'border-green-500/50 shadow-lg shadow-green-500/20';
      case 'warning':
        return 'border-yellow-500/50 shadow-lg shadow-yellow-500/20';
      case 'error':
        return 'border-red-500/50 shadow-lg shadow-red-500/20';
      default:
        return 'border-blue-500/50 shadow-lg shadow-blue-500/20';
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Stylish Header with Gradient */}
      <div className="mb-8 p-6 rounded-xl bg-gradient-to-r from-primary via-purple-500 to-secondary relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIwLjUiIG9wYWNpdHk9IjAuMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
              <Bell className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                Notifications
                <Sparkles className="h-6 w-6 text-yellow-300 animate-pulse" />
              </h1>
              <p className="text-white/90 text-sm">Stay updated with all your activities</p>
            </div>
          </div>
          {unreadCount > 0 && (
            <div className="flex flex-col items-end gap-2">
              <Badge className="bg-white text-primary text-lg px-4 py-2 font-bold">
                {unreadCount} unread
              </Badge>
              <Button 
                onClick={markAllAsRead} 
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                Mark all as read
              </Button>
            </div>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <Card className="border-2 border-dashed border-muted-foreground/30 bg-muted/20">
          <CardContent className="text-center py-16">
            <div className="relative inline-block">
              <BellOff className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">No notifications yet</h3>
            <p className="text-muted-foreground">
              You're all caught up! New notifications will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`transition-all duration-300 hover:scale-[1.02] ${
                !notification.is_read
                  ? `border-2 ${getCardBorderGlow(notification.type, notification.is_read)} animate-scale-in`
                  : 'opacity-60 hover:opacity-100'
              } overflow-hidden`}
            >
              {!notification.is_read && (
                <div className={`h-1 bg-gradient-to-r ${getNotificationTypeColor(notification.type)}`}></div>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start space-x-4 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${getNotificationTypeColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg flex items-center flex-wrap gap-2">
                        <span className="break-words">{notification.title}</span>
                        {!notification.is_read && (
                          <Badge variant="secondary" className="text-xs animate-pulse bg-gradient-to-r from-primary to-secondary text-white border-0">
                            NEW
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {new Date(notification.created_at).toLocaleString()}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={`bg-gradient-to-r ${getNotificationTypeColor(notification.type)} text-white border-0 font-bold whitespace-nowrap`}>
                    {notification.type.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm mb-4 break-words">{notification.message}</p>
                {!notification.is_read && (
                  <Button
                    onClick={() => markAsRead(notification.id)}
                    size="sm"
                    className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as read
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;