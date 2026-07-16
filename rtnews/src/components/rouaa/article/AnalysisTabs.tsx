// ─── Analysis Tabs ────────────────────────────────────────────
// Tabbed interface for AI analysis sections
'use client';

import { useState } from 'react';

interface AnalysisTabsProps {
  overview: React.ReactNode;
  detailed: React.ReactNode;
  assets: React.ReactNode;
  recommendations: React.ReactNode;
}

const tabs = [
  { id: 'overview', label: 'نظرة عامة', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4' },
  { id: 'detailed', label: 'تحليل مفصل', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: 'assets', label: 'الأصول', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
  { id: 'recommendations', label: 'التوصيات', icon: 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3' },
];

export function AnalysisTabs({ overview, detailed, assets, recommendations }: AnalysisTabsProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const contentMap: Record<string, React.ReactNode> = {
    overview,
    detailed,
    assets,
    recommendations,
  };

  return (
    <div>
      {/* Tab buttons */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium transition-all duration-200 whitespace-nowrap"
            style={{
              background: activeTab === tab.id ? 'var(--cyan2)' : 'transparent',
              color: activeTab === tab.id ? 'var(--cyan)' : 'var(--text3)',
              border: `1px solid ${activeTab === tab.id ? 'rgba(0,201,167,0.25)' : 'var(--border)'}`,
              fontWeight: activeTab === tab.id ? 700 : 400,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="transition-opacity duration-300">
        {contentMap[activeTab]}
      </div>
    </div>
  );
}
