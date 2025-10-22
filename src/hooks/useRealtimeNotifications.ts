import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
}

interface UseRealtimeNotificationsProps {
  userId?: string;
  onNewNotification?: (notification: Notification) => void;
  enableSound?: boolean;
  enableToast?: boolean;
}

export const useRealtimeNotifications = ({
  userId,
  onNewNotification,
  enableSound = true,
  enableToast = true,
}: UseRealtimeNotificationsProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize notification sound
    if (enableSound && typeof window !== 'undefined') {
      audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audioRef.current.volume = 0.5;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [enableSound]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('realtime-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notification = payload.new as Notification;

          // Play notification sound
          if (enableSound && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch((error) => {
              console.error('Error playing notification sound:', error);
            });
          }

          // Show toast notification
          if (enableToast) {
            const toastVariant = notification.type === 'error' ? 'destructive' : 'default';
            
            toast({
              title: notification.title,
              description: notification.message,
              variant: toastVariant,
              duration: 5000,
            });
          }

          // Call custom callback
          if (onNewNotification) {
            onNewNotification(notification);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onNewNotification, enableSound, enableToast]);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((error) => {
        console.error('Error playing notification sound:', error);
      });
    }
  };

  return { playNotificationSound };
};