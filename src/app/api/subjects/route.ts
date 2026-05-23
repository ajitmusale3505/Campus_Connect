import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Subject from '@/models/Subject';
import { ensureSppuAcademicSeedData } from '@/seed/sppuAcademicData';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    await ensureSppuAcademicSeedData();

    const { searchParams } = new URL(request.url);
    const query: Record<string, any> = {};

    for (const key of ['departmentId', 'collegeId', 'branchCode', 'year']) {
      const value = searchParams.get(key);
      if (value) query[key] = value;
    }

    const semester = searchParams.get('semester');
    if (semester) query.semester = Number(semester);

    const subjects = await Subject.find(query).sort({ semester: 1, code: 1 }).lean();
    return NextResponse.json({ success: true, data: subjects });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
