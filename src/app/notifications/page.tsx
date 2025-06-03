
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { Notification } from '@/lib/types';
import { getNotificationsForUserAction, markAllNotificationsAsReadAction } from '@/actions/threadActions';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/hooks/useTranslation';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { BellRing, CheckCheck } from 'lucide-react';

export default function NotificationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (user) {
      setIsLoading(true);
      const fetchedNotifications = await getNotificationsForUserAction(user.id);
      setNotifications(fetchedNotifications);
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchNotifications();
    }
  }, [user, authLoading, router, fetchNotifications]);

  const handleNotificationRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
    // Potentially revalidate unread count in navbar if needed, or rely on next page load
  };

  const handleMarkAllAsRead = async () => {
    if (user) {
      await markAllNotificationsAsReadAction(user.id);
      fetchNotifications(); // Re-fetch to update UI
    }
  };
  
  if (authLoading || isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <Separator />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-grow space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Or a message prompting login, handled by redirect
  }

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-headline flex items-center">
          <BellRing className="mr-3 h-7 w-7 text-primary" />
          {t('notifications.pageTitle', 'Notifications')}
        </h1>
        {notifications.some(n => !n.isRead) && (
            <Button onClick={handleMarkAllAsRead} variant="outline" size="sm">
                <CheckCheck className="mr-2 h-4 w-4" />
                {t('notifications.markAllReadButton', 'Mark all as read')}
            </Button>
        )}
      </div>
      <Separator />
      {notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map(notification => (
            <NotificationItem 
              key={notification.id} 
              notification={notification} 
              currentUserId={user.id}
              onNotificationRead={handleNotificationRead}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-muted-foreground">{t('notifications.noNotifications', "You don't have any notifications yet.")}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
