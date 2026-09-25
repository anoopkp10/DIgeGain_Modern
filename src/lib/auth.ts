import { SignJWT, jwtVerify } from 'jose';

const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'digegain-super-secure-jwt-key-2026-production-token'
);

const COOKIE_NAME = 'digegain_admin_session';

export async function createSessionToken(username: string): Promise<string> {
  return new SignJWT({ sub: username, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SESSION_SECRET);
}

export async function verifySessionToken(token: string): Promise<{ valid: boolean; username?: string }> {
  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET);
    if (payload.role === 'admin' && typeof payload.sub === 'string') {
      return { valid: true, username: payload.sub };
    }
    return { valid: false };
  } catch {
    return { valid: false };
  }
}

export function validateAdminCredentials(user: string, pass: string): boolean {
  const expectedUser = process.env.ADMIN_USERNAME || 'admin';
  const expectedPass = process.env.ADMIN_PASSWORD || 'Digegain@2026!';
  return user === expectedUser && pass === expectedPass;
}

export { COOKIE_NAME };
