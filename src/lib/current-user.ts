import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import User from '@/models/User';

export async function getCurrentDbUser(request: NextRequest) {
  const authUser = getAuthUser(request);
  if (!authUser) {
    return null;
  }

  return User.findById(authUser.userId).select('-password');
}

export function hasDbRole(user: any, allowedRoles: string[]) {
  return !!user?.role && allowedRoles.includes(user.role);
}
