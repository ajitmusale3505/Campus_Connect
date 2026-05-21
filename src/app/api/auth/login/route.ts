import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// POST - Login user
export async function POST(request: NextRequest) {
  try {
    console.log('=== Login Route: Starting ===');
    await dbConnect();
    console.log('=== Login Route: DB Connected ===');

    const body = await request.json();
    console.log('=== Login Route: Body received ===', { email: body.email });
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      console.log('=== Login Route: Validation failed ===', { hasEmail: !!email, hasPassword: !!password });
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user with password field
    console.log('=== Login Route: Finding user ===', { email: email.toLowerCase() });
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    console.log('=== Login Route: User found ===', { found: !!user, userId: user?._id });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check password
    console.log('=== Login Route: Comparing password ===');
    const isPasswordValid = await user.comparePassword(password);
    console.log('=== Login Route: Password comparison result ===', { isValid: isPasswordValid });
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    console.log('=== Login Route: Generating JWT ===');
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log('=== Login Route: JWT generated ===', { tokenLength: token.length });

    // Return user data without password
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      rollNumber: user.rollNumber,
      semester: user.semester,
      address: user.address,
      department: user.department,
    };

    const response = NextResponse.json(
      { 
        success: true, 
        data: { user: userResponse, token } 
      },
      { status: 200 }
    );

    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    console.log('=== Login Route: Success ===');
    return response;
  } catch (error: any) {
    console.error('=== Login error ===:', error);
    console.error('=== Login error stack ===:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}
