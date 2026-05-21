import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthUser, hasRole, unauthorizedResponse } from '@/lib/auth';

// GET - Fetch all students
export async function GET(request: NextRequest) {
  try {
    console.log('=== Students API: Starting ===');
    await dbConnect();
    console.log('=== Students API: DB Connected ===');

    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    if (!hasRole(authUser, ['teacher', 'hod', 'principal'])) {
      return unauthorizedResponse('Forbidden', 403);
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'student';
    const department = searchParams.get('department');
    console.log('=== Students API: Query params ===', { role, department });

    // Build query
    const query: any = { role };
    if (department) {
      query.department = department;
    }

    const students = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    console.log('=== Students API: Found students ===', students.length);
    console.log('=== Students API: Sample student ===', students[0] ? { name: students[0].name, email: students[0].email } : 'none');

    return NextResponse.json({ 
      success: true, 
      data: students,
      count: students.length 
    });
  } catch (error: any) {
    console.error('=== Students API: Error ===', error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}
