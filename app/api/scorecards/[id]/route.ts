import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { scorecards, questions } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

// GET — Get scorecard with questions (public for published)
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const [scorecard] = await db
    .select()
    .from(scorecards)
    .where(eq(scorecards.id, id));

  if (!scorecard) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (scorecard.status !== 'published') {
    // Require auth for unpublished
    const session = await getSession();
    if (!session || session.did !== scorecard.creatorDid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const qs = await db
    .select()
    .from(questions)
    .where(eq(questions.scorecardId, id))
    .orderBy(questions.sortOrder);

  return NextResponse.json({ ...scorecard, questions: qs });
}

// PATCH — Update scorecard (creator only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  const [existing] = await db
    .select()
    .from(scorecards)
    .where(eq(scorecards.id, id));

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (existing.creatorDid !== session.did) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const {
    title,
    description,
    status,
    tiers,
    landingConfig,
    slug,
    leadGatePosition,
    requireEmail,
    requirePhone,
  } = body;

  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (title !== undefined) update.title = title;
  if (description !== undefined) update.description = description;
  if (slug !== undefined) update.slug = slug;
  if (status !== undefined) update.status = status;
  if (tiers !== undefined) update.tiers = tiers;
  if (landingConfig !== undefined) update.landingConfig = landingConfig;
  if (leadGatePosition !== undefined) update.leadGatePosition = leadGatePosition;
  if (requireEmail !== undefined) update.requireEmail = requireEmail;
  if (requirePhone !== undefined) update.requirePhone = requirePhone;

  const [updated] = await db
    .update(scorecards)
    .set(update)
    .where(eq(scorecards.id, id))
    .returning();

  return NextResponse.json(updated);
}

// DELETE — Delete scorecard (creator only)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  const [existing] = await db
    .select()
    .from(scorecards)
    .where(eq(scorecards.id, id));

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (existing.creatorDid !== session.did) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await db.delete(scorecards).where(eq(scorecards.id, id));

  return NextResponse.json({ success: true });
}
