import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { toUserResponse } from '@/lib/user-response';
import { generateStudentQrCode } from '@/lib/qr-attendance';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// GET - Get current user
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      role: string;
    };

    // Get user from database
    const user = await User.findById(decoded.userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.role === 'student') {
      user.qrCode = await generateStudentQrCode({
        studentId: user._id.toString(),
        enrollmentNumber: user.enrollmentNumber || '',
        collegeId: user.collegeId?.toString(),
        departmentId: user.departmentId?.toString(),
      });
      await user.save();
    }

    // Return user data
    const userResponse = toUserResponse(user);

    return NextResponse.json(
      { success: true, data: userResponse },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get user error:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    );
  }
}
