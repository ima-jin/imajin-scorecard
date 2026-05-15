import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { scorecards, questions } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { generateId } from '@/lib/id';
import { eq, and, asc } from 'drizzle-orm';

// POST — Add question
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
    text,
    type,
    sortOrder,
    isRequired,
    isQualifying,
    options,
  } = body;

  if (!text || !type) {
    return NextResponse.json({ error: 'Text and type are required' }, { status: 400 });
  }

  const id = generateId('q');

  const [question] = await db
    .insert(questions)
    .values({
      id,
      scorecardId,
      text,
      type,
      sortOrder: sortOrder ?? 0,
      isRequired: isRequired ?? true,
      isQualifying: isQualifying ?? false,
      options: options ?? [],
    })
    .returning();

  return NextResponse.json(question, { status: 201 });
}

// GET — List questions
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: scorecardId } = params;

  const [scorecard] = await db
    .select()
    .from(scorecards)
    .where(eq(scorecards.id, scorecardId));

  if (!scorecard) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (scorecard.status !== 'published') {
    const session = await getSession();
    if (!session || session.did !== scorecard.creatorDid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const qs = await db
    .select()
    .from(questions)
    .where(eq(questions.scorecardId, scorecardId))
    .orderBy(asc(questions.sortOrder));

  return NextResponse.json(qs);
}
