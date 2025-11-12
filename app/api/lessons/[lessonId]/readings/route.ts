import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    readings: [],
    status: "working",
    message: "Readings endpoint is functional"
  })
}