import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { scorecards, questions } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { eq } from 'drizzle-orm';

async function checkOwnership(scorecardId: string, session: Awaited<ReturnType<typeof getSession>>) {
  if (!session) return { error: 'Unauthorized', status: 401 };
  const [scorecard] = await db.select().from(scorecards).where(eq(scorecards.id, scorecardId));
  if (!scorecard) return { error: 'Not found', status: 404 };
  if (scorecard.creatorDid !== session.did) return { error: 'Forbidden', status: 403 };
  return null;
}

// PATCH — Update question
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; questionId: string } }
) {
  const session = await getSession();
  const err = await checkOwnership(params.id, session);
  if (err) return NextResponse.json({ error: err.error }, { status: err.status });

  const body = await req.json();
  const update: Record<string, unknown> = {};
  if (body.text !== undefined) update.text = body.text;
  if (body.type !== undefined) update.type = body.type;
  if (body.sortOrder !== undefined) update.sortOrder = body.sortOrder;
  if (body.isRequired !== undefined) update.isRequired = body.isRequired;
  if (body.isQualifying !== undefined) update.isQualifying = body.isQualifying;
  if (body.options !== undefined) update.options = body.options;

  const [updated] = await db
    .update(questions)
    .set(update)
    .where(eq(questions.id, params.questionId))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(updated);
}

// DELETE — Delete question
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; questionId: string } }
) {
  const session = await getSession();
  const err = await checkOwnership(params.id, session);
  if (err) return NextResponse.json({ error: err.error }, { status: err.status });

  await db.delete(questions).where(eq(questions.id, params.questionId));

  return NextResponse.json({ success: true });
}
