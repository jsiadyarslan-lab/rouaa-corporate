'use client';

import { useState } from 'react';

export default function NotFoundSearchInput() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="mb-6">
      <div className="relative">
        <svg className="absolute right-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث في رؤى..."
          aria-label="البحث في الموقع"
          className="w-full pr-9 pl-4 py-2.5 rounded-xl text-[12px] outline-none transition-all focus:ring-1"
          style={{ background: 'var(--bg4)', border: '1px solid var(--border)', color: 'var(--text)', '--tw-ring-color': 'var(--cyan)' } as any}
        />
      </div>
    </div>
  );
}
