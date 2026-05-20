'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Scorecard, Response } from '@/db/schema';
import EmbedSnippet from '@/components/EmbedSnippet';

interface ExtendedResponse extends Response {
  answers: Array<{ questionId: string; value: string; points: number }>;
}

export default function LeadManagementPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  const [user, setUser] = useState<{ did: string } | null>(null);
  const userDidRef = useRef<string | null>(null);
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [responses, setResponses] = useState<ExtendedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'tier'>('date');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showEmbed, setShowEmbed] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(data => {
        if (!data) {
          router.push('/');
          return null;
        }
        setUser(data);
        userDidRef.current = data.did;
        return fetch(`/api/scorecards/${id}`);
      })
      .then(r => r?.json())
      .then((sc: Scorecard & { questions?: unknown[] }) => {
        if (!sc) return;
        if (sc.creatorDid !== userDidRef.current) {
          router.push('/dashboard');
          return;
        }
        setScorecard(sc);
        return fetch(`/api/scorecards/${id}/responses`);
      })
      .then(r => r?.json())
      .then((data: ExtendedResponse[]) => {
        setResponses(data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id, router]);

  useEffect(() => {
    if (user && scorecard && scorecard.creatorDid !== user.did) {
      router.push('/dashboard');
    }
  }, [user, scorecard, router]);

  const tierColor = (tierName: string | null) => {
    const tiers = (scorecard?.tiers ?? []) as Array<{ name: string; color: string }>;
    const tier = tiers.find(t => t.name === tierName);
    switch (tier?.color) {
      case 'green': return 'bg-green-900 text-green-400 border-green-700';
      case 'red': return 'bg-red-900 text-red-400 border-red-700';
      case 'blue': return 'bg-blue-900 text-blue-400 border-blue-700';
      case 'purple': return 'bg-purple-900 text-purple-400 border-purple-700';
      default: return 'bg-amber-900 text-amber-400 border-amber-700';
    }
  };

  const sortedResponses = [...responses].sort((a, b) => {
    switch (sortBy) {
      case 'score': return (b.totalScore ?? 0) - (a.totalScore ?? 0);
      case 'tier': return (a.tierName ?? '').localeCompare(b.tierName ?? '');
      default: return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    }
  });

  const totalResponses = responses.length;
  const avgScore = totalResponses > 0
    ? Math.round(responses.reduce((sum, r) => sum + (r.totalScore ?? 0), 0) / totalResponses)
    : 0;

  const tierDistribution = () => {
    const tiers = (scorecard?.tiers ?? []) as Array<{ name: string; color: string }>;
    const counts: Record<string, number> = {};
    responses.forEach(r => {
      counts[r.tierName ?? 'Unknown'] = (counts[r.tierName ?? 'Unknown'] ?? 0) + 1;
    });
    return tiers.map(t => ({ name: t.name, count: counts[t.name] ?? 0, color: t.color }));
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Score', 'Tier', 'Date', 'Answers'];
    const rows = sortedResponses.map(r => [
      r.name ?? '',
      r.email ?? '',
      r.phone ?? '',
      String(r.totalScore ?? ''),
      r.tierName ?? '',
      r.createdAt ? new Date(r.createdAt).toISOString() : "",
      JSON.stringify(r.answers),
    ]);
    const csv = [headers.join(','), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scorecard?.title ?? 'scorecard'}-responses.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="animate-pulse h-8 w-48 bg-gray-800 rounded" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Lead Management</h1>
            <p className="text-gray-400 text-sm mt-1">{scorecard?.title}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowEmbed(!showEmbed)}
              className="px-4 py-2 border border-gray-700 text-gray-300 hover:border-gray-500 rounded-lg text-sm"
            >
              {showEmbed ? 'Hide Embed' : 'Embed'}
            </button>
            <button
              onClick={exportCSV}
              disabled={responses.length === 0}
              className="px-4 py-2 border border-gray-700 text-gray-300 hover:border-gray-500 rounded-lg text-sm disabled:opacity-50"
            >
              Export CSV
            </button>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg text-sm"
            >
              ← Dashboard
            </Link>
          </div>
        </div>

        {showEmbed && scorecard && (
          <div className="mb-8">
            <EmbedSnippet
              scorecardId={scorecard.id}
              appUrl={typeof window !== 'undefined' ? window.location.origin : ''}
            />
          </div>
        )}

        {/* Stats */}
        <div className="grid sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-center">
            <div className="text-3xl font-bold text-white">{totalResponses}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Total Responses</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-center">
            <div className="text-3xl font-bold text-white">{totalResponses > 0 ? '100%' : '0%'}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Completion Rate</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-center">
            <div className="text-3xl font-bold text-white">{avgScore}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Average Score</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Tier Distribution</div>
            <div className="flex h-3 rounded-full overflow-hidden">
              {tierDistribution().map((t, i) => {
                const pct = totalResponses > 0 ? (t.count / totalResponses) * 100 : 0;
                return pct > 0 ? (
                  <div
                    key={i}
                    style={{ width: `${pct}%` }}
                    className={`${t.color === 'green' ? 'bg-green-500' : t.color === 'red' ? 'bg-red-500' : t.color === 'blue' ? 'bg-blue-500' : t.color === 'purple' ? 'bg-purple-500' : 'bg-amber-500'}`}
                    title={`${t.name}: ${t.count}`}
                  />
                ) : null;
              })}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {tierDistribution().map((t, i) => (
                <span key={i} className="text-[10px] text-gray-500">
                  {t.name}: {t.count}
                </span>
              ))}
            </div>
          </div>
        </div>

        {responses.length === 0 ? (
          <div className="bg-gray-900/50 rounded-xl p-16 text-center border border-gray-800/50 border-dashed">
            <div className="text-4xl mb-4">📭</div>
            <h3 className="text-lg font-semibold text-white mb-2">No responses yet</h3>
            <p className="text-gray-500 mb-6">Share your scorecard to start collecting leads.</p>
            <button
              onClick={() => {
                const url = `${window.location.origin}/scorecard/${id}/landing`;
                navigator.clipboard.writeText(url);
                alert('Landing page link copied!');
              }}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg transition-colors"
            >
              Copy Landing Page Link
            </button>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
              <span className="text-sm font-medium text-gray-300">{responses.length} response{responses.length !== 1 ? 's' : ''}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as typeof sortBy)}
                  className="bg-gray-950 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 focus:border-amber-500"
                >
                  <option value="date">Date</option>
                  <option value="score">Score</option>
                  <option value="tier">Tier</option>
                </select>
              </div>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Score</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tier</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                </tr>
              </thead>
              <tbody>
                {sortedResponses.map(r => (
                  <>
                    <tr
                      key={r.id}
                      onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                      className="border-b border-gray-800/50 hover:bg-gray-800/50 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3 text-sm text-white">{r.name ?? '—'}</td>
                      <td className="px-5 py-3 text-sm text-gray-400">{r.email ?? '—'}</td>
                      <td className="px-5 py-3 text-sm text-white font-medium">{r.totalScore ?? '—'}</td>
                      <td className="px-5 py-3">
                        {r.tierName ? (
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${tierColor(r.tierName)}`}>
                            {r.tierName}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                    {expandedId === r.id && (
                      <tr>
                        <td colSpan={5} className="px-5 py-4 bg-gray-950 border-b border-gray-800/50">
                          <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wide mb-3">Individual Answers</h4>
                          <div className="space-y-2">
                            {(r.answers ?? []).map((ans, i) => (
                              <div key={i} className="flex items-center justify-between bg-gray-900 rounded-lg px-3 py-2">
                                <span className="text-sm text-gray-300">{ans.value}</span>
                                <span className="text-xs text-gray-500">{ans.points} pts</span>
                              </div>
                            ))}
                          </div>
                          {r.phone && (
                            <div className="mt-3 text-sm text-gray-400">
                              Phone: <span className="text-white">{r.phone}</span>
                            </div>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={5} className="px-5 py-3 bg-gray-950 border-b border-gray-800/50">
                          <div className="flex justify-end">
                            {deletingId === r.id ? (
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-red-400">Delete this response?</span>
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      const res = await fetch(`/api/scorecards/${id}/responses/${r.id}`, { method: 'DELETE' });
                                      if (res.ok) {
                                        setResponses(prev => prev.filter(resp => resp.id !== r.id));
                                        setExpandedId(null);
                                      }
                                    } catch {}
                                    setDeletingId(null);
                                  }}
                                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                                >
                                  Yes, delete
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setDeletingId(null); }}
                                  className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); setDeletingId(r.id); }}
                                className="flex items-center gap-1.5 px-3 py-1 text-sm text-gray-500 hover:text-red-400 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                </svg>
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
