'use client';

import Link from 'next/link';
import type { Scorecard } from '@/db/schema';

interface LandingConfig {
  hook: string;
  hookSubtext: string;
  valueProps: { icon: string; title: string; description: string }[];
  credibility: { bio: string; stats: string; research: string };
  cta: { label: string; timeEstimate: string; resultPromise: string };
}

interface LandingPageProps {
  scorecard: Scorecard & { landingConfig?: LandingConfig };
}

export function LandingPage({ scorecard }: LandingPageProps) {
  const config = scorecard.landingConfig ?? {} as Partial<LandingConfig>;
  const {
    hook = scorecard.title,
    hookSubtext = scorecard.description ?? 'Take this quick assessment to discover where you stand.',
    valueProps = [
      { icon: '🎯', title: 'Personalized Results', description: 'Get insights tailored to your answers.' },
      { icon: '⚡', title: 'Quick & Easy', description: 'Takes just a few minutes to complete.' },
      { icon: '🔒', title: 'Privacy First', description: 'Your data stays yours. No spam, ever.' },
    ],
    credibility = { bio: '', stats: '', research: '' },
    cta = { label: 'Take the Assessment', timeEstimate: 'Takes 5 minutes', resultPromise: 'Get your score instantly' },
  } = config;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <section className="relative px-6 pt-20 pb-16 sm:pt-28 sm:pb-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            {hook}
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            {hookSubtext}
          </p>
          <Link
            href={`/scorecard/${scorecard.id}`}
            className="inline-flex items-center px-8 py-4 bg-amber-500 hover:bg-amber-600 text-black font-bold text-lg rounded-xl transition-colors shadow-lg shadow-amber-500/20"
          >
            {cta.label || 'Take the Assessment'}
            <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-500">
            <span>{cta.timeEstimate || 'Takes 5 minutes'}</span>
            <span className="text-gray-700">·</span>
            <span>{cta.resultPromise || 'Get your score instantly'}</span>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="px-6 py-16 border-t border-gray-800/50">
        <div className="max-w-4xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-6">
            {(valueProps.length > 0 ? valueProps : [
              { icon: '🎯', title: 'Personalized Results', description: 'Get insights tailored to your answers.' },
              { icon: '⚡', title: 'Quick & Easy', description: 'Takes just a few minutes to complete.' },
              { icon: '🔒', title: 'Privacy First', description: 'Your data stays yours. No spam, ever.' },
            ]).map((vp, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
                <div className="text-4xl mb-4">{vp.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{vp.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{vp.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credibility */}
      {(credibility.bio || credibility.stats || credibility.research) && (
        <section className="px-6 py-16 border-t border-gray-800/50">
          <div className="max-w-3xl mx-auto">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
              <h2 className="text-xl font-bold text-white mb-6">About This Assessment</h2>
              <div className="space-y-4">
                {credibility.bio && (
                  <div>
                    <h4 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-1">Creator</h4>
                    <p className="text-gray-300 leading-relaxed">{credibility.bio}</p>
                  </div>
                )}
                {credibility.stats && (
                  <div>
                    <h4 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-1">Results & Proof</h4>
                    <p className="text-gray-300 leading-relaxed">{credibility.stats}</p>
                  </div>
                )}
                {credibility.research && (
                  <div>
                    <h4 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-1">Research & Methodology</h4>
                    <p className="text-gray-300 leading-relaxed">{credibility.research}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Repeat */}
      <section className="px-6 py-20 border-t border-gray-800/50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Find Out?</h2>
          <p className="text-gray-400 mb-8">
            {cta.resultPromise || 'Get your personalized score and actionable insights in minutes.'}
          </p>
          <Link
            href={`/scorecard/${scorecard.id}`}
            className="inline-flex items-center px-8 py-4 bg-amber-500 hover:bg-amber-600 text-black font-bold text-lg rounded-xl transition-colors shadow-lg shadow-amber-500/20"
          >
            {cta.label || 'Take the Assessment'}
            <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <div className="mt-4 text-sm text-gray-500">
            {cta.timeEstimate || 'Takes 5 minutes'} · Free · No credit card required
          </div>
        </div>
      </section>
    </div>
  );
}
