import { NextResponse } from 'next/server'

// Temporary — shows which provider keys the server can see (never exposes the values)
export async function GET() {
  return NextResponse.json({
    GOOGLE_MAPS_API_KEY: !!process.env.GOOGLE_MAPS_API_KEY,
    TFL_APP_KEY: !!process.env.TFL_APP_KEY,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || null,
  })
}
