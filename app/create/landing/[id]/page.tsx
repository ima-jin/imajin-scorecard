'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Scorecard } from '@/db/schema';
import { LandingPage } from '@/components/LandingPage';

type ValueProp = { icon: string; title: string; description: string };
type Credibility = { bio: string; stats: string; research: string };
type Cta = { label: string; timeEstimate: string; resultPromise: string };
type LandingConfig = { hook: string; hookSubtext: string; valueProps: ValueProp[]; credibility: Credibility; cta: Cta };

export default function LandingEditorPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  const [user, setUser] = useState<{ did: string } | null>(null);
  const userDidRef = useRef<string | null>(null);
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [config, setConfig] = useState<LandingConfig>({
    hook: '',
    hookSubtext: '',
    valueProps: [
      { icon: '🎯', title: '', description: '' },
      { icon: '⚡', title: '', description: '' },
      { icon: '🔒', title: '', description: '' },
    ],
    credibility: { bio: '', stats: '', research: '' },
    cta: { label: 'Take the Assessment', timeEstimate: 'Takes 5 minutes', resultPromise: 'Get your score instantly' },
  });
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
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
        return fetch(`/api/scorecards/${id}`);
      })
      .then(r => r?.json())
      .then((sc: Scorecard & { questions?: unknown[] }) => {
        if (!sc) {
          router.push('/dashboard');
          return;
        }
        if (sc.creatorDid !== userDidRef.current) {
          router.push('/dashboard');
          return;
        }
        setScorecard(sc);
        const lc = sc.landingConfig as LandingConfig | undefined;
        if (lc) {
          setConfig({
            hook: lc.hook ?? sc.title ?? '',
            hookSubtext: lc.hookSubtext ?? sc.description ?? '',
            valueProps: lc.valueProps?.length === 3 ? lc.valueProps : [
              { icon: '🎯', title: '', description: '' },
              { icon: '⚡', title: '', description: '' },
              { icon: '🔒', title: '', description: '' },
            ],
            credibility: lc.credibility ?? { bio: '', stats: '', research: '' },
            cta: lc.cta ?? { label: 'Take the Assessment', timeEstimate: 'Takes 5 minutes', resultPromise: 'Get your score instantly' },
          });
        } else {
          setConfig(prev => ({
            ...prev,
            hook: sc.title ?? '',
            hookSubtext: sc.description ?? '',
          }));
        }
        setLoading(false);
      })
      .catch(() => router.push('/'));
  }, [id, router]);

  // Update user ref for the check above
  useEffect(() => {
    if (user && scorecard && scorecard.creatorDid !== user.did) {
      router.push('/dashboard');
    }
  }, [user, scorecard, router]);

  const updateValueProp = (i: number, field: keyof ValueProp, val: string) => {
    setConfig(prev => {
      const vps = [...prev.valueProps];
      vps[i] = { ...vps[i], [field]: val };
      return { ...prev, valueProps: vps };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch(`/api/scorecards/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ landingConfig: config }),
    });
    setSaving(false);
    if (!res.ok) {
      alert('Failed to save. Please try again.');
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="animate-pulse h-8 w-48 bg-gray-800 rounded" />
      </main>
    );
  }

  if (preview && scorecard) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="fixed top-14 left-0 right-0 z-40 bg-gray-900/90 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-300">Preview Mode</h2>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg text-sm disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setPreview(false)} className="px-3 py-1.5 border border-gray-700 text-gray-300 hover:border-gray-500 rounded-lg text-sm">
              Back to Editor
            </button>
          </div>
        </div>
        <div className="pt-28">
          <LandingPage scorecard={{ ...scorecard, landingConfig: config }} />
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Landing Page Editor</h1>
            <p className="text-gray-400 text-sm mt-1">Configure how your scorecard appears to respondents</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg text-sm disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setPreview(true)} className="px-4 py-2 border border-gray-700 text-gray-300 hover:border-gray-500 rounded-lg text-sm">
              Preview
            </button>
          </div>
        </div>

        {/* Hook */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-4">Hero Section</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Headline Hook</label>
              <input
                type="text"
                value={config.hook}
                onChange={e => setConfig(prev => ({ ...prev, hook: e.target.value }))}
                placeholder="e.g. What's Your Marketing Maturity Score?"
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Subtext</label>
              <textarea
                value={config.hookSubtext}
                onChange={e => setConfig(prev => ({ ...prev, hookSubtext: e.target.value }))}
                placeholder="Brief description of what they'll get..."
                rows={2}
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        </section>

        {/* Value Props */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-4">Value Propositions</h2>
          <div className="space-y-4">
            {config.valueProps.map((vp, i) => (
              <div key={i} className="bg-gray-950 border border-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Prop {i + 1}</span>
                </div>
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-400 mb-1">Icon</label>
                    <input
                      type="text"
                      value={vp.icon}
                      onChange={e => updateValueProp(i, 'icon', e.target.value)}
                      placeholder="🎯"
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-2 text-center text-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div className="col-span-5">
                    <label className="block text-xs text-gray-400 mb-1">Title</label>
                    <input
                      type="text"
                      value={vp.title}
                      onChange={e => updateValueProp(i, 'title', e.target.value)}
                      placeholder="Title"
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div className="col-span-5">
                    <label className="block text-xs text-gray-400 mb-1">Description</label>
                    <input
                      type="text"
                      value={vp.description}
                      onChange={e => updateValueProp(i, 'description', e.target.value)}
                      placeholder="Brief description"
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Credibility */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-4">Credibility</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Creator Bio</label>
              <textarea
                value={config.credibility.bio}
                onChange={e => setConfig(prev => ({ ...prev, credibility: { ...prev.credibility, bio: e.target.value } }))}
                placeholder="Who you are and why you built this assessment..."
                rows={3}
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Stats / Proof</label>
              <textarea
                value={config.credibility.stats}
                onChange={e => setConfig(prev => ({ ...prev, credibility: { ...prev.credibility, stats: e.target.value } }))}
                placeholder="e.g. 10,000+ assessments completed, 94% recommendation rate..."
                rows={2}
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Research & Methodology</label>
              <textarea
                value={config.credibility.research}
                onChange={e => setConfig(prev => ({ ...prev, credibility: { ...prev.credibility, research: e.target.value } }))}
                placeholder="How the assessment was developed..."
                rows={2}
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-4">Call to Action</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Button Label</label>
              <input
                type="text"
                value={config.cta.label}
                onChange={e => setConfig(prev => ({ ...prev, cta: { ...prev.cta, label: e.target.value } }))}
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Time Estimate</label>
              <input
                type="text"
                value={config.cta.timeEstimate}
                onChange={e => setConfig(prev => ({ ...prev, cta: { ...prev.cta, timeEstimate: e.target.value } }))}
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Result Promise</label>
              <input
                type="text"
                value={config.cta.resultPromise}
                onChange={e => setConfig(prev => ({ ...prev, cta: { ...prev.cta, resultPromise: e.target.value } }))}
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
