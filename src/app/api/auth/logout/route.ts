import { NextRequest, NextResponse } from 'next/server';

// POST - Logout user
export async function POST(request: NextRequest) {
  const response = NextResponse.json(
    { success: true, message: 'Logged out successfully' },
    { status: 200 }
  );

  // Clear the auth cookie
  response.cookies.delete('auth-token');

  return response;
}
