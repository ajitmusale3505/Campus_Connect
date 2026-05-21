import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import LibraryResource from '@/models/LibraryResource';

// GET - Fetch library resources
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const subject = searchParams.get('subject');
    const search = searchParams.get('search');
    const tags = searchParams.get('tags');

    let query: any = {};

    if (type) {
      query.type = type;
    }
    if (subject) {
      query.subject = subject;
    }
    if (tags) {
      query.tags = { $in: tags.split(',') };
    }
    if (search) {
      query.$text = { $search: search };
    }

    const resources = await LibraryResource.find(query)
      .populate('uploadedBy', 'name email role')
      .sort({ uploadDate: -1 });

    return NextResponse.json({ success: true, data: resources });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create library resource
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const resource = await LibraryResource.create(body);

    const populatedResource = await LibraryResource.findById((resource as any)._id)
      .populate('uploadedBy', 'name email role');

    return NextResponse.json({ success: true, data: populatedResource }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// PUT - Update library resource
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { id, action, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Resource ID is required' }, { status: 400 });
    }

    let resource;

    if (action === 'incrementDownloads') {
      resource = await LibraryResource.findByIdAndUpdate(
        id,
        { $inc: { downloads: 1 } },
        { new: true }
      );
    } else {
      resource = await LibraryResource.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      });
    }

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: resource });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// DELETE - Delete library resource
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Resource ID is required' }, { status: 400 });
    }

    const resource = await LibraryResource.findByIdAndDelete(id);

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: {} });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
