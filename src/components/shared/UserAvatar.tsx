
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

  const getInitials = (user: User): string => {
    if (user.displayName) return user.displayName.charAt(0).toUpperCase();
    if (user.username) return user.username.charAt(0).toUpperCase();
    return user.email.charAt(0).toUpperCase();
  };
  
  const altText = user.displayName || user.username || user.email;

  return (
    <Avatar className={className}>
      <AvatarImage src={user.avatarUrl} alt={altText} data-ai-hint="user avatar" />
      <AvatarFallback>{getInitials(user)}</AvatarFallback>
    </Avatar>
  );
}
