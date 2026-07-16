'use client';

import { useState, useEffect } from 'react';

interface EconomicEvent {
  id: string;
  event: string;
  eventAr: string;
  country: string;
  time: string;
  impactLevel: number;
  forecast: string;
  previous: string;
  currency: string;
  affectedAssets: { symbol: string; direction: string }[];
}

export default function EconomicCalendar() {
  const [nextCountdown, setNextCountdown] = useState({ h: '00', m: '00', s: '00' });
  const [mounted, setMounted] = useState(false);
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    const fetchEvents = async () => {
        if (document.hidden) return; // V1020: skip polling when tab is hidden
      try {
        const res = await fetch('/api/markets/calendar', { cache: 'no-store' });
        const data = await res.json();
        if (data.events?.length > 0) setEvents(data.events);
      } catch { /* silent */ } finally { setLoading(false); }
    };
    fetchEvents();
    const interval = setInterval(fetchEvents, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const nextEvent = events.find(e => new Date(e.time).getTime() > Date.now());
    if (!nextEvent) return;
    const target = new Date(nextEvent.time).getTime();
    const interval = setInterval(() => {
      const diff = Math.max(0, target - Date.now());
      setNextCountdown({
        h: String(Math.floor(diff / 3600000)).padStart(2, '0'),
        m: String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0'),
        s: String(Math.floor((diff % 60000) / 1000)).padStart(2, '0'),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [events]);

  const nextEvent = mounted ? events.find(e => new Date(e.time).getTime() > Date.now()) : events[0];

  return (
    <section id="calendar" className="section-block">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="section-title">
          <h2>الأجندة الاقتصادية</h2>
          <span className="badge-live">
            <span className="live-dot" />
            LIVE
          </span>
        </div>

        {/* Next Event Countdown */}
        {nextEvent && (
          <div className="glass-card-elevated p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3"
            style={{ background: 'rgba(232,160,32,0.04)', border: '1px solid rgba(232,160,32,0.15)' }}>
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-medium" style={{ color: 'var(--gold)' }}>التالي: {nextEvent.eventAr}</span>
              <span className="text-[11px]" style={{ color: 'var(--text3)' }}>({nextEvent.country})</span>
            </div>
            <div className="flex items-center gap-1.5">
              {[
                { val: nextCountdown.h, label: 'س' },
                { val: nextCountdown.m, label: 'د' },
                { val: nextCountdown.s, label: 'ث' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-1">
                  <div className="font-mono-price text-lg font-bold px-2 py-1 rounded-lg" style={{ background: 'rgba(232,160,32,0.1)', color: 'var(--gold)' }}>
                    {item.val}
                  </div>
                  <span className="text-[9px]" style={{ color: 'var(--text3)' }}>{item.label}</span>
                  {i < 2 && <span className="mx-1" style={{ color: 'rgba(232,160,32,0.4)' }}>:</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card p-4" style={{ height: '80px' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="skeleton" style={{ width: '16px', height: '16px', borderRadius: '50%' }} />
                  <div className="skeleton" style={{ width: '40px', height: '10px' }} />
                  <div className="skeleton" style={{ width: '60%', height: '12px' }} />
                </div>
                <div className="flex items-center gap-2">
                  <div className="skeleton" style={{ width: '24px', height: '8px', borderRadius: '4px' }} />
                  <div className="skeleton" style={{ width: '36px', height: '8px', borderRadius: '4px' }} />
                  <div className="skeleton" style={{ width: '36px', height: '8px', borderRadius: '4px' }} />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-[13px]" style={{ color: 'var(--text3)' }}>لا توجد أحداث اقتصادية حالياً</span>
          </div>
        ) : (
          <div className="relative pe-8" style={{ borderInlineEnd: '2px solid rgba(0,201,167,0.15)' }}>
            {events.map((event) => {
              const eventTime = new Date(event.time);
              const isPast = mounted ? eventTime.getTime() < Date.now() : false;
              const impactColor = event.impactLevel === 3 ? 'var(--bear)' : event.impactLevel === 2 ? 'var(--gold)' : 'var(--bull)';

              return (
                <div key={event.id} className="relative mb-6 me-5">
                  <div className="absolute -end-[31px] top-4 w-3 h-3 rounded-full border-2"
                    style={{
                      borderColor: isPast ? 'var(--text3)' : impactColor,
                      background: isPast ? 'var(--text3)' : 'var(--bg)',
                      boxShadow: !isPast ? `0 0 8px ${impactColor}40` : 'none',
                    }} />

                  <div className="glass-card p-4 cursor-pointer transition-all duration-200 hover:bg-[var(--bg4)]">
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <div className="flex items-center gap-2 md:w-28 flex-shrink-0">
                        <span className="text-[12px]">{event.country}</span>
                        <span className="font-mono-price text-[12px]" style={{ color: 'var(--text3)' }} suppressHydrationWarning>
                          {mounted ? eventTime.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </span>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>{event.eventAr}</h3>
                          <span className="text-[10px]" style={{ color: 'var(--text3)' }}>({event.event})</span>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          <span className="text-[10px]" style={{ color: 'var(--text3)' }}>التأثير:</span>
                          {[1, 2, 3].map((level) => (
                            <span key={level} className="w-2.5 h-2.5 rounded-full" style={{
                              background: level <= event.impactLevel ? impactColor : 'rgba(255,255,255,0.06)',
                            }} />
                          ))}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {event.affectedAssets.map((a) => (
                            <span key={a.symbol} className="font-mono-price text-[10px] px-2 py-0.5 rounded-md font-medium" style={{
                              background: a.direction === 'up' ? 'var(--bull2)' : a.direction === 'down' ? 'var(--bear2)' : 'rgba(100,116,139,0.12)',
                              color: a.direction === 'up' ? 'var(--bull)' : a.direction === 'down' ? 'var(--bear)' : 'var(--text3)',
                            }}>
                              {a.symbol} {a.direction === 'up' ? '↑' : a.direction === 'down' ? '↓' : '↔'}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-[12px] flex-shrink-0">
                        <div>
                          <div className="text-[10px]" style={{ color: 'var(--text3)' }}>التوقع</div>
                          <div className="font-mono-price font-medium" style={{ color: 'var(--text)' }}>{event.forecast}</div>
                        </div>
                        <div>
                          <div className="text-[10px]" style={{ color: 'var(--text3)' }}>السابق</div>
                          <div className="font-mono-price" style={{ color: 'var(--text2)' }}>{event.previous}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
