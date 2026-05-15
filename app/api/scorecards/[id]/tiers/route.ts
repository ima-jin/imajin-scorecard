import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { scorecards, tierResults } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { generateId } from '@/lib/id';
import { eq, and } from 'drizzle-orm';

// POST — Create/update tier result (upsert)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: scorecardId } = params;

  const [scorecard] = await db
    .select()
    .from(scorecards)
    .where(eq(scorecards.id, scorecardId));

  if (!scorecard) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (scorecard.creatorDid !== session.did) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const {
    tierName,
    bigReveal,
    insights,
    nextStepType,
    nextStepConfig,
  } = body;

  if (!tierName) {
    return NextResponse.json({ error: 'tierName is required' }, { status: 400 });
  }

  // Check if tier result already exists
  const [existing] = await db
    .select()
    .from(tierResults)
    .where(
      and(
        eq(tierResults.scorecardId, scorecardId),
        eq(tierResults.tierName, tierName)
      )
    );

  if (existing) {
    const [updated] = await db
      .update(tierResults)
      .set({
        bigReveal: bigReveal ?? existing.bigReveal,
        insights: insights ?? existing.insights,
        nextStepType: nextStepType ?? existing.nextStepType,
        nextStepConfig: nextStepConfig ?? existing.nextStepConfig,
      })
      .where(eq(tierResults.id, existing.id))
      .returning();

    return NextResponse.json(updated);
  }

  const id = generateId('tr');
  const [created] = await db
    .insert(tierResults)
    .values({
      id,
      scorecardId,
      tierName,
      bigReveal: bigReveal ?? null,
      insights: insights ?? [],
      nextStepType: nextStepType ?? null,
      nextStepConfig: nextStepConfig ?? {},
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}

// GET — List tier results (creator only)
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: scorecardId } = params;

  const [scorecard] = await db
    .select()
    .from(scorecards)
    .where(eq(scorecards.id, scorecardId));

  if (!scorecard) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (scorecard.creatorDid !== session.did) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const rows = await db
    .select()
    .from(tierResults)
    .where(eq(tierResults.scorecardId, scorecardId));

  return NextResponse.json(rows);
}
