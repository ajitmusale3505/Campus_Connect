import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';

const QR_SECRET = process.env.QR_JWT_SECRET || process.env.JWT_SECRET || 'fallback-secret-key';

export type StudentQrPayload = {
  studentId: string;
  enrollmentNumber: string;
  collegeId?: string;
  departmentId?: string;
};

export async function generateStudentQrCode(payload: StudentQrPayload) {
  const signature = signShortToken(payload.studentId);
  const token = `cc3.${payload.studentId}.${signature}`;

  return QRCode.toDataURL(token, {
    errorCorrectionLevel: 'M',
    margin: 4,
    scale: 10,
    width: 460,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });
}

export function verifyStudentQrToken(token: string) {
  if (token.startsWith('cc3.')) {
    const [, studentId, signature] = token.split('.');
    const expectedSignature = signShortToken(studentId || '');

    if (!studentId || !signature || signature.length !== expectedSignature.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      throw new Error('Invalid QR signature');
    }

    return {
      studentId,
      enrollmentNumber: '',
    } as StudentQrPayload & jwt.JwtPayload;
  }

  if (token.startsWith('cc2.')) {
    const [, body, signature] = token.split('.');
    const expectedSignature = crypto.createHmac('sha256', QR_SECRET).update(body || '').digest('base64url').slice(0, 32);

    if (!body || !signature || signature.length !== expectedSignature.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      throw new Error('Invalid QR signature');
    }

    const decoded = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return {
      studentId: decoded.s,
      enrollmentNumber: decoded.e,
      collegeId: decoded.c,
      departmentId: decoded.d,
      iat: parseInt(decoded.i || '0', 36),
    } as StudentQrPayload & jwt.JwtPayload;
  }

  return jwt.verify(token, QR_SECRET, { algorithms: ['HS256'] }) as StudentQrPayload & jwt.JwtPayload;
}

function signShortToken(studentId: string) {
  return crypto.createHmac('sha256', QR_SECRET).update(studentId).digest('base64url').slice(0, 18);
}
