'use client';

import { useCallback, useMemo } from 'react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface TimelineSliderProps {
  /** New API: date range via string dates */
  startDate?: string;
  endDate?: string;
  onRangeChange?: (start: string, end: string) => void;
  /** Legacy API: date range via numeric timestamps */
  dateRange?: [number, number];
  onDateRangeChange?: (range: [number, number]) => void;
  /** Legacy API: events array to infer min/max dates */
  events?: Array<{ eventDate?: string; date?: string; [key: string]: unknown }>;
  locale?: string;
  minDate?: string;
  maxDate?: string;
}

function dateToDays(dateStr: string): number {
  return Math.floor(new Date(dateStr).getTime() / (1000 * 60 * 60 * 24));
}

function daysToDate(days: number): string {
  const d = new Date(days * 1000 * 60 * 60 * 24);
  return d.toISOString().split('T')[0];
}

function msToDays(ms: number): number {
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function daysToMs(days: number): number {
  return days * 1000 * 60 * 60 * 24;
}

function formatDate(dateStr: string, locale: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(locale === 'ar' ? 'ar-SA' : locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatMs(ms: number, locale: string): string {
  try {
    const d = new Date(ms);
    return d.toLocaleDateString(locale === 'ar' ? 'ar-SA' : locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function TimelineSlider({
  startDate,
  endDate,
  onRangeChange,
  dateRange,
  onDateRangeChange,
  events,
  locale = 'en',
  minDate,
  maxDate,
}: TimelineSliderProps) {
  const isRtl = locale === 'ar';

  // Determine if we're in legacy mode or new mode
  const isLegacyMode = dateRange !== undefined || onDateRangeChange !== undefined;

  // Compute bounds
  const computedMinDate = useMemo(() => {
    if (minDate) return minDate;
    if (events && events.length > 0) {
      const dates = events
        .map((e) => e.eventDate ?? e.date)
        .filter(Boolean)
        .sort();
      return dates[0] ?? '2024-01-01';
    }
    return '2024-01-01';
  }, [minDate, events]);

  const computedMaxDate = useMemo(() => {
    if (maxDate) return maxDate;
    if (events && events.length > 0) {
      const dates = events
        .map((e) => e.eventDate ?? e.date)
        .filter(Boolean)
        .sort();
      return dates[dates.length - 1] ?? '2026-12-31';
    }
    return '2026-12-31';
  }, [maxDate, events]);

  const minDays = useMemo(() => dateToDays(computedMinDate), [computedMinDate]);
  const maxDays = useMemo(() => dateToDays(computedMaxDate), [computedMaxDate]);

  // Current values (support both APIs)
  const currentValues = useMemo((): [number, number] => {
    if (isLegacyMode && dateRange) {
      return [msToDays(dateRange[0]), msToDays(dateRange[1])];
    }
    const start = startDate ? dateToDays(startDate) : minDays;
    const end = endDate ? dateToDays(endDate) : maxDays;
    return [start, end];
  }, [isLegacyMode, dateRange, startDate, endDate, minDays, maxDays]);

  const handleChange = useCallback(
    (values: number[]) => {
      if (values.length !== 2) return;

      if (isLegacyMode && onDateRangeChange) {
        onDateRangeChange([daysToMs(values[0]), daysToMs(values[1])]);
      } else if (onRangeChange) {
        onRangeChange(daysToDate(values[0]), daysToDate(values[1]));
      }
    },
    [isLegacyMode, onDateRangeChange, onRangeChange]
  );

  // Generate month markers
  const markers = useMemo(() => {
    const result: { days: number; label: string }[] = [];
    const start = new Date(computedMinDate);
    const end = new Date(computedMaxDate);
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    while (current <= end) {
      const d = current.toISOString().split('T')[0];
      result.push({
        days: dateToDays(d),
        label: current.toLocaleDateString(locale === 'ar' ? 'ar-SA' : locale, {
          month: 'short',
          year: '2-digit',
        }),
      });
      current.setMonth(current.getMonth() + 3);
    }
    return result;
  }, [computedMinDate, computedMaxDate, locale]);

  // Format display values
  const displayStart = isLegacyMode && dateRange
    ? formatMs(dateRange[0], locale)
    : formatDate(startDate ?? computedMinDate, locale);

  const displayEnd = isLegacyMode && dateRange
    ? formatMs(dateRange[1], locale)
    : formatDate(endDate ?? computedMaxDate, locale);

  return (
    <div
      className="rounded-xl border p-4"
      style={{ background: 'var(--bg3)', borderColor: 'var(--rim)' }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Date labels */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-sm font-semibold tabular-nums"
          style={{ color: 'var(--cyan)' }}
        >
          {displayStart}
        </span>
        <span className="text-xs" style={{ color: 'var(--text3)' }}>
          {isRtl ? 'إلى' : 'to'}
        </span>
        <span
          className="text-sm font-semibold tabular-nums"
          style={{ color: 'var(--cyan)' }}
        >
          {displayEnd}
        </span>
      </div>

      {/* Slider */}
      <Slider
        min={minDays}
        max={maxDays}
        value={currentValues}
        onValueChange={handleChange}
        step={1}
        className="w-full"
      />

      {/* Month markers */}
      <div className="relative mt-2 h-4">
        {markers.map((marker, idx) => {
          const pct = ((marker.days - minDays) / (maxDays - minDays)) * 100;
          return (
            <span
              key={idx}
              className="absolute text-[9px] whitespace-nowrap"
              style={{
                left: `${pct}%`,
                color: 'var(--text3)',
                transform: 'translateX(-50%)',
              }}
            >
              {marker.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
