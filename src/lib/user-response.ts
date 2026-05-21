import type { IUser } from '@/models/User';

export function toUserResponse(user: IUser | any) {
  return {
    id: user._id?.toString?.() || user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    qrCode: user.qrCode,
    phone: user.phone,
    rollNumber: user.rollNumber,
    enrollmentNumber: user.enrollmentNumber,
    universityId: user.universityId?.toString?.() || user.universityId,
    collegeId: user.collegeId?.toString?.() || user.collegeId,
    departmentId: user.departmentId?.toString?.() || user.departmentId,
    year: user.year,
    semester: user.semester,
    teachingSemesters: user.teachingSemesters || [],
    address: user.address,
    department: user.department,
    batchIds: (user.batchIds || []).map((id: any) => id.toString?.() || id),
    subjectIds: (user.subjectIds || []).map((id: any) => id.toString?.() || id),
  };
}
