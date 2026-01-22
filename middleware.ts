import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paths that require authentication
  const protectedPaths = ['/admin/dashboard', '/admin/users'];
  
  // Check if current path is protected
  const isProtected = protectedPaths.some(path => pathname.startsWith(path));

  if (isProtected) {
    const token = request.cookies.get('admin_token')?.value;

    // Verify token exists and is valid
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [username, secret] = decoded.split(':');
      
      if (username !== 'admin' || secret !== 'admin-secret-key-2025') {
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Allow access to login page when already authenticated
  if (pathname === '/admin/login') {
    const token = request.cookies.get('admin_token')?.value;
    if (token) {
      try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const [username, secret] = decoded.split(':');
        
        if (username === 'admin' && secret === 'admin-secret-key-2025') {
          return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        }
      } catch {
        // Continue to login page
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
