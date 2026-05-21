import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { unauthorizedResponse } from '@/lib/auth';
import { getCurrentDbUser, hasDbRole } from '@/lib/current-user';

// GET - Fetch all students
export async function GET(request: NextRequest) {
  try {
    console.log('=== Students API: Starting ===');
    await dbConnect();
    console.log('=== Students API: DB Connected ===');

    const currentUser = await getCurrentDbUser(request);
    if (!currentUser) {
      return unauthorizedResponse();
    }

    if (!hasDbRole(currentUser, ['teacher', 'hod', 'principal'])) {
      return unauthorizedResponse('Forbidden', 403);
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'student';
    const department = searchParams.get('department');
    const departmentId = searchParams.get('departmentId');
    const semester = searchParams.get('semester');
    const batchId = searchParams.get('batchId');
    console.log('=== Students API: Query params ===', { role, department });

    // Build query
    const query: any = { role };
    if (department) {
      query.department = department;
    }
    if (departmentId) {
      query.departmentId = departmentId;
    }
    if (semester) {
      query.semester = Number(semester);
    }
    if (batchId) {
      query.batchIds = batchId;
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
