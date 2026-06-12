import { NextRequest, NextResponse } from 'next/server'
import { placeSearch } from '@/lib/providers/geocode'

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')
  if (!query || query.trim().length < 2) {
    return NextResponse.json({ suggestions: [] })
  }

  const suggestions = await placeSearch.search(query)
  return NextResponse.json({ suggestions })
}
