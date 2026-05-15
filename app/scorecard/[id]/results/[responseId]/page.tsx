import { notFound } from 'next/navigation';
import { db } from '@/db';
import { scorecards, responses, tierResults } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import ResultsDisplay from '@/components/ResultsDisplay';
import LeadCaptureGate from '@/components/LeadCaptureGate';

interface PageProps {
  params: { id: string; responseId: string };
}

export default async function ResultsPage({ params }: PageProps) {
  const { id: scorecardId, responseId } = params;

  const [scorecard] = await db
    .select()
    .from(scorecards)
    .where(eq(scorecards.id, scorecardId));

  if (!scorecard) {
    notFound();
  }

  const [response] = await db
    .select()
    .from(responses)
    .where(eq(responses.id, responseId));

  if (!response || response.scorecardId !== scorecardId) {
    notFound();
  }

  // Fetch tier result if tierName is set
  let tierResult = null;
  if (response.tierName) {
    const [tr] = await db
      .select()
      .from(tierResults)
      .where(
        and(
          eq(tierResults.scorecardId, scorecardId),
          eq(tierResults.tierName, response.tierName)
        )
      );
    tierResult = tr ?? null;
  }

  // Check lead gate
  const needsCapture =
    scorecard.leadGatePosition === 'after_quiz' &&
    (!response.email || response.email.trim() === '');

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto pt-8 pb-16">
        <div className="text-center mb-8 px-4">
          <h1 className="text-2xl font-bold text-white mb-2">
            Your Results
          </h1>
          <p className="text-gray-400">{scorecard.title}</p>
        </div>

        {needsCapture ? (
          <LeadCaptureGate
            scorecardId={scorecardId}
            responseId={responseId}
            requireEmail={scorecard.requireEmail}
            requirePhone={scorecard.requirePhone}
          />
        ) : (
          <ResultsDisplay
            response={response}
            scorecard={scorecard}
            tierResult={tierResult}
          />
        )}
      </div>
    </main>
  );
}
