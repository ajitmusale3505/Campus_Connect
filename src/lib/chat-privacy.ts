const ANONYMOUS_AVATAR = '/assets/anonymous-avatar.svg';

function plain(value: any) {
  if (!value) return value;
  if (typeof value.toObject === 'function') return value.toObject();
  return value;
}

function anonymizeAuthor(author: any) {
  return {
    name: 'Anonymous',
    role: author?.role || 'student',
    avatarUrl: ANONYMOUS_AVATAR,
  };
}

export function sanitizeChatMessage(message: any) {
  const sanitized = plain(message);

  if (!sanitized) {
    return sanitized;
  }

  if (sanitized.isAnonymous) {
    sanitized.authorId = anonymizeAuthor(sanitized.authorId);
    if (sanitized.sender) {
      sanitized.sender = anonymizeAuthor(sanitized.sender);
    }
  }

  if (Array.isArray(sanitized.replies)) {
    sanitized.replies = sanitized.replies.map((reply: any) => {
      const cleanReply = plain(reply);
      if (cleanReply?.isAnonymous) {
        cleanReply.authorId = anonymizeAuthor(cleanReply.authorId);
      }
      return cleanReply;
    });
  }

  return sanitized;
}

export function sanitizeChatMessages(messages: any[]) {
  return messages.map(sanitizeChatMessage);
}

export { ANONYMOUS_AVATAR };
