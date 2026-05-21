import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ProjectAllocation from '@/models/ProjectAllocation';
import User from '@/models/User';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';

function mapFilterStatus(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === 'active') return 'ongoing';
  if (normalized === 'upcoming') return 'proposed';
  if (normalized === 'completed') return 'completed';
  return normalized;
}

function mapProjectStatus(status: string) {
  if (status === 'ongoing') return 'active';
  if (status === 'proposed') return 'upcoming';
  if (status === 'completed') return 'completed';
  return status;
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');

    const query: Record<string, any> = {};

    if (statusParam) {
      query.status = mapFilterStatus(statusParam);
    }

    if (authUser.role === 'student') {
      query.students = authUser.userId;
    } else if (authUser.role === 'teacher') {
      query.$or = [{ guideId: authUser.userId }, { coGuideId: authUser.userId }];
    } else if (authUser.role === 'hod') {
      const hod = await User.findById(authUser.userId).select('department');
      if (hod?.department) {
        query.department = hod.department;
      }
    }

    const projects = await ProjectAllocation.find(query)
      .populate('guideId', 'name email department')
      .populate('coGuideId', 'name email department')
      .populate('students', 'name email rollNumber semester department')
      .sort({ createdAt: -1 });

    const response = projects.map((project: any) => ({
      ...project.toObject(),
      projectId: project._id,
      statusLabel: mapProjectStatus(project.status),
    }));

    return NextResponse.json({ success: true, data: response });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    if (!['hod', 'principal'].includes(authUser.role)) {
      return unauthorizedResponse('Only HOD/Principal can create projects', 403);
    }

    const body = await request.json();
    const guideId = body.guideId || body.teacherId;

    if (!body.projectTitle || !body.department || !body.batch || !body.description || !guideId) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const teacher = await User.findById(guideId).select('role');
    if (!teacher || teacher.role !== 'teacher') {
      return NextResponse.json({ success: false, error: 'Invalid teacherId' }, { status: 400 });
    }

    const project = await ProjectAllocation.create({
      projectTitle: body.projectTitle,
      department: body.department,
      batch: body.batch,
      students: Array.isArray(body.students) ? body.students : [],
      guideId,
      coGuideId: body.coGuideId,
      description: body.description,
      techStack: Array.isArray(body.techStack) ? body.techStack : [],
      status: body.status || 'proposed',
      milestones: Array.isArray(body.milestones) ? body.milestones : [],
      submissionDate: body.submissionDate,
      presentationDate: body.presentationDate,
    });

    return NextResponse.json({ success: true, data: project }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
