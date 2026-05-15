import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { responses } from '@/db/schema';
import { eq } from 'drizzle-orm';

// PATCH — Capture lead info
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; responseId: string } }
) {
  const { responseId } = params;

  const [existing] = await db
    .select()
    .from(responses)
    .where(eq(responses.id, responseId));

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json();
  const { name, email, phone } = body;

  const update: Record<string, unknown> = {};
  if (name !== undefined) update.name = name;
  if (email !== undefined) update.email = email;
  if (phone !== undefined) update.phone = phone;

  // Future: create soft DID via kernel here
  // For now, just store the lead info

  const [updated] = await db
    .update(responses)
    .set(update)
    .where(eq(responses.id, responseId))
    .returning();

  return NextResponse.json(updated);
}
