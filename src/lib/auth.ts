import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export type AuthRole = 'student' | 'teacher' | 'hod' | 'principal';

export interface AuthUser {
  userId: string;
  email?: string;
  role: AuthRole;
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export function getAuthToken(request: NextRequest): string | null {
  return request.cookies.get('auth-token')?.value || null;
}

export function getAuthUser(request: NextRequest): AuthUser | null {
  const token = getAuthToken(request);

  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

export function unauthorizedResponse(message = 'Unauthorized', status = 401) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function hasRole(user: AuthUser, allowedRoles: AuthRole[]) {
  return allowedRoles.includes(user.role);
}
