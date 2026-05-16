import { notFound } from 'next/navigation';
import { db } from '@/db';
import { scorecards, questions } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import QuizFlow from '@/components/QuizFlow';
import type { Metadata } from 'next';

interface PageProps {
  params: { id: string };
}

export const metadata: Metadata = {
  robots: 'noindex',
};

export default async function EmbedScorecardPage({ params }: PageProps) {
  const { id } = params;

  const [scorecard] = await db
    .select()
    .from(scorecards)
    .where(eq(scorecards.id, id));

  if (!scorecard || scorecard.status !== 'published') {
    notFound();
  }

  const qs = await db
    .select()
    .from(questions)
    .where(eq(questions.scorecardId, id))
    .orderBy(asc(questions.sortOrder));

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto pt-4 pb-16">
        <div className="text-center mb-6 px-4">
          <h1 className="text-xl font-bold text-white mb-2">{scorecard.title}</h1>
          {scorecard.description && (
            <p className="text-gray-400 text-sm">{scorecard.description}</p>
          )}
        </div>
        <QuizFlow scorecard={scorecard} questions={qs as any} />
      </div>
    </main>
  );
}
