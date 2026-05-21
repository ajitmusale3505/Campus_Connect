import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import path from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';

export const runtime = 'nodejs';

function sanitizeFolder(folder: string) {
  return folder.replace(/[^a-zA-Z0-9_-]/g, '') || 'misc';
}

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const folderInput = String(formData.get('folder') || 'misc');
    const folder = sanitizeFolder(folderInput);

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'File is required' }, { status: 400 });
    }

    const maxSizeInBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      return NextResponse.json({ success: false, error: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    const extension = path.extname(file.name) || '.bin';
    const filename = `${Date.now()}-${randomUUID()}${extension}`;
    const uploadDirectory = path.join(process.cwd(), 'public', 'uploads', folder);
    const absolutePath = path.join(uploadDirectory, filename);

    await mkdir(uploadDirectory, { recursive: true });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(absolutePath, buffer);

    const url = `/uploads/${folder}/${filename}`;

    return NextResponse.json({
      success: true,
      data: {
        name: file.name,
        size: file.size,
        type: file.type,
        url,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
