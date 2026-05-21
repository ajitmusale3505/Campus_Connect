import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Batch from '@/models/Batch';
import Subject from '@/models/Subject';
import User from '@/models/User';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';
import { getCurrentDbUser, hasDbRole } from '@/lib/current-user';

function batchCodeFor(subject: any, letter = 'A') {
  const shortSubject = String(subject.code || subject.name || 'SUB')
    .replace(/[^A-Z0-9]/gi, '')
    .slice(-3)
    .toUpperCase();
  return `${subject.branchCode}-SEM${subject.semester}-${shortSubject}-${letter}`.toUpperCase();
}

function nextLetter(index: number) {
  return String.fromCharCode('A'.charCodeAt(0) + index);
}

async function syncEligibleStudentsIntoBatch(batch: any, subject: any) {
  const students = await User.find({
    role: 'student',
    semester: subject.semester,
    ...(subject.collegeId ? { collegeId: subject.collegeId } : {}),
    ...(subject.departmentId ? { departmentId: subject.departmentId } : {}),
  }).select('_id');

  const studentIds = students.map((student) => student._id);

  if (studentIds.length > 0) {
    await Promise.all([
      Batch.findByIdAndUpdate(batch._id, { $addToSet: { studentIds: { $each: studentIds } } }),
      User.updateMany({ _id: { $in: studentIds } }, { $addToSet: { batchIds: batch._id } }),
    ]);
  }

  return Batch.findById(batch._id)
    .populate('subjectId', 'code name type credits hoursPerWeek semester year branchCode')
    .populate('teacherId', 'name email')
    .populate('studentIds', 'name email rollNumber enrollmentNumber');
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    const currentUser = await getCurrentDbUser(request);
    if (!currentUser) return unauthorizedResponse('User not found', 404);

    const { searchParams } = new URL(request.url);
    const query: Record<string, any> = {};

    for (const key of ['teacherId', 'departmentId', 'subjectId', 'collegeId']) {
      const value = searchParams.get(key);
      if (value) query[key] = value;
    }

    if (searchParams.get('mine') === 'true' && currentUser.role === 'teacher') {
      query.teacherId = currentUser._id;
    }

    const batches = await Batch.find(query)
      .populate('subjectId', 'code name type credits hoursPerWeek semester year branchCode')
      .populate('teacherId', 'name email')
      .populate('studentIds', 'name email rollNumber enrollmentNumber')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: batches });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const currentUser = await getCurrentDbUser(request);
    if (!currentUser) return unauthorizedResponse();
    if (!hasDbRole(currentUser, ['teacher', 'hod', 'principal'])) {
      return unauthorizedResponse('Only faculty can create batches', 403);
    }

    const body = await request.json();
    const subject = await Subject.findById(body.subjectId);
    if (!subject) {
      return NextResponse.json({ success: false, error: 'Subject not found' }, { status: 404 });
    }

    if (
      currentUser.role === 'teacher' &&
      Array.isArray(currentUser.subjectIds) &&
      currentUser.subjectIds.length > 0 &&
      !currentUser.subjectIds.some((id: any) => id.toString() === subject._id.toString())
    ) {
      return unauthorizedResponse('This subject is not assigned to the current teacher', 403);
    }

    const teacherId = body.teacherId || currentUser._id;
    const existingBatch = await Batch.findOne({
      subjectId: subject._id,
      teacherId,
      isActive: true,
    });

    if (existingBatch) {
      const syncedBatch = await syncEligibleStudentsIntoBatch(existingBatch, subject);
      return NextResponse.json({ success: true, data: syncedBatch, existing: true });
    }

    const requestedCode = String(body.batchCode || '').trim().toUpperCase();
    let batchCode = requestedCode;

    if (!batchCode) {
      for (let i = 0; i < 26; i += 1) {
        const candidate = batchCodeFor(subject, body.batchLetter || nextLetter(i));
        const exists = await Batch.exists({ batchCode: candidate });
        if (!exists) {
          batchCode = candidate;
          break;
        }
      }
    }

    if (!batchCode) {
      return NextResponse.json({ success: false, error: 'Could not generate a unique batch code' }, { status: 409 });
    }

    const batch = await Batch.create({
      batchCode,
      subjectId: subject._id,
      teacherId,
      departmentId: subject.departmentId,
      collegeId: subject.collegeId,
      year: subject.year,
      semester: subject.semester,
      academicYear: body.academicYear || '2024-25',
      maxStudents: body.maxStudents || 60,
      studentIds: [],
      isActive: body.isActive !== false,
    });

    const syncedBatch = await syncEligibleStudentsIntoBatch(batch, subject);

    return NextResponse.json({ success: true, data: syncedBatch }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
