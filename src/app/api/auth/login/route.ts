import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comparePasswords, generateToken, setAuthCookie } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const cleanInput = String(email).trim();
    const lowerInput = cleanInput.toLowerCase();

    // Support Email, Username, Employee Code, Company Email, or Phone
    const user = await db.user.findFirst({
      where: {
        OR: [
          { email: lowerInput },
          { email: lowerInput.includes('@') ? lowerInput : `${lowerInput}@techinpedia.com` },
          { employee: { employeeCode: cleanInput } },
          { employee: { companyEmail: lowerInput } },
          { employee: { personalEmail: lowerInput } },
          { employee: { phone: cleanInput } },
        ],
      },
      include: {
        employee: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }


    const isMatch = await comparePasswords(password, user.password);

    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    // Reset failed login count if previously locked
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await db.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    };

    const token = generateToken(tokenPayload);
    await setAuthCookie(token);

    await logActivity({
      userId: user.id,
      userEmail: user.email,
      action: 'LOGIN',
      entityType: 'User',
      entityId: user.id,
      metadata: { role: user.role, mustChangePassword: user.mustChangePassword },
    });

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    const session = await db.employeeSession.create({
      data: {
        userId: user.id,
        ipAddress: String(ipAddress).substring(0, 45),
        userAgent: String(userAgent),
        status: 'ONLINE',
      },
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error during authentication.' }, { status: 500 });
  }
}
