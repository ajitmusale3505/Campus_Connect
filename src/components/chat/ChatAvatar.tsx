'use client';

import { User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ANONYMOUS_AVATAR } from '@/lib/chat-privacy';

type ChatAvatarProps = {
  sender: {
    name?: string;
    avatarUrl?: string;
  };
  isAnonymous?: boolean;
  className?: string;
};

export default function ChatAvatar({ sender, isAnonymous, className }: ChatAvatarProps) {
  const displayName = isAnonymous ? 'Anonymous' : sender.name || 'User';
  const imageUrl = isAnonymous ? ANONYMOUS_AVATAR : sender.avatarUrl;

  return (
    <div className="flex flex-col items-center gap-1">
      <Avatar className={className || 'h-8 w-8'}>
        <AvatarImage src={imageUrl} alt={displayName} />
        <AvatarFallback>
          {isAnonymous ? <User className="h-4 w-4 text-muted-foreground" /> : displayName.charAt(0)}
        </AvatarFallback>
      </Avatar>
      {isAnonymous && <span className="text-[10px] italic leading-none text-muted-foreground">Anonymous</span>}
    </div>
  );
}
