import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { responses, scorecards } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

// DELETE — Hard delete a response
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; responseId: string } }
) {
  const { id: scorecardId, responseId } = params;

  const session = await getSession();
  if (!session?.did) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify the scorecard belongs to this user
  const [scorecard] = await db
    .select()
    .from(scorecards)
    .where(eq(scorecards.id, scorecardId));

  if (!scorecard || scorecard.creatorDid !== session.did) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Verify response belongs to this scorecard
  const [existing] = await db
    .select()
    .from(responses)
    .where(
      and(
        eq(responses.id, responseId),
        eq(responses.scorecardId, scorecardId)
      )
    );

  if (!existing) {
    return NextResponse.json({ error: 'Response not found' }, { status: 404 });
  }

  await db
    .delete(responses)
    .where(eq(responses.id, responseId));

  return NextResponse.json({ ok: true });
}
