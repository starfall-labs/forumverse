
'use client';

import type { Notification, User } from '@/lib/types';
import { NotificationType } from '@/lib/types';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { getUserByIdAction, markNotificationAsReadAction } from '@/actions/threadActions';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Users, ThumbsUp, ThumbsDown, FileText } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: Notification;
  currentUserId: string;
  onNotificationRead?: (notificationId: string) => void;
}

export function NotificationItem({ notification, currentUserId, onNotificationRead }: NotificationItemProps) {
  const { t } = useTranslation();
  const [actor, setActor] = useState<User | null>(null);
  const [isLoadingActor, setIsLoadingActor] = useState(true);

  useEffect(() => {
    async function fetchActor() {
      if (notification.actorId) {
        setIsLoadingActor(true);
        const fetchedActor = await getUserByIdAction(notification.actorId);
        setActor(fetchedActor || null);
        setIsLoadingActor(false);
      } else {
        setIsLoadingActor(false);
      }
    }
    fetchActor();
  }, [notification.actorId]);

  const handleMarkAsRead = async () => {
    if (!notification.isRead) {
      await markNotificationAsReadAction(notification.id, currentUserId);
      if (onNotificationRead) {
        onNotificationRead(notification.id);
      }
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case NotificationType.NEW_THREAD_FROM_FOLLOWED_USER:
        return <FileText className="h-5 w-5 text-primary" />;
      case NotificationType.NEW_COMMENT_ON_THREAD:
      case NotificationType.NEW_REPLY_TO_COMMENT:
        return <MessageCircle className="h-5 w-5 text-green-500" />;
      case NotificationType.USER_FOLLOWED_YOU:
        return <Users className="h-5 w-5 text-blue-500" />;
      case NotificationType.THREAD_UPVOTE:
      case NotificationType.COMMENT_UPVOTE:
        return <ThumbsUp className="h-5 w-5 text-accent" />;
      case NotificationType.THREAD_DOWNVOTE:
      case NotificationType.COMMENT_DOWNVOTE:
        return <ThumbsDown className="h-5 w-5 text-destructive" />;
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };
  
  const defaultText = notification.contentArgs?.defaultText || "Notification"; // Fallback for t()
  const translatedContent = t(notification.contentKey, defaultText, notification.contentArgs);

  return (
    <Card className={cn("overflow-hidden shadow-sm hover:shadow-md transition-shadow", !notification.isRead && "bg-primary/5 border-primary/20")}>
      <Link href={notification.link} passHref legacyBehavior>
        <a onClick={handleMarkAsRead} className="block hover:bg-muted/20 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 pt-1">
                {isLoadingActor && notification.actorId ? (
                  <div className="h-5 w-5 bg-muted rounded-full animate-pulse"></div>
                ) : actor ? (
                  <UserAvatar user={actor} className="h-8 w-8" />
                ) : (
                  <div className="p-1.5 bg-muted rounded-full">{getIcon()}</div>
                )}
              </div>
              <div className="flex-grow">
                <p className="text-sm text-foreground leading-snug">
                  {translatedContent}
                </p>
                <time dateTime={notification.createdAt} className="text-xs text-muted-foreground mt-1 block">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </time>
              </div>
              {!notification.isRead && (
                <div className="flex-shrink-0">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary" title={t('notifications.markUnread', 'Unread')}></span>
                </div>
              )}
            </div>
          </CardContent>
        </a>
      </Link>
    </Card>
  );
}
