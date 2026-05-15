import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'scorecard',
    timestamp: new Date().toISOString(),
  });
}
