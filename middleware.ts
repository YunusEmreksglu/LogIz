import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname
    const isAuth = !!token

    // Redirect authenticated users away from auth pages and landing page
    if (isAuth) {
      if (path === '/' || path.startsWith('/login') || path.startsWith('/register')) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname

        // Public paths
        if (
          path === '/' ||
          path.startsWith('/login') ||
          path.startsWith('/register') ||
          path.startsWith('/upload')
        ) {
          return true
        }

        // Require token for all other paths
        return !!token
      },
    },
  }
)

export const config = {
  // Matcher ignoring static files and Next.js internals
  // We match everything else to ensure full protection
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
