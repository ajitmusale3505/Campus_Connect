import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Notice from '@/models/Notice';
import Notification from '@/models/Notification';
import User from '@/models/User';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';
import mongoose from 'mongoose';

type NoticeRole = 'student' | 'teacher' | 'hod' | 'principal';
type Audience = {
  departments: string[];
  years: number[];
  roles: NoticeRole[];
  specific: string[];
};

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function matchesDepartment(userDepartment: string, audienceDepartment: string): boolean {
  if (!userDepartment || !audienceDepartment) {
    return false;
  }

  if (userDepartment === audienceDepartment) {
    return true;
  }

  const aliases: Record<string, string[]> = {
    'computer science': ['cs', 'cse', 'computer science'],
    electronics: ['ece', 'electronics'],
    mechanical: ['me', 'mechanical'],
    civil: ['ce', 'civil'],
    it: ['it', 'information technology'],
    chemical: ['chemical', 'chem'],
  };

  const userAliases = aliases[userDepartment] || [userDepartment];
  const audienceAliases = aliases[audienceDepartment] || [audienceDepartment];

  return userAliases.some((alias) => audienceAliases.includes(alias));
}

function normalizeAudience(input: any): Audience {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { departments: [], years: [], roles: [], specific: [] };
  }

  const allowedRoles: NoticeRole[] = ['student', 'teacher', 'hod', 'principal'];

  return {
    departments: Array.isArray(input.departments) ? input.departments : [],
    years: Array.isArray(input.years) ? input.years.map((year: any) => Number(year)).filter(Number.isFinite) : [],
    roles: Array.isArray(input.roles)
      ? input.roles.filter((role: any): role is NoticeRole => allowedRoles.includes(role))
      : [],
    specific: Array.isArray(input.specific) ? input.specific : [],
  };
}

function userMatchesAudience(user: any, audience: Audience): boolean {
  const normalizedAudienceDepartments = (audience.departments || [])
    .map((department) => normalizeText(department))
    .filter((department) => department && department !== 'all' && department !== 'all departments');
  const normalizedUserDepartment = normalizeText(user.department);
  const normalizedUserSemester = Number(user.semester);

  const hasDeptFilter = normalizedAudienceDepartments.length > 0;
  const hasYearFilter = !!audience.years?.length;
  const hasRoleFilter = !!audience.roles?.length;
  const hasSpecificFilter = !!audience.specific?.length;

  if (!hasDeptFilter && !hasYearFilter && !hasRoleFilter && !hasSpecificFilter) {
    return true;
  }

  if (hasSpecificFilter && audience.specific?.includes(user._id.toString())) {
    return true;
  }

  if (hasRoleFilter && !audience.roles?.includes(user.role)) {
    return false;
  }

  if (hasDeptFilter && normalizedUserDepartment) {
    const departmentMatched = normalizedAudienceDepartments.some((department) =>
      matchesDepartment(normalizedUserDepartment, department)
    );
    if (!departmentMatched) {
      return false;
    }
  }

  if (hasYearFilter && Number.isFinite(normalizedUserSemester) && !audience.years?.includes(normalizedUserSemester)) {
    return false;
  }

  return true;
}

// GET - Fetch all notices
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    const currentUser = await User.findById(authUser.userId).select('_id role department semester');
    if (!currentUser) {
      return unauthorizedResponse('User not found', 404);
    }

    const notices = await Notice.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    const now = new Date();
    let filtered = notices.filter((notice) => {
      if (notice.isActive === false) {
        return false;
      }

      if (notice.publishDate && new Date(notice.publishDate) > now) {
        return false;
      }

      if (notice.expiryDate && new Date(notice.expiryDate) < now) {
        return false;
      }

      return true;
    });

    if (!['principal', 'hod'].includes(currentUser.role)) {
      filtered = filtered.filter((notice) =>
        userMatchesAudience(currentUser, normalizeAudience((notice as any).targetAudience))
      );
    }

    return NextResponse.json({ success: true, data: filtered });
  } catch (error) {
    console.error('Error fetching notices:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notices' },
      { status: 500 }
    );
  }
}

// POST - Create new notice
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    if (authUser.role !== 'principal') {
      return unauthorizedResponse('Only principal can create notices', 403);
    }

    const body = await request.json();
    const audience = normalizeAudience(body.targetAudience);

    const noticePayload = {
      title: body.title,
      content: body.content,
      category: body.category,
      priority: body.priority || 'medium',
      targetAudience: {
        departments: audience.departments,
        years: audience.years,
        roles: audience.roles,
        specific: audience.specific
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
          .map((id) => new mongoose.Types.ObjectId(id)),
      },
      publishDate: body.publishDate ? new Date(body.publishDate) : new Date(),
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined,
      attachments: Array.isArray(body.attachments) ? body.attachments : [],
      isActive: body.isActive !== false,
      createdBy: authUser.userId,
    };
    
    const notice = await Notice.create(noticePayload);

    const potentialRecipients = await User.find({ role: { $in: ['student', 'teacher', 'hod'] } }).select(
      '_id role department semester'
    );

    const recipients = potentialRecipients.filter((user) => userMatchesAudience(user, audience));

    const notificationLinkByRole: Record<NoticeRole, string> = {
      student: '/student/notices',
      teacher: '/teacher/notifications',
      hod: '/hod/notifications',
      principal: '/principal/notifications',
    };

    if (recipients.length > 0) {
      await Notification.insertMany(
        recipients.map((user) => ({
          userId: user._id,
          text: `New notice: ${notice.title}`,
          type: notice.priority === 'urgent' || notice.priority === 'high' ? 'warning' : 'info',
          category: 'general',
          link: notificationLinkByRole[user.role as NoticeRole] || '/student/notices',
          read: false,
          timestamp: new Date(),
        }))
      );
    }
    
    return NextResponse.json({ success: true, data: notice }, { status: 201 });
  } catch (error) {
    console.error('Error creating notice:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create notice' },
      { status: 500 }
    );
  }
}
