import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Test route works', method: 'GET' });
}

export async function POST() {
  return NextResponse.json({ message: 'Test route works', method: 'POST' });
}