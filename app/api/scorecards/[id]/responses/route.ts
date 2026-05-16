import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { scorecards, responses } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { eq, desc } from 'drizzle-orm';

// GET — List responses for a scorecard (creator only)
export async function GET(
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

  const rows = await db
    .select()
    .from(responses)
    .where(eq(responses.scorecardId, scorecardId))
    .orderBy(desc(responses.createdAt));

  const url = new URL(req.url);
  const format = url.searchParams.get('format');

  if (format === 'csv') {
    const headers = ['id', 'name', 'email', 'phone', 'totalScore', 'tierName', 'answers', 'createdAt'];
    const csvRows = rows.map(r => [
      r.id,
      r.name ?? '',
      r.email ?? '',
      r.phone ?? '',
      String(r.totalScore ?? ''),
      r.tierName ?? '',
      JSON.stringify(r.answers),
      r.createdAt ? new Date(r.createdAt).toISOString() : '',
    ]);
    const csv = [
      headers.join(','),
      ...csvRows.map(row =>
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${scorecard.title.replace(/\s+/g, '_')}-responses.csv"`,
      },
    });
  }

  return NextResponse.json(rows);
}
