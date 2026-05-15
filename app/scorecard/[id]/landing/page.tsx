import { notFound } from 'next/navigation';
import { db } from '@/db';
import { scorecards } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { LandingPage } from '@/components/LandingPage';

export default async function PublicLandingPage({ params }: { params: { id: string } }) {
  const { id } = params;

  const [scorecard] = await db
    .select()
    .from(scorecards)
    .where(eq(scorecards.id, id));

  if (!scorecard || scorecard.status !== 'published') {
    notFound();
  }

  return <LandingPage scorecard={scorecard} />;
}
