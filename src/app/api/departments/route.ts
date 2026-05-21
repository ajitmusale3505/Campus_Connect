import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Department from '@/models/Department';
import { ensureSppuAcademicSeedData } from '@/seed/sppuAcademicData';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    await ensureSppuAcademicSeedData();

    const { searchParams } = new URL(request.url);
    const collegeId = searchParams.get('collegeId');
    const query = collegeId ? { collegeId } : {};

    const departments = await Department.find(query).sort({ code: 1 }).lean();
    return NextResponse.json({ success: true, data: departments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
