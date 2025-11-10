import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware() {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

// Protected routes - upload herkese açık, sadece dashboard ve history korumalı
export const config = {
  matcher: ['/dashboard/:path*', '/history/:path*'],
}
