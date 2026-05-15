'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Scorecard, TierResult } from '@/db/schema';

interface TierDef {
  name: string;
  minScore: number;
  maxScore: number;
  color?: string;
  label?: string;
}

interface Insight {
  title: string;
  body: string;
}

interface TierFormData {
  tierName: string;
  bigReveal: string;
  insights: Insight[];
  nextStepType: string;
  nextStepConfig: { url: string; label: string; description: string };
}

const NEXT_STEP_OPTIONS = [
  { value: 'book_call', label: 'Book a Call' },
  { value: 'event', label: 'Attend Event' },
  { value: 'resource', label: 'Download Resource' },
  { value: 'content', label: 'Read Content' },
];

export default function ResultsEditorPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  const [user, setUser] = useState<{ did: string } | null>(null);
  const userDidRef = useRef<string | null>(null);
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [tierData, setTierData] = useState<Record<string, TierFormData>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        const tiers = (sc.tiers ?? []) as TierDef[];
        // Load existing tier results
        return fetch(`/api/scorecards/${id}/tiers`).then(r => r.json()).then((existing: TierResult[]) => {
          const existingMap = new Map(existing.map(tr => [tr.tierName, tr]));
          const initial: Record<string, TierFormData> = {};
          tiers.forEach(tier => {
            const ex = existingMap.get(tier.name);
            initial[tier.name] = {
              tierName: tier.name,
              bigReveal: ex?.bigReveal ?? '',
              insights: (ex?.insights as Insight[] | undefined) ?? [
                { title: '', body: '' },
                { title: '', body: '' },
                { title: '', body: '' },
              ],
              nextStepType: ex?.nextStepType ?? 'book_call',
              nextStepConfig: (ex?.nextStepConfig as { url: string; label: string; description: string } | undefined) ?? { url: '', label: '', description: '' },
            };
          });
          setTierData(initial);
          setLoading(false);
        });
      })
      .catch(() => router.push('/dashboard'));
  }, [id, router]);

  useEffect(() => {
    if (user && scorecard && scorecard.creatorDid !== user.did) {
      router.push('/dashboard');
    }
  }, [user, scorecard, router]);

  const updateTier = (tierName: string, field: keyof TierFormData, val: unknown) => {
    setTierData(prev => ({
      ...prev,
      [tierName]: { ...prev[tierName], [field]: val },
    }));
  };

  const updateInsight = (tierName: string, i: number, field: keyof Insight, val: string) => {
    setTierData(prev => {
      const td = prev[tierName];
      const insights = [...td.insights];
      insights[i] = { ...insights[i], [field]: val };
      return { ...prev, [tierName]: { ...td, insights } };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const promises = Object.values(tierData).map(td =>
      fetch(`/api/scorecards/${id}/tiers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(td),
      })
    );
    await Promise.all(promises);
    setSaving(false);
  };

  const handlePublish = async () => {
    setSaving(true);
    await handleSave();
    const res = await fetch(`/api/scorecards/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'published' }),
    });
    setSaving(false);
    if (res.ok) {
      router.push(`/create/landing/${id}`);
    } else {
      alert('Failed to publish.');
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="animate-pulse h-8 w-48 bg-gray-800 rounded" />
      </main>
    );
  }

  const tiers = (scorecard?.tiers ?? []) as TierDef[];

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Tier Results</h1>
            <p className="text-gray-400 text-sm mt-1">{scorecard?.title}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/create/landing/${id}`}
              className="px-4 py-2 border border-gray-700 text-gray-300 hover:border-gray-500 rounded-lg text-sm"
            >
              Next: Landing Page →
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg text-sm disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save All'}
            </button>
          </div>
        </div>

        {tiers.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
            <p className="text-gray-400">No tiers configured. Go back and set up scoring tiers first.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {tiers.map(tier => {
              const td = tierData[tier.name];
              if (!td) return null;
              return (
                <div key={tier.name} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <span className={`w-3 h-3 rounded-full ${tier.color === 'green' ? 'bg-green-500' : tier.color === 'red' ? 'bg-red-500' : tier.color === 'blue' ? 'bg-blue-500' : tier.color === 'purple' ? 'bg-purple-500' : 'bg-amber-500'}`} />
                    <h2 className="text-lg font-bold">{tier.name}</h2>
                    <span className="text-xs text-gray-500">{tier.minScore}–{tier.maxScore} pts</span>
                    {tier.label && <span className="text-xs text-gray-500">· {tier.label}</span>}
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Big Reveal Headline</label>
                      <input
                        type="text"
                        value={td.bigReveal}
                        onChange={e => updateTier(tier.name, 'bigReveal', e.target.value)}
                        placeholder={`You scored ${tier.label || tier.name}!`}
                        className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-3">Insights</h3>
                      <div className="space-y-3">
                        {td.insights.map((insight, i) => (
                          <div key={i} className="bg-gray-950 border border-gray-800 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs text-gray-500 font-medium">Insight {i + 1}</span>
                            </div>
                            <input
                              type="text"
                              value={insight.title}
                              onChange={e => updateInsight(tier.name, i, 'title', e.target.value)}
                              placeholder="Insight title"
                              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm mb-2 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                            />
                            <textarea
                              value={insight.body}
                              onChange={e => updateInsight(tier.name, i, 'body', e.target.value)}
                              placeholder="Detailed insight..."
                              rows={2}
                              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-3">Next Step</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Type</label>
                          <select
                            value={td.nextStepType}
                            onChange={e => updateTier(tier.name, 'nextStepType', e.target.value)}
                            className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                          >
                            {NEXT_STEP_OPTIONS.map(o => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Label</label>
                          <input
                            type="text"
                            value={td.nextStepConfig.label}
                            onChange={e => updateTier(tier.name, 'nextStepConfig', { ...td.nextStepConfig, label: e.target.value })}
                            placeholder="e.g. Book a Free Consultation"
                            className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">URL</label>
                          <input
                            type="text"
                            value={td.nextStepConfig.url}
                            onChange={e => updateTier(tier.name, 'nextStepConfig', { ...td.nextStepConfig, url: e.target.value })}
                            placeholder="https://..."
                            className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Description</label>
                          <input
                            type="text"
                            value={td.nextStepConfig.description}
                            onChange={e => updateTier(tier.name, 'nextStepConfig', { ...td.nextStepConfig, description: e.target.value })}
                            placeholder="Brief description of the next step..."
                            className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 mt-8">
          <Link
            href={`/create/questions/${id}`}
            className="px-4 py-2 border border-gray-700 text-gray-300 hover:border-gray-500 rounded-lg text-sm"
          >
            ← Back to Questions
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save All'}
          </button>
          <button
            onClick={handlePublish}
            disabled={saving}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg disabled:opacity-50"
          >
            Publish & Continue
          </button>
        </div>
      </div>
    </main>
  );
}
