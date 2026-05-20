import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { scorecards } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { generateId } from '@/lib/id';
import { eq, desc } from 'drizzle-orm';

// POST — Create scorecard
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const {
    title,
    description,
    tiers,
    leadGatePosition,
    requireEmail,
    requirePhone,
  } = body;

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const id = generateId('sc');
  const now = new Date();

  const [scorecard] = await db
    .insert(scorecards)
    .values({
      id,
      creatorDid: session.did,
      title,
      description: description ?? null,
      tiers: tiers ?? [],
      leadGatePosition: leadGatePosition === 'none' ? null : (leadGatePosition ?? 'after_quiz'),
      requireEmail: requireEmail ?? true,
      requirePhone: requirePhone ?? false,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return NextResponse.json(scorecard, { status: 201 });
}

// GET — List creator's scorecards
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(scorecards)
    .where(eq(scorecards.creatorDid, session.did))
    .orderBy(desc(scorecards.createdAt));

  return NextResponse.json(rows);
}
