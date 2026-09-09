import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest) {
  const res = NextResponse.redirect(new URL('/superadmin', _req.url))
  res.cookies.delete('sa_studio_id')
  return res
}
