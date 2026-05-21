import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Batch from '@/models/Batch';
import Department from '@/models/Department';
import Notification from '@/models/Notification';
import jwt from 'jsonwebtoken';
import { generateStudentQrCode } from '@/lib/qr-attendance';
import { toUserResponse } from '@/lib/user-response';

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

    const academicPayload: Record<string, any> = {};
    const department = body.departmentId ? await Department.findById(body.departmentId) : null;

    if (['student', 'teacher', 'hod'].includes(role)) {
      academicPayload.universityId = body.universityId || undefined;
      academicPayload.collegeId = body.collegeId || undefined;
      academicPayload.departmentId = body.departmentId || undefined;
      academicPayload.department = department?.name || body.department || '';
    }

    if (role === 'student') {
      if (!body.universityId || !body.collegeId || !body.departmentId || !body.year || !body.semester || !body.rollNumber || !body.enrollmentNumber) {
        return NextResponse.json(
          { error: 'Students must select university, college, department, year, semester and enter roll/enrollment number' },
          { status: 400 }
        );
      }

      academicPayload.year = body.year;
      academicPayload.semester = Number(body.semester);
      academicPayload.rollNumber = body.rollNumber;
      academicPayload.enrollmentNumber = body.enrollmentNumber;
    }

    if (role === 'teacher') {
      academicPayload.subjectIds = Array.isArray(body.subjectIds) ? body.subjectIds : [];
      academicPayload.teachingSemesters = Array.isArray(body.teachingSemesters)
        ? body.teachingSemesters.map((semester: any) => Number(semester)).filter((semester: number) => semester >= 1 && semester <= 8)
        : [];
      academicPayload.year = body.year || undefined;
      academicPayload.semester = academicPayload.teachingSemesters[0] || (body.semester ? Number(body.semester) : undefined);
    }

    console.log('=== Register Route: Creating user ===');
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      ...academicPayload,
    });

    if (role === 'student') {
      const matchingBatches = await Batch.find({
        collegeId: user.collegeId,
        departmentId: user.departmentId,
        year: user.year,
        semester: user.semester,
        isActive: true,
      }).select('_id');

      user.batchIds = matchingBatches.map((batch) => batch._id);
      user.qrCode = await generateStudentQrCode({
        studentId: user._id.toString(),
        enrollmentNumber: user.enrollmentNumber || '',
        collegeId: user.collegeId?.toString(),
        departmentId: user.departmentId?.toString(),
      });
      await user.save();

      if (matchingBatches.length) {
        await Batch.updateMany(
          { _id: { $in: user.batchIds } },
          { $addToSet: { studentIds: user._id } }
        );
      }

      await Notification.create({
        userId: user._id,
        text: `Welcome to CampusConnect. You are registered for ${user.year} Semester ${user.semester}.`,
        type: 'success',
        category: 'general',
        link: '/student/attendance',
        read: false,
        timestamp: new Date(),
      });
    }

    if (role === 'hod' && user.departmentId) {
      await Department.findByIdAndUpdate(user.departmentId, { hodId: user._id });
    }
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
    const userResponse = toUserResponse(user);

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
