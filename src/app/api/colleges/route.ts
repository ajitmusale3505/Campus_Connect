import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import College from '@/models/College';
import { ensureSppuAcademicSeedData } from '@/seed/sppuAcademicData';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    await ensureSppuAcademicSeedData();

    const { searchParams } = new URL(request.url);
    const universityId = searchParams.get('universityId');
    const query = universityId ? { universityId } : {};

    const colleges = await College.find(query).sort({ name: 1 }).lean();
    return NextResponse.json({ success: true, data: colleges });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
