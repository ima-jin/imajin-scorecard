import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { responses, scorecards, tierResults } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { sendResultsEmail, sendLeadNotification } from '@/lib/email';
import { createAssessmentAttestationWithEnvDid } from '@/lib/attestation';
import { buildFairManifest, recordFairManifest } from '@/lib/fair';

// PATCH — Capture lead info
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; responseId: string } }
) {
  const { id: scorecardId, responseId } = params;

  const [existing] = await db
    .select()
    .from(responses)
    .where(eq(responses.id, responseId));

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json();
  const { name, email, phone, respondentDid } = body;

  const update: Record<string, unknown> = {};
  if (name !== undefined) update.name = name;
  if (email !== undefined) update.email = email;
  if (phone !== undefined) update.phone = phone;
  if (respondentDid !== undefined) update.respondentDid = respondentDid;

  const [updated] = await db
    .update(responses)
    .set(update)
    .where(eq(responses.id, responseId))
    .returning();

  // Fire-and-forget integrations after successful lead capture
  (async () => {
    try {
      // Fetch scorecard
      const [scorecard] = await db
        .select()
        .from(scorecards)
        .where(eq(scorecards.id, scorecardId));

      if (!scorecard) {
        console.error('Capture integration: scorecard not found');
        return;
      }

      // Fetch tier result
      let tierResult = null;
      if (updated.tierName) {
        const [tr] = await db
          .select()
          .from(tierResults)
          .where(
            and(
              eq(tierResults.scorecardId, scorecardId),
              eq(tierResults.tierName, updated.tierName)
            )
          );
        tierResult = tr ?? null;
      }

      // Send results email to respondent
      if (updated.email) {
        await sendResultsEmail(updated, scorecard, tierResult);
      }

      // Send lead notification to creator (creator email not stored yet, skip)
      // await sendLeadNotification(updated, scorecard, creatorEmail);

      // Create attestation if we now have a respondentDid and didn't have one before
      const finalRespondentDid = respondentDid || updated.respondentDid;
      let attestationId: string | undefined;

      if (finalRespondentDid) {
        const attestationResult = await createAssessmentAttestationWithEnvDid(
          scorecard.creatorDid,
          finalRespondentDid,
          {
            scorecardId,
            scorecardTitle: scorecard.title,
            totalScore: updated.totalScore ?? 0,
            totalPossible: scorecard.totalPossiblePoints ?? 100,
            tierName: updated.tierName ?? 'Unknown',
          }
        );
        if (attestationResult) {
          attestationId = attestationResult.attestationId;
        }
      }

      // Record .fair manifest
      await recordFairManifest(
        buildFairManifest(
          scorecardId,
          scorecard.creatorDid,
          finalRespondentDid || undefined,
          attestationId
        )
      );
    } catch (err) {
      console.error('Integration error (capture):', err);
    }
  })();

  return NextResponse.json(updated);
}
