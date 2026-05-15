'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { SessionUser } from '@/lib/auth';

export function ImajinAuth() {
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

  const authUrl = process.env.NEXT_PUBLIC_IMAJIN_AUTH_URL ?? 'https://dev-www.imajin.ai';
  const appId = process.env.NEXT_PUBLIC_IMAJIN_APP_ID ?? '';

  if (loading) {
    return <div className="w-24 h-9 bg-gray-800/50 rounded-lg animate-pulse" />;
  }

  if (!user) {
    const signInUrl = `${authUrl}/auth/authorize?app_id=${appId}&scopes=profile:read`;
    return (
      <a
        href={signInUrl}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-amber-500/50 text-white font-medium rounded-lg transition-all text-sm"
      >
        <ImajinLogo className="w-4 h-4" />
        <span>Sign in with <strong className="text-amber-400">Imajin</strong></span>
      </a>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2.5 px-3 py-1.5 bg-gray-900/80 backdrop-blur border border-gray-700/50 rounded-lg">
        {user.avatar ? (
          <Image
            src={user.avatar}
            alt={user.displayName}
            width={24}
            height={24}
            className="rounded-full"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-black font-bold text-xs">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex flex-col leading-none">
          <span className="text-sm text-gray-100 font-medium">
            {user.displayName}
          </span>
          {user.handle && user.handle !== user.did && (
            <span className="text-[11px] text-amber-400">@{user.handle.replace(/^@/, '')}</span>
          )}
        </div>
      </div>
      <form action="/api/auth/logout" method="POST">
        <button
          type="submit"
          className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors"
          title="Sign out"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z" clipRule="evenodd" />
            <path fillRule="evenodd" d="M19 10a.75.75 0 0 0-.75-.75H8.704l1.048-.943a.75.75 0 1 0-1.004-1.114l-2.5 2.25a.75.75 0 0 0 0 1.114l2.5 2.25a.75.75 0 1 0 1.004-1.114l-1.048-.943h9.546A.75.75 0 0 0 19 10Z" clipRule="evenodd" />
          </svg>
        </button>
      </form>
    </div>
  );
}

/** Imajin logomark — amber orb */
function ImajinLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" fill="url(#imajin-grad)" />
      <defs>
        <radialGradient id="imajin-grad" cx="0.4" cy="0.35" r="0.65">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </radialGradient>
      </defs>
    </svg>
  );
}
