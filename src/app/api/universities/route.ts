import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import University from '@/models/University';
import { ensureSppuAcademicSeedData } from '@/seed/sppuAcademicData';

export async function GET() {
  try {
    await dbConnect();
    await ensureSppuAcademicSeedData();

    const universities = await University.find().sort({ name: 1 }).lean();
    return NextResponse.json({ success: true, data: universities });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
