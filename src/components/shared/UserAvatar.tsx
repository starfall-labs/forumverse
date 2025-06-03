import type { User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserAvatarProps {
  user: User | null | undefined;
  className?: string;
}

export function UserAvatar({ user, className }: UserAvatarProps) {
  if (!user) {
    return (
      <Avatar className={className}>
        <AvatarFallback>?</AvatarFallback>
      </Avatar>
    );
  }
  return (
    <Avatar className={className}>
      <AvatarImage src={user.avatarUrl} alt={user.email} data-ai-hint="user avatar" />
      <AvatarFallback>{user.email.charAt(0).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}
