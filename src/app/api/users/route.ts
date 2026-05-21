import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthUser, hasRole, unauthorizedResponse } from '@/lib/auth';

// GET - Fetch all users or a specific user by ID
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const firebaseUid = searchParams.get('firebaseUid');
    const email = searchParams.get('email');
    const role = searchParams.get('role');
    const department = searchParams.get('department');
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit') || '100')));

    const canViewOthers = hasRole(authUser, ['teacher', 'hod', 'principal']);

    if (id) {
      const user = await User.findById(id).select('-password');
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      if (!canViewOthers && user._id.toString() !== authUser.userId) {
        return unauthorizedResponse('Forbidden', 403);
      }

      return NextResponse.json({ success: true, data: user });
    }

    if (firebaseUid) {
      const user = await User.findOne({ firebaseUid }).select('-password');
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      if (!canViewOthers && user._id.toString() !== authUser.userId) {
        return unauthorizedResponse('Forbidden', 403);
      }

      return NextResponse.json({ success: true, data: user });
    }

    if (email) {
      const user = await User.findOne({ email }).select('-password');
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      if (!canViewOthers && user._id.toString() !== authUser.userId) {
        return unauthorizedResponse('Forbidden', 403);
      }

      return NextResponse.json({ success: true, data: user });
    }

    const query: Record<string, any> = {};

    if (department) {
      query.department = department;
    }

    if (role) {
      query.role = role;
    }

    if (authUser.role === 'student') {
      query._id = authUser.userId;
    } else if (authUser.role === 'teacher') {
      if (role && role !== 'student') {
        return unauthorizedResponse('Teachers can only list students', 403);
      }
      query.role = 'student';
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await User.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create a new user
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    if (!hasRole(authUser, ['principal'])) {
      return unauthorizedResponse('Only principal can create users', 403);
    }

    const body = await request.json();

    const existingUser = await User.findOne({ email: body.email?.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    body.email = body.email?.toLowerCase();

    const user = new User(body);
    await user.save();

    return NextResponse.json({ success: true, data: { ...user.toObject(), password: undefined } }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// PUT - Update a user
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const isSelf = id === authUser.userId;
    if (!isSelf && !hasRole(authUser, ['hod', 'principal'])) {
      return unauthorizedResponse('Forbidden', 403);
    }

    if (updateData.role && !hasRole(authUser, ['principal'])) {
      return unauthorizedResponse('Only principal can update role', 403);
    }

    delete updateData.password;

    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// DELETE - Delete a user
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    if (!hasRole(authUser, ['principal'])) {
      return unauthorizedResponse('Only principal can delete users', 403);
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: {} });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
