import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { scorecards, questions, responses } from '@/db/schema';
import { generateId } from '@/lib/id';
import { eq } from 'drizzle-orm';

interface Answer {
  questionId: string;
  value: string;
}

interface Tier {
  name: string;
  minScore: number;
  maxScore: number;
  color?: string;
  label?: string;
}

// POST — Submit quiz response
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: scorecardId } = params;

  const [scorecard] = await db
    .select()
    .from(scorecards)
    .where(eq(scorecards.id, scorecardId));

  if (!scorecard || scorecard.status !== 'published') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json();
  const { answers, name, email, phone } = body as {
    answers: Answer[];
    name?: string;
    email?: string;
    phone?: string;
  };

  if (!Array.isArray(answers)) {
    return NextResponse.json({ error: 'answers array required' }, { status: 400 });
  }

  // Fetch all questions for this scorecard
  const qs = await db
    .select()
    .from(questions)
    .where(eq(questions.scorecardId, scorecardId));

  const questionMap = new Map(qs.map(q => [q.id, q]));

  let totalScore = 0;
  let totalPossible = 0;
  const scoredAnswers = [];

  for (const ans of answers) {
    const q = questionMap.get(ans.questionId);
    if (!q) continue;

    if (q.isQualifying) {
      scoredAnswers.push({ questionId: ans.questionId, value: ans.value, points: 0 });
      continue;
    }

    // Calculate points for this answer
    let points = 0;
    const opts = (q.options ?? []) as Array<{ value: string; label: string; points: number }>;
    const matched = opts.find((o) => o.value === ans.value);
    if (matched) {
      points = matched.points ?? 0;
    }

    totalScore += points;

    // Add to total possible (max points for this question)
    const maxPointsForQuestion = Math.max(...opts.map((o) => o.points ?? 0), 0);
    totalPossible += maxPointsForQuestion;

    scoredAnswers.push({ questionId: ans.questionId, value: ans.value, points });
  }

  // Determine tier
  let tierName: string | null = null;
  const tiers = (scorecard.tiers ?? []) as Tier[];
  for (const tier of tiers) {
    if (totalScore >= tier.minScore && totalScore <= tier.maxScore) {
      tierName = tier.name;
      break;
    }
  }

  const responseId = generateId('resp');

  const [response] = await db
    .insert(responses)
    .values({
      id: responseId,
      scorecardId,
      name: name ?? null,
      email: email ?? null,
      phone: phone ?? null,
      answers: scoredAnswers,
      totalScore,
      tierName,
      completedAt: new Date(),
    })
    .returning();

  return NextResponse.json({
    responseId: response.id,
    totalScore,
    tierName,
    totalPossible,
  });
}
