'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Tier {
  name: string;
  minScore: number;
  maxScore: number;
  color: string;
  label: string;
}

const COLOR_OPTIONS = [
  { value: 'amber', label: 'Amber', class: 'bg-amber-500' },
  { value: 'green', label: 'Green', class: 'bg-green-500' },
  { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
  { value: 'red', label: 'Red', class: 'bg-red-500' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-500' },
];

export default function CreateScorecardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ did: string } | null>(null);
  const userDidRef = useRef<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tiers, setTiers] = useState<Tier[]>([
    { name: 'Beginner', minScore: 0, maxScore: 33, color: 'red', label: 'Getting Started' },
    { name: 'Intermediate', minScore: 34, maxScore: 66, color: 'amber', label: 'On Your Way' },
    { name: 'Advanced', minScore: 67, maxScore: 100, color: 'green', label: 'Expert Level' },
  ]);
  const [leadGatePosition, setLeadGatePosition] = useState<'after_quiz' | 'before_quiz' | 'none'>('after_quiz');
  const [requireEmail, setRequireEmail] = useState(true);
  const [requirePhone, setRequirePhone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(data => {
        if (!data) {
          router.push('/');
          return;
        }
        setUser(data);
        userDidRef.current = data.did;
        setLoading(false);
      })
      .catch(() => router.push('/'));
  }, [router]);

  const addTier = () => {
    setTiers(prev => [...prev, { name: '', minScore: 0, maxScore: 100, color: 'amber', label: '' }]);
  };

  const removeTier = (i: number) => {
    setTiers(prev => prev.filter((_, idx) => idx !== i));
  };

  const updateTier = (i: number, field: keyof Tier, val: string | number) => {
    setTiers(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: val } : t));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    const res = await fetch('/api/scorecards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        tiers,
        leadGatePosition,
        requireEmail,
        requirePhone,
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      const sc = await res.json();
      router.push(`/create/questions/${sc.id}`);
    } else {
      alert('Failed to create scorecard.');
    }
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
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-2">Create Scorecard</h1>
        <p className="text-gray-400 text-sm mb-8">Set up your assessment framework. You'll add questions next.</p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-4">Basic Info</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Title <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Marketing Maturity Assessment"
                  required
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What is this assessment about?"
                  rows={3}
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </section>

          {/* Tiers */}
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wide">Scoring Tiers</h2>
              <button type="button" onClick={addTier} className="text-sm text-amber-400 hover:text-amber-300 font-medium">
                + Add Tier
              </button>
            </div>
            <div className="space-y-3">
              {tiers.map((tier, i) => (
                <div key={i} className="bg-gray-950 border border-gray-800 rounded-lg p-4">
                  <div className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-3">
                      <label className="block text-xs text-gray-400 mb-1">Name</label>
                      <input
                        type="text"
                        value={tier.name}
                        onChange={e => updateTier(i, 'name', e.target.value)}
                        placeholder="Tier name"
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-400 mb-1">Min Score</label>
                      <input
                        type="number"
                        value={tier.minScore}
                        onChange={e => updateTier(i, 'minScore', parseInt(e.target.value) || 0)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-400 mb-1">Max Score</label>
                      <input
                        type="number"
                        value={tier.maxScore}
                        onChange={e => updateTier(i, 'maxScore', parseInt(e.target.value) || 0)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-400 mb-1">Color</label>
                      <select
                        value={tier.color}
                        onChange={e => updateTier(i, 'color', e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      >
                        {COLOR_OPTIONS.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-400 mb-1">Label</label>
                      <input
                        type="text"
                        value={tier.label}
                        onChange={e => updateTier(i, 'label', e.target.value)}
                        placeholder="Display label"
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div className="col-span-1">
                      <button
                        type="button"
                        onClick={() => removeTier(i)}
                        disabled={tiers.length <= 1}
                        className="w-full py-2 text-red-400 hover:text-red-300 disabled:text-gray-700 text-sm"
                        title="Remove tier"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Lead Capture */}
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-4">Lead Capture</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">When to capture lead info</label>
                <div className="flex gap-4 flex-wrap">
                  <label className="flex items-center gap-2 bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 cursor-pointer hover:border-gray-600">
                    <input
                      type="radio"
                      name="leadGate"
                      value="none"
                      checked={leadGatePosition === 'none'}
                      onChange={() => setLeadGatePosition('none')}
                      className="accent-amber-500"
                    />
                    <span className="text-sm text-gray-300">No gate (ask after results)</span>
                  </label>
                  <label className="flex items-center gap-2 bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 cursor-pointer hover:border-gray-600">
                    <input
                      type="radio"
                      name="leadGate"
                      value="after_quiz"
                      checked={leadGatePosition === 'after_quiz'}
                      onChange={() => setLeadGatePosition('after_quiz')}
                      className="accent-amber-500"
                    />
                    <span className="text-sm text-gray-300">After quiz (gate results)</span>
                  </label>
                  <label className="flex items-center gap-2 bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 cursor-pointer hover:border-gray-600">
                    <input
                      type="radio"
                      name="leadGate"
                      value="before_quiz"
                      checked={leadGatePosition === 'before_quiz'}
                      onChange={() => setLeadGatePosition('before_quiz')}
                      className="accent-amber-500"
                    />
                    <span className="text-sm text-gray-300">Before quiz (gate the quiz)</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireEmail}
                    onChange={e => setRequireEmail(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                  <span className="text-sm text-gray-300">Require email</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requirePhone}
                    onChange={e => setRequirePhone(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                  <span className="text-sm text-gray-300">Require phone</span>
                </label>
              </div>
            </div>
          </section>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 border border-gray-700 text-gray-300 hover:border-gray-500 rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating…' : 'Create Scorecard →'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
