'use client';

import { useRef, useEffect, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Map as MapLibreMap, GeoJSONSource } from 'maplibre-gl';
import { t } from '@/lib/geopolitical/i18n';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface HeatmapEvent {
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  intensity?: number;
  [key: string]: unknown;
}

interface HeatmapLayerProps {
  events: HeatmapEvent[];
  visible?: boolean;
  radius?: number;
  opacity?: number;
  locale?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getLat(ev: HeatmapEvent): number {
  return ev.latitude ?? ev.lat ?? 0;
}

function getLng(ev: HeatmapEvent): number {
  return ev.longitude ?? ev.lng ?? 0;
}

function getIntensity(ev: HeatmapEvent): number {
  if (ev.intensity !== undefined) return ev.intensity;
  const fatalities = (ev as Record<string, unknown>).fatalityCount ??
    (ev as Record<string, unknown>).fatalities ?? 1;
  return Math.max(1, Number(fatalities));
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function HeatmapLayer({
  events,
  visible = true,
  radius = 25000,
  opacity = 0.8,
  locale = 'ar',
}: HeatmapLayerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const isRtl = locale === 'ar';

  // Initialize MapLibre map in standalone mode
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    let map: MapLibreMap;

    const initMap = async () => {
      const maplibregl = (await import('maplibre-gl')).default;

      map = new maplibregl.Map({
        container: mapContainer.current!,
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

      map.addControl(
        new maplibregl.NavigationControl(),
        isRtl ? 'top-left' : 'top-right'
      );
      map.addControl(
        new maplibregl.AttributionControl({ compact: true }),
        'bottom-right'
      );

      map.on('load', () => {
        mapRef.current = map;
        setMapReady(true);
      });
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current?.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRtl]);

  // Update heatmap data when events change — use setData() for incremental updates
  // instead of removing/re-adding source+layer (avoids GPU churn)
  useEffect(() => {
    const activeMap = mapRef.current;
    if (!activeMap || !mapReady) return;

    const features = events.map((ev) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [getLng(ev), getLat(ev)],
      },
      properties: {
        intensity: getIntensity(ev),
      },
    }));

    const geojsonData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features,
    };

    // If source already exists, just update the data
    const existingSource = activeMap.getSource('heatmap-source') as GeoJSONSource | undefined;
    if (existingSource) {
      existingSource.setData(geojsonData);
      return;
    }

    // First time: create source and layer
    activeMap.addSource('heatmap-source', {
      type: 'geojson',
      data: geojsonData,
    });

    activeMap.addLayer(
      {
        id: 'heatmap-layer',
        type: 'heatmap',
        source: 'heatmap-source',
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'intensity'],
            0,
            0,
            100,
            1,
          ],
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0,
            0.8,
            9,
            2,
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(0,0,50,0)',
            0.2,
            'rgba(0,50,150,0.6)',
            0.4,
            'rgba(0,150,136,0.7)',
            0.6,
            'rgba(100,200,50,0.8)',
            0.8,
            'rgba(255,180,0,0.9)',
            1,
            'rgba(255,60,30,1)',
          ],
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0,
            Math.max(4, radius / 5000),
            9,
            Math.max(15, radius / 1000),
          ],
          'heatmap-opacity': opacity,
        },
      },
      // Insert below the first symbol layer for better rendering
      (() => {
        const layers = activeMap.getStyle()?.layers;
        if (!layers) return undefined;
        let firstSymbolId: string | undefined;
        for (const layer of layers) {
          if (layer.type === 'symbol') {
            firstSymbolId = layer.id;
            break;
          }
        }
        return firstSymbolId;
      })()
    );
  }, [events, mapReady]);

  // Update radius/opacity without recreating the layer
  useEffect(() => {
    const activeMap = mapRef.current;
    if (!activeMap || !mapReady || !activeMap.getLayer('heatmap-layer')) return;

    activeMap.setPaintProperty('heatmap-layer', 'heatmap-radius', [
      'interpolate',
      ['linear'],
      ['zoom'],
      0,
      Math.max(4, radius / 5000),
      9,
      Math.max(15, radius / 1000),
    ]);
    activeMap.setPaintProperty('heatmap-layer', 'heatmap-opacity', opacity);
  }, [radius, opacity, mapReady]);

  // Visibility toggle
  useEffect(() => {
    const activeMap = mapRef.current;
    if (!activeMap) return;

    if (activeMap.getLayer('heatmap-layer')) {
      activeMap.setLayoutProperty(
        'heatmap-layer',
        'visibility',
        visible ? 'visible' : 'none'
      );
    }
  }, [visible]);

  return (
    <div className="relative rounded-xl border overflow-hidden" style={{ background: 'var(--bg2)', borderColor: 'var(--rim)' }}>
      <div
        ref={mapContainer}
        className="w-full h-[500px] lg:h-[600px]"
        style={{ background: '#050810' }}
      />

      {/* Color scale legend */}
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
          {t('heatmap.eventDensity', locale)}
        </span>
        <div className="flex items-center gap-0.5">
          {[
            { color: 'rgba(0,0,50,0.8)', label: t('heatmap.lowDensity', locale) },
            { color: 'rgba(0,150,136,0.8)', label: '' },
            { color: 'rgba(100,200,50,0.8)', label: t('heatmap.medDensity', locale) },
            { color: 'rgba(255,180,0,0.9)', label: '' },
            { color: 'rgba(255,60,30,1)', label: t('heatmap.highDensity', locale) },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-6 h-3" style={{ background: item.color, borderRadius: i === 0 ? '3px 0 0 3px' : i === 4 ? '0 3px 3px 0' : '0' }} />
              {item.label && (
                <span className="text-[8px] mt-0.5" style={{ color: 'var(--text3)' }}>
                  {item.label}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* MapLibre GL CSS override for dark theme */}
      <style jsx global>{`
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
