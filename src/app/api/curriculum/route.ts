import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import SyllabusUpdate from '@/models/SyllabusUpdate';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';

const ALLOWED_DOC_TYPES = ['syllabus', 'lab-manual', 'reference-material', 'other'] as const;

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    if (!['teacher', 'hod', 'principal'].includes(authUser.role)) {
      return unauthorizedResponse('Forbidden', 403);
    }

    const query: Record<string, any> = {};
    if (authUser.role === 'teacher') {
      query.submittedBy = authUser.userId;
    }

    const updates = await SyllabusUpdate.find(query)
      .populate('submittedBy', 'name email department')
      .populate('reviewedBy', 'name email')
      .populate('changeLogs.updatedBy', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: updates });
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

    if (authUser.role !== 'teacher') {
      return unauthorizedResponse('Only teachers can submit curriculum updates', 403);
    }

    const body = await request.json();

    const courseCode = String(body.courseCode || '').trim().toUpperCase();
    const courseName = String(body.courseName || '').trim();
    const department = String(body.department || '').trim();
    const documentType = String(body.documentType || '').trim();
    const content = String(body.content || '').trim();
    const changes = String(body.changes || 'Initial submission').trim();
    const version = String(body.currentVersion || '1.0').trim();
    const semester = Number(body.semester);

    if (!courseCode || !courseName || !department || !documentType || !content || !Number.isFinite(semester)) {
      return NextResponse.json(
        { success: false, error: 'courseCode, courseName, department, semester, documentType, and content are required' },
        { status: 400 }
      );
    }

    if (!(ALLOWED_DOC_TYPES as readonly string[]).includes(documentType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid documentType' },
        { status: 400 }
      );
    }

    const effectiveDate = body.effectiveDate ? new Date(body.effectiveDate) : new Date();
    if (Number.isNaN(effectiveDate.getTime())) {
      return NextResponse.json({ success: false, error: 'Invalid effectiveDate' }, { status: 400 });
    }

    const attachments = Array.isArray(body.attachments)
      ? body.attachments.filter((item: unknown): item is string => typeof item === 'string' && item.trim().length > 0)
      : [];

    const update = await SyllabusUpdate.create({
      courseCode,
      courseName,
      department,
      semester,
      submittedBy: new mongoose.Types.ObjectId(authUser.userId),
      status: 'pending',
      documentType,
      currentVersion: version,
      content,
      attachments,
      changeLogs: [
        {
          version,
          changes,
          updatedBy: new mongoose.Types.ObjectId(authUser.userId),
          effectiveDate,
        },
      ],
    } as any);

    const populated = await SyllabusUpdate.findById(update._id)
      .populate('submittedBy', 'name email department')
      .populate('reviewedBy', 'name email')
      .populate('changeLogs.updatedBy', 'name email');

    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
