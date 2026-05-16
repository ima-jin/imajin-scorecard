'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Scorecard } from '@/db/schema';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ did: string } | null>(null);
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(data => {
        if (!data) {
          router.push('/');
          return;
        }
        setUser(data);
        return fetch('/api/scorecards');
      })
      .then(r => r?.json())
      .then((scs: Scorecard[]) => {
        setScorecards(scs ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this scorecard? This cannot be undone.')) return;
    setDeletingId(id);
    const res = await fetch(`/api/scorecards/${id}`, { method: 'DELETE' });
    setDeletingId(null);
    if (res.ok) {
      setScorecards(prev => prev.filter(sc => sc.id !== id));
    } else {
      alert('Failed to delete.');
    }
  };

  const copyLink = (id: string) => {
    const url = `${window.location.origin}/scorecard/${id}/landing`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <span className="px-2 py-0.5 bg-green-900 text-green-400 text-xs font-medium rounded-full">Published</span>;
      case 'closed':
        return <span className="px-2 py-0.5 bg-red-900 text-red-400 text-xs font-medium rounded-full">Closed</span>;
      default:
        return <span className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs font-medium rounded-full">Draft</span>;
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="animate-pulse h-8 w-48 bg-gray-800 rounded mb-8" />
          <div className="animate-pulse h-64 bg-gray-900 rounded-lg border border-gray-800" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Your Scorecards</h1>
            <p className="text-gray-400 text-sm mt-1">Manage your assessments and view leads</p>
          </div>
          <Link
            href="/create"
            className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg text-sm transition-colors"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Create Scorecard
          </Link>
        </div>

        {scorecards.length === 0 ? (
          <div className="bg-gray-900/50 rounded-xl p-16 text-center border border-gray-800/50 border-dashed">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-white mb-2">No scorecards yet</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">Create your first scorecard to start generating qualified leads.</p>
            <Link
              href="/create"
              className="inline-flex items-center px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg transition-colors"
            >
              Create Scorecard
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {scorecards.map(sc => (
              <div key={sc.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {statusBadge(sc.status)}
                      <span className="text-xs text-gray-500">
                        {sc.createdAt ? new Date(sc.createdAt).toLocaleDateString() : "—"}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-white truncate">{sc.title}</h3>
                    {sc.description && (
                      <p className="text-gray-400 text-sm mt-1 truncate">{sc.description}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/create/questions/${sc.id}`}
                      className="px-3 py-1.5 border border-gray-700 text-gray-300 hover:border-gray-500 rounded-lg text-sm transition-colors"
                      title="Edit"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/dashboard/${sc.id}`}
                      className="px-3 py-1.5 border border-gray-700 text-gray-300 hover:border-gray-500 rounded-lg text-sm transition-colors"
                      title="View Results"
                    >
                      Results
                    </Link>
                    <button
                      onClick={() => copyLink(sc.id)}
                      className="px-3 py-1.5 border border-gray-700 text-gray-300 hover:border-gray-500 rounded-lg text-sm transition-colors"
                      title="Copy Link"
                    >
                      Link
                    </button>
                    <button
                      onClick={() => handleDelete(sc.id)}
                      disabled={deletingId === sc.id}
                      className="px-3 py-1.5 border border-red-900/50 text-red-400 hover:border-red-700 rounded-lg text-sm transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingId === sc.id ? '…' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
