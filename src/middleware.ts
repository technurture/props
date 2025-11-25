import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const origin = request.headers.get('origin');
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    if (origin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
  } else {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];
    
    if (!allowedOrigins.length) {
      console.error('⚠️ CRITICAL: ALLOWED_ORIGINS environment variable is not set in production!');
      console.error('   This is a security risk. Set ALLOWED_ORIGINS to your production domain.');
    }

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
  }

  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (request.method === 'OPTIONS') {
    response.headers.set('Access-Control-Max-Age', '86400');
    return new NextResponse(null, { status: 204, headers: response.headers });
  }

  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
