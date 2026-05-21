import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// POST - Register new user
export async function POST(request: NextRequest) {
  try {
    console.log('=== Register Route: Starting ===');
    await dbConnect();
    console.log('=== Register Route: DB Connected ===');

    const body = await request.json();
    console.log('=== Register Route: Body received ===', { name: body.name, email: body.email, role: body.role });
    const { name, email, password, role } = body;

    // Validate input
    if (!name || !email || !password || !role) {
      console.log('=== Register Route: Validation failed ===', { name, email, hasPassword: !!password, role });
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    console.log('=== Register Route: Existing user check ===', { exists: !!existingUser });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Create new user
    console.log('=== Register Route: Creating user ===');
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
    });
    console.log('=== Register Route: User created ===', { userId: user._id, email: user.email });

    // Generate JWT token
    console.log('=== Register Route: Generating JWT ===');
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log('=== Register Route: JWT generated ===', { tokenLength: token.length });

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
      { status: 201 }
    );

    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    console.log('=== Register Route: Success ===');
    return response;
  } catch (error: any) {
    console.error('=== Register error ===:', error);
    console.error('=== Register error stack ===:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}
