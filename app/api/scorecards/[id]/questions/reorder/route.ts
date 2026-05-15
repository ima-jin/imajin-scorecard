import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { scorecards, questions } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { eq } from 'drizzle-orm';

// POST — Reorder questions
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
  const { questionIds } = body;

  if (!Array.isArray(questionIds)) {
    return NextResponse.json({ error: 'questionIds array required' }, { status: 400 });
  }

  for (let i = 0; i < questionIds.length; i++) {
    await db
      .update(questions)
      .set({ sortOrder: i })
      .where(eq(questions.id, questionIds[i]));
  }

  return NextResponse.json({ success: true });
}
