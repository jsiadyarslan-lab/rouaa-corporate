'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Map as MapLibreMap, Popup as MapLibrePopup, GeoJSONSource } from 'maplibre-gl';
import {
  getRiskColor,
  getRiskLabel,
  getCountryName,
} from '@/lib/geopolitical/risk-thresholds';
import { Layers, Map as MapIcon, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/lib/geopolitical/i18n';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface CountryScore {
  countryCode: string;
  score?: number;
  compositeScore?: number;
  countryNameAr?: string;
  countryNameEn?: string;
  [key: string]: unknown;
}

export interface GeopoliticalEvent {
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  type?: string;
  eventType?: string;
  fatalities?: number;
  fatalityCount?: number;
  date?: string;
  eventDate?: string;
  title?: string;
  [key: string]: unknown;
}

export type MapViewMode = 'choropleth' | 'heatmap';

interface LayerToggle {
  key: string;
  labelAr: string;
  labelEn: string;
  enabled: boolean;
}

interface RiskMapProps {
  countryScores: CountryScore[];
  events: GeopoliticalEvent[];
  locale?: string;
  onCountrySelect?: (code: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getScore(cs: CountryScore): number {
  return cs.compositeScore ?? cs.score ?? 0;
}

function getEventLat(ev: GeopoliticalEvent): number {
  return ev.latitude ?? ev.lat ?? 0;
}

function getEventLng(ev: GeopoliticalEvent): number {
  return ev.longitude ?? ev.lng ?? 0;
}

function getEventType(ev: GeopoliticalEvent): string {
  return ev.eventType ?? ev.type ?? '';
}

function getEventFatalities(ev: GeopoliticalEvent): number {
  return ev.fatalityCount ?? ev.fatalities ?? 0;
}

function getEventDate(ev: GeopoliticalEvent): string {
  return ev.eventDate ?? ev.date ?? '';
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

// Module-level GeoJSON cache — prevents re-fetching ~100KB on every mount
let cachedGeoJson: any = null;

export default function RiskMap({
  countryScores,
  events,
  locale = 'ar',
  onCountrySelect,
}: RiskMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<MapLibrePopup | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const [viewMode, setViewMode] = useState<MapViewMode>('choropleth');
  const [layers, setLayers] = useState<LayerToggle[]>([
    { key: 'risk', labelAr: 'مخاطر الدول', labelEn: 'Country Risk', enabled: true },
    { key: 'events', labelAr: 'الأحداث', labelEn: 'Events', enabled: true },
    { key: 'routes', labelAr: 'طرق التجارة', labelEn: 'Trade Routes', enabled: false },
  ]);
  const [tooltipData, setTooltipData] = useState<{
    x: number;
    y: number;
    name: string;
    score: number;
    level: string;
  } | null>(null);

  const isRtl = locale === 'ar';

  // Build score lookup — useMemo instead of useCallback to cache the Map object
  const scoreLookup = useMemo(() => {
    const map = new Map<string, number>();
    countryScores.forEach((cs) => {
      const score = getScore(cs);
      map.set(cs.countryCode.toUpperCase(), score);
    });
    return map;
  }, [countryScores]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    let map: MapLibreMap;
    let cancelled = false;

    const initMap = async () => {
      try {
        const maplibregl = (await import('maplibre-gl')).default;

        if (cancelled) return;

        // Check WebGL support
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
          setMapError(t('map.webglError', locale));
          return;
        }

        if (!mapContainer.current) return;

        map = new maplibregl.Map({
          container: mapContainer.current,
          style: {
            version: 8,
            sources: {
              'carto-dark': {
                type: 'raster',
                tiles: [
                  'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
                  'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
                  'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
                ],
                tileSize: 256,
                attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
              },
            },
            layers: [
              {
                id: 'carto-dark-layer',
                type: 'raster',
                source: 'carto-dark',
                minzoom: 0,
                maxzoom: 19,
              },
            ],
          },
          center: [35, 28],
          zoom: 2.5,
          minZoom: 1.5,
          maxZoom: 10,
          attributionControl: false,
        });

        map.addControl(new maplibregl.NavigationControl(), isRtl ? 'top-left' : 'top-right');
        map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

        popupRef.current = new maplibregl.Popup({
          closeButton: true,
          closeOnClick: true,
          maxWidth: '260px',
          className: 'risk-map-popup',
        });

        // Handle map errors
        map.on('error', (e: any) => {
          console.error('[RiskMap] Map error:', e.error || e);
          setMapError(t('map.loadingError', locale));
        });

        map.on('load', () => {
          if (cancelled) return;
          mapRef.current = map;
          setMapReady(true);
          console.log('[RiskMap] Map loaded successfully');

        // Fetch world GeoJSON for choropleth — lightweight TopoJSON first, CDN fallback
        // Using world-atlas 110m (~100KB TopoJSON) instead of 23MB full GeoJSON
        const geoJsonSources = [
          'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json',
          'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_0_countries.geojson',
        ];

        const tryFetchGeoJson = async (): Promise<any> => {
          // Return cached data if available
          if (cachedGeoJson) return cachedGeoJson;

          for (const url of geoJsonSources) {
            try {
              const res = await fetch(url);
              if (!res.ok) continue;
              const data = await res.json();
              // Handle TopoJSON format (world-atlas) — convert to GeoJSON
              if (data.type === 'Topology' && data.objects) {
                // Dynamic import of topojson-client for conversion
                const topojson = await import('topojson-client');
                const geojson: any = topojson.feature(data, data.objects.countries || data.objects[Object.keys(data.objects)[0]]);
                if ((geojson as any).features && (geojson as any).features.length > 0) {
                  cachedGeoJson = geojson; // Cache for repeat visits
                  return geojson;
                }
              }
              // Handle regular GeoJSON format
              if (data.features && data.features.length > 0) {
                cachedGeoJson = data; // Cache for repeat visits
                return data;
              }
            } catch {
              continue;
            }
          }
          throw new Error('All GeoJSON sources failed');
        };

        tryFetchGeoJson()
          .then((geojson) => {
            if (!map || !map.getStyle()) return;
            console.log(`[RiskMap] GeoJSON loaded: ${geojson.features?.length || 0} features`);

            const lookup = scoreLookup;
            const enrichedFeatures = geojson.features.map(
              (feature: Record<string, unknown>) => {
                // Try ISO_A2 first (GeoJSON format), then ISO_N3 numeric code (world-atlas TopoJSON)
                const props = feature.properties as Record<string, unknown>;
                const isoA2 = String(props?.iso_a2 ?? props?.ISO_A2 ?? props?.id ?? '').toUpperCase();
                const isoA3 = String(props?.iso_a3 ?? props?.ISO_A3 ?? '');
                const score = lookup.get(isoA2) ?? (isoA3 ? lookup.get(isoA3.substring(0, 2)) : 0) ?? 0;
                return {
                  ...feature,
                  properties: {
                    ...props,
                    riskScore: score,
                    isoCode: isoA2 || isoA3,
                  },
                };
              }
            );
            const enrichedGeoJson = { ...geojson, features: enrichedFeatures };

            map.addSource('countries', {
              type: 'geojson',
              data: enrichedGeoJson,
            });

            map.addLayer({
              id: 'countries-fill',
              type: 'fill',
              source: 'countries',
              paint: {
                'fill-color': [
                  'case',
                  ['==', ['get', 'riskScore'], 0],
                  'rgba(255,255,255,0.03)',
                  [
                    'interpolate',
                    ['linear'],
                    ['get', 'riskScore'],
                    0,
                    'rgba(34,197,94,0.4)',
                    20,
                    'rgba(34,197,94,0.55)',
                    40,
                    'rgba(255,184,0,0.55)',
                    60,
                    'rgba(255,152,0,0.55)',
                    80,
                    'rgba(239,83,80,0.6)',
                    100,
                    'rgba(183,28,28,0.7)',
                  ],
                ],
                'fill-opacity': 1,
              },
            });

            map.addLayer({
              id: 'countries-border',
              type: 'line',
              source: 'countries',
              paint: {
                'line-color': 'rgba(255,255,255,0.08)',
                'line-width': 0.5,
              },
            });

            // Add event markers source
            const eventFeatures = events.map((ev) => ({
              type: 'Feature' as const,
              geometry: {
                type: 'Point' as const,
                coordinates: [getEventLng(ev), getEventLat(ev)],
              },
              properties: {
                type: getEventType(ev),
                fatalities: getEventFatalities(ev),
                date: getEventDate(ev),
                title: ev.title ?? '',
              },
            }));

            map.addSource('events', {
              type: 'geojson',
              data: {
                type: 'FeatureCollection',
                features: eventFeatures,
              },
            });

            map.addLayer({
              id: 'events-circle',
              type: 'circle',
              source: 'events',
              paint: {
                'circle-radius': [
                  'interpolate',
                  ['linear'],
                  ['get', 'fatalities'],
                  0,
                  4,
                  50,
                  8,
                  500,
                  14,
                ],
                'circle-color': [
                  'case',
                  ['>=', ['get', 'fatalities'], 100],
                  '#EF5350',
                  ['>=', ['get', 'fatalities'], 10],
                  '#FF9800',
                  '#FFB800',
                ],
                'circle-opacity': 0.75,
                'circle-stroke-color': 'rgba(0,0,0,0.4)',
                'circle-stroke-width': 1,
              },
            });
          })
          .catch((err) => {
            console.error('[RiskMap] GeoJSON fetch failed:', err);
            setMapError(t('map.dataError', locale));
          });
      });

      // Country hover tooltip
      map.on('mousemove', 'countries-fill', (e) => {
        if (!e.features || e.features.length === 0) return;
        const props = e.features[0].properties as Record<string, unknown>;
        const isoA2 = String(
          props?.iso_a2 ?? props?.ISO_A2 ?? ''
        ).toUpperCase();
        const score = Number(props?.riskScore ?? 0);
        if (score === 0) {
          setTooltipData(null);
          map.getCanvas().style.cursor = '';
          return;
        }
        const name = getCountryName(isoA2, locale);
        const level = getRiskLabel(score, locale);
        setTooltipData({
          x: e.point.x,
          y: e.point.y,
          name,
          score,
          level,
        });
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', 'countries-fill', () => {
        setTooltipData(null);
        map.getCanvas().style.cursor = '';
      });

      // Country click
      map.on('click', 'countries-fill', (e) => {
        if (!e.features || e.features.length === 0) return;
        const props = e.features[0].properties as Record<string, unknown>;
        const isoA2 = String(
          props?.iso_a2 ?? props?.ISO_A2 ?? ''
        ).toUpperCase();
        if (isoA2 && onCountrySelect) {
          onCountrySelect(isoA2);
        }
      });

      // Event marker click popup
      map.on('click', 'events-circle', (e) => {
        if (!e.features || e.features.length === 0) return;
        const props = e.features[0].properties as Record<string, unknown>;
        const fatalities = Number(props?.fatalities ?? 0);
        const evType = String(props?.type ?? '');
        const evDate = String(props?.date ?? '');
        const evTitle = String(props?.title ?? '');

        const html = `
          <div style="background:var(--bg3);color:var(--text);padding:8px;border-radius:8px;font-family:inherit;">
            <div style="font-weight:700;color:var(--text-head);margin-bottom:4px;">${evTitle || evType}</div>
            <div style="font-size:12px;color:var(--text2);">${evType}</div>
            <div style="font-size:11px;color:var(--text3);margin-top:2px;">${evDate}</div>
            ${fatalities > 0 ? `<div style="font-size:12px;color:var(--bear);margin-top:4px;font-weight:600;">${locale === 'ar' ? 'الضحايا' : 'Fatalities'}: ${fatalities}</div>` : ''}
          </div>
        `;

        popupRef.current
          ?.setLngLat(e.lngLat)
          .setHTML(html)
          .addTo(map);
      });
      } catch (err) {
        console.error('[RiskMap] Failed to initialize map:', err);
        if (!cancelled) {
          setMapError(t('map.initError', locale));
        }
      }
    };

    initMap();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update choropleth colors when scores change — use setFeatureState()
  // for lightweight property updates instead of recreating all 180+ feature objects
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    // Check if the countries source and fill layer exist
    const source = map.getSource('countries') as GeoJSONSource | undefined;
    const fillLayer = map.getLayer('countries-fill');
    if (!source || !fillLayer) return;

    try {
      // Use setFeatureState for efficient per-feature property updates
      // This avoids recreating all 180+ GeoJSON feature objects on every score change
      for (const cs of countryScores) {
        const isoA2 = cs.countryCode?.toUpperCase();
        if (!isoA2) continue;
        const score = getScore(cs);
        
        map.setFeatureState(
          { source: 'countries', id: isoA2 },
          { riskScore: score }
        );
      }
    } catch {
      // Fallback: if setFeatureState fails (e.g. source doesn't support feature states),
      // fall back to setData() approach
      try {
        const existingData = source.serialize?.()?.data as GeoJSON.FeatureCollection | undefined;
        if (!existingData?.features) return;

        const lookup = scoreLookup;
        const enrichedFeatures = existingData.features.map(
          (feature) => {
            const props = (feature.properties || {}) as Record<string, unknown>;
            const isoA2 = String(props?.iso_a2 ?? props?.ISO_A2 ?? props?.id ?? '').toUpperCase();
            const isoA3 = String(props?.iso_a3 ?? props?.ISO_A3 ?? '');
            const score = lookup.get(isoA2) ?? (isoA3 ? lookup.get(isoA3.substring(0, 2)) : 0) ?? 0;
            return {
              ...feature,
              properties: {
                ...props,
                riskScore: score,
                isoCode: isoA2 || isoA3,
              },
            };
          }
        );
        source.setData({
          ...existingData,
          features: enrichedFeatures,
        });
      } catch {
        // silently ignore — map may be in transition
      }
    }
  }, [countryScores, scoreLookup, mapReady]);

  // Update events when they change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !map.getSource('events')) return;

    const eventFeatures = events.map((ev) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [getEventLng(ev), getEventLat(ev)],
      },
      properties: {
        type: getEventType(ev),
        fatalities: getEventFatalities(ev),
        date: getEventDate(ev),
        title: ev.title ?? '',
      },
    }));

    (map.getSource('events') as GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: eventFeatures,
    });
  }, [events]);

  // Layer toggling
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const riskLayer = map.getLayer('countries-fill');
    const borderLayer = map.getLayer('countries-border');
    const eventLayer = map.getLayer('events-circle');

    const riskEnabled = layers.find((l) => l.key === 'risk')?.enabled ?? true;
    const eventsEnabled = layers.find((l) => l.key === 'events')?.enabled ?? true;

    if (riskLayer) map.setLayoutProperty('countries-fill', 'visibility', riskEnabled ? 'visible' : 'none');
    if (borderLayer) map.setLayoutProperty('countries-border', 'visibility', riskEnabled ? 'visible' : 'none');
    if (eventLayer) map.setLayoutProperty('events-circle', 'visibility', eventsEnabled ? 'visible' : 'none');
  }, [layers]);

  // View mode switch
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const fillLayer = map.getLayer('countries-fill');
    if (!fillLayer) return;

    if (viewMode === 'choropleth') {
      map.setPaintProperty('countries-fill', 'fill-color', [
        'case',
        ['==', ['get', 'riskScore'], 0],
        'rgba(255,255,255,0.03)',
        [
          'interpolate',
          ['linear'],
          ['get', 'riskScore'],
          0,
          'rgba(34,197,94,0.4)',
          20,
          'rgba(34,197,94,0.55)',
          40,
          'rgba(255,184,0,0.55)',
          60,
          'rgba(255,152,0,0.55)',
          80,
          'rgba(239,83,80,0.6)',
          100,
          'rgba(183,28,28,0.7)',
        ],
      ]);
    } else {
      map.setPaintProperty('countries-fill', 'fill-color', [
        'case',
        ['==', ['get', 'riskScore'], 0],
        'rgba(255,255,255,0.02)',
        [
          'interpolate',
          ['linear'],
          ['get', 'riskScore'],
          0,
          'rgba(0,0,50,0.3)',
          20,
          'rgba(0,50,100,0.4)',
          40,
          'rgba(100,0,150,0.5)',
          60,
          'rgba(200,50,0,0.55)',
          80,
          'rgba(255,100,0,0.6)',
          100,
          'rgba(255,200,0,0.7)',
        ],
      ]);
    }
  }, [viewMode]);

  const toggleLayer = useCallback((key: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.key === key ? { ...l, enabled: !l.enabled } : l))
    );
  }, []);

  return (
    <div className="relative rounded-xl border overflow-hidden" style={{ background: 'var(--bg2)', borderColor: 'var(--rim)' }}>
      {/* Map container */}
      <div
        ref={mapContainer}
        className="w-full h-[500px] lg:h-[600px]"
        style={{ background: '#050810' }}
      />

      {/* Error state */}
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center z-30" style={{ background: 'rgba(5,8,16,0.85)' }}>
          <div className="text-center">
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🗺️</div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text3)' }}>{mapError}</p>
            <button
              onClick={() => { setMapError(null); window.location.reload(); }}
              className="mt-2 text-xs px-3 py-1.5 rounded-lg"
              style={{ color: 'var(--cyan)', background: 'var(--cyan2)', border: '1px solid rgba(0,229,255,.15)' }}
            >
              {t('map.retry', locale)}
            </button>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {tooltipData && (
        <div
          className="absolute pointer-events-none z-20 rounded-lg px-3 py-2 shadow-xl"
          style={{
            left: tooltipData.x + 12,
            top: tooltipData.y - 10,
            background: 'var(--bg3)',
            border: '1px solid var(--rim)',
            color: 'var(--text)',
            minWidth: '120px',
          }}
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          <p className="text-sm font-bold" style={{ color: 'var(--text-head)' }}>
            {tooltipData.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: getRiskColor(tooltipData.score) }}
            />
            <span className="text-xs font-semibold" style={{ color: getRiskColor(tooltipData.score) }}>
              {tooltipData.score} — {tooltipData.level}
            </span>
          </div>
        </div>
      )}

      {/* View mode toggle */}
      <div
        className="absolute top-3 z-10 flex gap-1 rounded-lg p-1"
        style={{
          background: 'var(--bg3)',
          border: '1px solid var(--rim)',
          [isRtl ? 'left' : 'right']: '12px',
        }}
      >
        <button
          onClick={() => setViewMode('choropleth')}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
            viewMode === 'choropleth'
              ? 'text-[var(--text-head)]'
              : 'text-[var(--text3)] hover:text-[var(--text2)]'
          )}
          style={{
            background: viewMode === 'choropleth' ? 'var(--bg5)' : 'transparent',
          }}
        >
          <MapIcon className="w-3.5 h-3.5" />
          {t('map.risk', locale)}
        </button>
        <button
          onClick={() => setViewMode('heatmap')}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
            viewMode === 'heatmap'
              ? 'text-[var(--text-head)]'
              : 'text-[var(--text3)] hover:text-[var(--text2)]'
          )}
          style={{
            background: viewMode === 'heatmap' ? 'var(--bg5)' : 'transparent',
          }}
        >
          <Flame className="w-3.5 h-3.5" />
          {t('map.heat', locale)}
        </button>
      </div>

      {/* Layer toggle panel */}
      <div
        className="absolute bottom-3 z-10 rounded-lg p-2"
        style={{
          background: 'var(--bg3)',
          border: '1px solid var(--rim)',
          [isRtl ? 'right' : 'left']: '12px',
        }}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center gap-1.5 mb-1.5">
          <Layers className="w-3.5 h-3.5" style={{ color: 'var(--text3)' }} />
          <span className="text-[10px] font-semibold uppercase" style={{ color: 'var(--text3)' }}>
            {t('map.layers', locale)}
          </span>
        </div>
        {layers.map((layer) => (
          <button
            key={layer.key}
            onClick={() => toggleLayer(layer.key)}
            className="flex items-center gap-2 w-full rounded px-2 py-1 text-xs transition-colors hover:bg-[var(--bg5)]"
            style={{ color: layer.enabled ? 'var(--text)' : 'var(--text3)' }}
          >
            <span
              className="w-3 h-3 rounded-sm border flex items-center justify-center"
              style={{
                borderColor: layer.enabled ? 'var(--cyan)' : 'var(--text3)',
                background: layer.enabled ? 'var(--cyan)' : 'transparent',
              }}
            >
              {layer.enabled && (
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1 4L3 6L7 2" stroke="var(--bg)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            {t(layer.key === 'risk' ? 'map.countryRisk' : layer.key === 'events' ? 'map.eventsLayer' : 'map.tradeRoutesLayer', locale)}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div
        className="absolute bottom-3 z-10 rounded-lg p-2"
        style={{
          background: 'var(--bg3)',
          border: '1px solid var(--rim)',
          [isRtl ? 'left' : 'right']: '12px',
        }}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <span className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--text3)' }}>
          {t('map.riskScale', locale)}
        </span>
        <div className="flex items-center gap-0.5">
          {[
            { color: 'rgba(34,197,94,0.7)', label: t('map.low', locale) },
            { color: 'rgba(255,184,0,0.7)', label: t('map.moderate', locale) },
            { color: 'rgba(255,152,0,0.7)', label: t('map.elevated', locale) },
            { color: 'rgba(239,83,80,0.7)', label: t('map.high', locale) },
            { color: 'rgba(183,28,28,0.8)', label: t('map.critical', locale) },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-6 h-3" style={{ background: item.color, borderRadius: i === 0 ? '3px 0 0 3px' : i === 4 ? '0 3px 3px 0' : '0' }} />
              <span className="text-[8px] mt-0.5" style={{ color: 'var(--text3)' }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* MapLibre GL CSS override for dark theme popups */}
      <style jsx global>{`
        .maplibregl-popup-content {
          background: var(--bg3) !important;
          border: 1px solid var(--rim) !important;
          border-radius: 8px !important;
          padding: 0 !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
        }
        .maplibregl-popup-tip {
          border-top-color: var(--bg3) !important;
        }
        .maplibregl-popup-close-button {
          color: var(--text3) !important;
          font-size: 18px !important;
          right: 6px !important;
          top: 4px !important;
        }
        .maplibregl-ctrl-group {
          background: var(--bg3) !important;
          border: 1px solid var(--rim) !important;
        }
        .maplibregl-ctrl-group button {
          border-color: var(--rim) !important;
        }
        .maplibregl-ctrl-group button span {
          filter: invert(0.85) !important;
        }
        .maplibregl-ctrl-attrib {
          background: rgba(5,8,16,0.7) !important;
          color: var(--text3) !important;
        }
        .maplibregl-ctrl-attrib a {
          color: var(--cyan) !important;
        }
      `}</style>
    </div>
  );
}
