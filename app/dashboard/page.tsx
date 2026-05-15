'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { SessionUser } from '@/lib/auth';

export default function Dashboard() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="animate-pulse h-8 w-48 bg-gray-800 rounded mb-8" />
          <div className="animate-pulse h-64 bg-gray-900 rounded-lg border border-gray-800" />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Your Scorecards</h1>
          <p className="text-gray-400 mb-6">Sign in with Imajin to create and manage scorecards.</p>
          <p className="text-gray-500 text-sm">
            Use the Sign in button in the header above.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Your Scorecards</h1>
          <button
            disabled
            className="px-4 py-2 bg-amber-500/50 text-gray-950 font-medium rounded-lg text-sm cursor-not-allowed opacity-50"
            title="Coming soon"
          >
            + New Scorecard
          </button>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-12 text-center border border-gray-800/50 border-dashed">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-white mb-2">No scorecards yet</h3>
          <p className="text-gray-500 mb-6">Create your first scorecard to start generating leads.</p>
          <button
            disabled
            className="px-4 py-2 bg-amber-500/50 text-gray-950 font-medium rounded-lg text-sm cursor-not-allowed opacity-50"
            title="Coming soon"
          >
            Create Scorecard
          </button>
        </div>
      </div>
    </main>
  );
}
