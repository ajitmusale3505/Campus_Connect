import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Material from '@/models/Material';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';

// GET - Fetch materials
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    console.log('=== Materials GET: Starting ===');

    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const subject = searchParams.get('subject');
    const classParam = searchParams.get('class');
    const search = searchParams.get('search');

    let query: any = {};

    if (teacherId) {
      query.teacherId = teacherId;
    }
    if (subject) {
      query.subject = subject;
    }
    if (classParam) {
      query.class = classParam;
    }
    if (search) {
      query.$text = { $search: search };
    }

    console.log('=== Materials GET: Query ===', query);

    const materials = await Material.find(query)
      .populate('teacherId', 'name email role')
      .sort({ uploadDate: -1 })
      .lean(); // Use lean() for better performance

    console.log('=== Materials GET: Found ===', materials.length);

    const response = NextResponse.json({ success: true, data: materials });
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    return response;
  } catch (error: any) {
    console.error('=== Materials GET: Error ===', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create material
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    console.log('=== Materials POST: Starting ===');

    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    // Only teachers can upload materials
    if (authUser.role !== 'teacher') {
      return unauthorizedResponse('Only teachers can upload materials', 403);
    }

    const body = await request.json();
    console.log('=== Materials POST: Body ===', body);

    // Add teacherId from authenticated user
    const materialData = {
      ...body,
      teacherId: authUser.userId,
    };

    const material = new Material(materialData);
    await material.save();
    console.log('=== Materials POST: Created ===', material._id);

    const populatedMaterial = await Material.findById(material._id)
      .populate('teacherId', 'name email role');

    return NextResponse.json({ success: true, data: populatedMaterial }, { status: 201 });
  } catch (error: any) {
    console.error('=== Materials POST: Error ===', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// PUT - Update material
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { id, action, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Material ID is required' }, { status: 400 });
    }

    let material;

    if (action === 'incrementViews') {
      material = await Material.findByIdAndUpdate(
        id,
        { $inc: { views: 1 } },
        { new: true }
      );
    } else {
      material = await Material.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      });
    }

    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: material });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// DELETE - Delete material
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Material ID is required' }, { status: 400 });
    }

    const material = await Material.findByIdAndDelete(id);

    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: {} });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
