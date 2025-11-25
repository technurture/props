import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const sessionToken = cookieStore.get('next-auth.session-token') || cookieStore.get('__Secure-next-auth.session-token');
    
    const session = await getServerSession(authOptions);
    
    return NextResponse.json({
      hasSession: !!session,
      user: session?.user || null,
      hasCookies: allCookies.length > 0,
      hasSessionToken: !!sessionToken,
      cookieNames: allCookies.map(c => c.name)
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
