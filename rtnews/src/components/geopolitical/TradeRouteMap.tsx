'use client';

import { useRef, useEffect, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Map as MapLibreMap, Popup as MapLibrePopup, GeoJSONSource } from 'maplibre-gl';
import { X, Anchor } from 'lucide-react';
import type { TradeRoute as DataTradeRoute, Chokepoint } from '@/lib/geopolitical/trade-routes-data';
import { t } from '@/lib/geopolitical/i18n';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type RouteStatus = 'normal' | 'disrupted' | 'threatened' | 'blocked';

export interface TradeRouteMapProps {
  routes: DataTradeRoute[];
  locale: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const STATUS_COLORS: Record<RouteStatus, string> = {
  normal: '#22C55E',
  disrupted: '#EF5350',
  threatened: '#FF9800',
  blocked: '#7F1D1D',
};

const STATUS_GLOW: Record<RouteStatus, string> = {
  normal: 'rgba(34,197,94,0.3)',
  disrupted: 'rgba(239,83,80,0.3)',
  threatened: 'rgba(255,152,0,0.3)',
  blocked: 'rgba(127,29,29,0.3)',
};

function routeToGeoJson(routes: DataTradeRoute[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: routes.map((route) => ({
      type: 'Feature' as const,
      properties: {
        id: route.id,
        status: route.status,
        nameAr: route.nameAr,
        nameEn: route.nameEn,
        volume: route.globalTradeShare,
      },
      geometry: {
        type: 'LineString' as const,
        coordinates: route.coordinates, // Already [lng, lat] in GeoJSON format
      },
    })),
  };
}

function chokepointsToGeoJson(
  routes: DataTradeRoute[],
  locale: string
): GeoJSON.FeatureCollection {
  const points: GeoJSON.Feature[] = [];
  routes.forEach((route) => {
    route.chokepoints?.forEach((cp) => {
      const nameField = `name${locale.charAt(0).toUpperCase()}${locale.slice(1)}` as keyof Chokepoint;
      points.push({
        type: 'Feature' as const,
        properties: {
          nameAr: cp.nameAr,
          nameEn: cp.nameEn,
          nameLocal: (cp[nameField] as string) || cp.nameEn,
          routeId: route.id,
          routeStatus: route.status,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [cp.lng, cp.lat],
        },
      });
    });
  });
  return { type: 'FeatureCollection', features: points };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function TradeRouteMap({ routes, locale }: TradeRouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<MapLibrePopup | null>(null);
  const dashIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  const [selectedRoute, setSelectedRoute] = useState<DataTradeRoute | null>(null);
  const isRtl = locale === 'ar';

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    let map: MapLibreMap;
    let handleVisibility: (() => void) | null = null;

    const initMap = async () => {
      try {
        const maplibregl = (await import('maplibre-gl')).default;

        // Check WebGL support
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
          setMapError(t('map.webglError', locale));
          return;
        }

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
          center: [45, 25],
          zoom: 3,
          minZoom: 1.5,
          maxZoom: 10,
          attributionControl: false,
        });

        map.addControl(new maplibregl.NavigationControl(), isRtl ? 'top-left' : 'top-right');
        map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

        popupRef.current = new maplibregl.Popup({
          closeButton: true,
          closeOnClick: true,
          maxWidth: '280px',
        });

        map.on('load', () => {
          mapRef.current = map;

          // Add route lines
          const routeData = routeToGeoJson(routes);
          map.addSource('trade-routes', {
            type: 'geojson',
            data: routeData,
          });

          // Route line glow (wider, translucent)
          map.addLayer({
            id: 'routes-glow',
            type: 'line',
            source: 'trade-routes',
            paint: {
              'line-color': [
                'match',
                ['get', 'status'],
                'normal',
                'rgba(34,197,94,0.25)',
                'disrupted',
                'rgba(239,83,80,0.25)',
                'threatened',
                'rgba(255,152,0,0.25)',
                'blocked',
                'rgba(127,29,29,0.25)',
                'rgba(255,255,255,0.1)',
              ],
              'line-width': 8,
              'line-blur': 4,
            },
          });

          // Route line core
          map.addLayer({
            id: 'routes-line',
            type: 'line',
            source: 'trade-routes',
            paint: {
              'line-color': [
                'match',
                ['get', 'status'],
                'normal',
                '#22C55E',
                'disrupted',
                '#EF5350',
                'threatened',
                '#FF9800',
                'blocked',
                '#7F1D1D',
                '#888',
              ],
              'line-width': 2.5,
              'line-dasharray': [2, 1],
            },
          });

          // Animated dash layer (overlay with moving dash)
          map.addLayer({
            id: 'routes-dash',
            type: 'line',
            source: 'trade-routes',
            paint: {
              'line-color': [
                'match',
                ['get', 'status'],
                'normal',
                'rgba(34,197,94,0.6)',
                'disrupted',
                'rgba(239,83,80,0.6)',
                'threatened',
                'rgba(255,152,0,0.6)',
                'blocked',
                'rgba(127,29,29,0.6)',
                'rgba(255,255,255,0.3)',
              ],
              'line-width': 1.5,
              'line-dasharray': [0, 4, 3],
            },
          });

          // Animate the dashes with throttled interval (saves CPU/GPU)
          // Reduced from 80ms to 200ms — still smooth for dash animation
          // but uses 60% less CPU/GPU repaints
          let dashStep = 0;
          const dashArraySeq = [
            [0, 4, 3],
            [0.5, 4, 2.5],
            [1, 4, 2],
            [1.5, 4, 1.5],
            [2, 4, 1],
            [2.5, 4, 0.5],
            [3, 4, 0],
            [0, 0.5, 3, 3.5],
            [0, 1, 3, 3],
            [0, 1.5, 3, 2.5],
            [0, 2, 3, 2],
            [0, 2.5, 3, 1.5],
            [0, 3, 3, 1],
            [0, 3.5, 3, 0.5],
          ];

          dashIntervalRef.current = setInterval(() => {
            dashStep = (dashStep + 1) % dashArraySeq.length;
            if (map && map.getLayer('routes-dash')) {
              map.setPaintProperty(
                'routes-dash',
                'line-dasharray',
                dashArraySeq[dashStep]
              );
            }
          }, 200);

          // Pause animation when page is not visible (saves resources)
          handleVisibility = () => {
            if (document.hidden) {
              if (dashIntervalRef.current) { clearInterval(dashIntervalRef.current); dashIntervalRef.current = null; }
            } else {
              if (!dashIntervalRef.current) {
                dashIntervalRef.current = setInterval(() => {
                  dashStep = (dashStep + 1) % dashArraySeq.length;
                  if (map && map.getLayer('routes-dash')) {
                    map.setPaintProperty('routes-dash', 'line-dasharray', dashArraySeq[dashStep]);
                  }
                }, 200);
              }
            }
          };
          document.addEventListener('visibilitychange', handleVisibility);

          // Add chokepoint markers
          const cpData = chokepointsToGeoJson(routes, locale);
          map.addSource('chokepoints', {
            type: 'geojson',
            data: cpData,
          });

          map.addLayer({
            id: 'chokepoint-circle',
            type: 'circle',
            source: 'chokepoints',
            paint: {
              'circle-radius': 7,
              'circle-color': [
                'match',
                ['get', 'routeStatus'],
                'normal',
                '#22C55E',
                'disrupted',
                '#EF5350',
                'threatened',
                '#FF9800',
                'blocked',
                '#7F1D1D',
                '#FFB800',
              ],
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': 1.5,
              'circle-opacity': 0.9,
            },
          });

          map.addLayer({
            id: 'chokepoint-label',
            type: 'symbol',
            source: 'chokepoints',
            layout: {
              'text-field': isRtl ? ['get', 'nameAr'] : ['get', 'nameEn'],
              'text-size': 11,
              'text-offset': [0, 1.5],
              'text-anchor': 'top',
              'text-font': ['Open Sans Regular'],
              'text-allow-overlap': false,
              'text-ignore-placement': false,
            },
            paint: {
              'text-color': '#ffffff',
              'text-halo-color': 'rgba(0,0,0,0.7)',
              'text-halo-width': 1.5,
            },
          });

          // Route click → show detail
          map.on('click', 'routes-line', (e) => {
            if (!e.features || e.features.length === 0) return;
            const props = e.features[0].properties as Record<string, unknown>;
            const routeId = String(props?.id ?? '');
            const route = routes.find((r) => r.id === routeId);
            if (route) {
              setSelectedRoute(route);
            }
          });

          // Route hover cursor
          map.on('mouseenter', 'routes-line', () => {
            map.getCanvas().style.cursor = 'pointer';
          });
          map.on('mouseleave', 'routes-line', () => {
            map.getCanvas().style.cursor = '';
          });

          // Chokepoint click popup
          map.on('click', 'chokepoint-circle', (e) => {
            if (!e.features || e.features.length === 0) return;
            const props = e.features[0].properties as Record<string, unknown>;
            const name = isRtl
              ? String(props?.nameAr ?? '')
              : String(props?.nameEn ?? '');
            const routeId = String(props?.routeId ?? '');
            const routeStatus = String(props?.routeStatus ?? 'normal');

            const statusLabel = getStatusLabel(routeStatus);

            const color = STATUS_COLORS[routeStatus as RouteStatus] ?? '#888';

            const html = `
              <div style="background:var(--bg3);color:var(--text);padding:10px;border-radius:8px;font-family:inherit;">
                <div style="font-weight:700;color:var(--text-head);margin-bottom:4px;">⚓ ${name}</div>
                <div style="font-size:12px;color:${color};font-weight:600;">${statusLabel}</div>
                <div style="font-size:11px;color:var(--text3);margin-top:2px;">${t('tradeRoutes.route', locale)}: ${routeId}</div>
              </div>
            `;

            popupRef.current?.setLngLat(e.lngLat).setHTML(html).addTo(map);
          });
        });
      } catch (err) {
        console.error('[TradeRouteMap] Init error:', err);
        setMapError(t('map.initError', locale));
      }
    };

    initMap();

    return () => {
      if (handleVisibility) document.removeEventListener('visibilitychange', handleVisibility);
      if (dashIntervalRef.current) { clearInterval(dashIntervalRef.current); dashIntervalRef.current = null; }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update routes when props change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource('trade-routes')) return;
    const routeData = routeToGeoJson(routes);
    (map.getSource('trade-routes') as GeoJSONSource).setData(routeData);

    const cpData = chokepointsToGeoJson(routes, locale);
    if (map.getSource('chokepoints')) {
      (map.getSource('chokepoints') as GeoJSONSource).setData(cpData);
    }
  }, [routes, locale]);

  // Helper to get route name in current locale
  const getRouteLocalName = (route: DataTradeRoute) => {
    const nameField = `name${locale.charAt(0).toUpperCase()}${locale.slice(1)}` as keyof DataTradeRoute;
    return (route[nameField] as string) || route.nameEn;
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, Record<string, string>> = {
      normal: { ar: 'طبيعي', en: 'Normal', fr: 'Normal', tr: 'Normal', es: 'Normal' },
      disrupted: { ar: 'متضرر', en: 'Disrupted', fr: 'Perturbé', tr: 'Etkilenmiş', es: 'Interrumpido' },
      threatened: { ar: 'مهدد', en: 'Threatened', fr: 'Menacé', tr: 'Tehdit Altında', es: 'Amenazado' },
      blocked: { ar: 'محظور', en: 'Blocked', fr: 'Bloqué', tr: 'Engelli', es: 'Bloqueado' },
    };
    return statusMap[status]?.[locale] || status;
  };

  if (mapError) {
    return (
      <div className="flex items-center justify-center h-[450px] lg:h-[550px] rounded-xl border" style={{ background: 'var(--bg2)', borderColor: 'var(--rim)' }}>
        <div className="text-center">
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🗺️</div>
          <p className="text-sm" style={{ color: 'var(--text3)' }}>{mapError}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative rounded-xl border overflow-hidden"
      style={{ background: 'var(--bg2)', borderColor: 'var(--rim)' }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Map */}
      <div
        ref={mapContainer}
        className="w-full h-[450px] lg:h-[550px]"
        style={{ background: '#050810' }}
      />

      {/* Route status legend */}
      <div
        className="absolute top-3 z-10 rounded-lg p-2 flex gap-3"
        style={{
          background: 'var(--bg3)',
          border: '1px solid var(--rim)',
          [isRtl ? 'left' : 'right']: '12px',
        }}
      >
        {(['normal', 'disrupted', 'threatened'] as RouteStatus[]).map((status) => {
          const label = getStatusLabel(status);
          return (
            <div key={status} className="flex items-center gap-1.5">
              <span
                className="w-3 h-1 rounded-full"
                style={{ background: STATUS_COLORS[status] }}
              />
              <span className="text-[10px] font-medium" style={{ color: 'var(--text2)' }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Selected route detail panel */}
      {selectedRoute && (
        <div
          className="absolute bottom-3 z-20 rounded-xl p-4 w-72 max-w-[calc(100%-24px)]"
          style={{
            background: 'var(--bg3)',
            border: '1px solid var(--rim)',
            [isRtl ? 'right' : 'left']: '12px',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold" style={{ color: 'var(--text-head)' }}>
              {getRouteLocalName(selectedRoute)}
            </h4>
            <button
              onClick={() => setSelectedRoute(null)}
              className="p-1 rounded hover:bg-[var(--bg5)]"
              style={{ color: 'var(--text3)' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
              style={{
                background: `${STATUS_COLORS[selectedRoute.status as RouteStatus]}18`,
                color: STATUS_COLORS[selectedRoute.status as RouteStatus],
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: STATUS_COLORS[selectedRoute.status as RouteStatus] }}
              />
              {getStatusLabel(selectedRoute.status)}
            </span>
          </div>

          {selectedRoute.globalTradeShare > 0 && (
            <p className="text-xs mb-2" style={{ color: 'var(--text2)' }}>
              {t('tradeRoutes.tradeVolume', locale)}:{' '}
              <span className="font-bold" style={{ color: 'var(--text-head)' }}>
                {selectedRoute.globalTradeShare}% {t('tradeRoutes.ofGlobalTrade', locale)}
              </span>
            </p>
          )}

          {selectedRoute.chokepoints && selectedRoute.chokepoints.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase mb-1" style={{ color: 'var(--text3)' }}>
                {t('tradeRoutes.chokepoints', locale)}
              </p>
              <div className="space-y-1">
                {selectedRoute.chokepoints.map((cp, i) => {
                  const cpNameField = `name${locale.charAt(0).toUpperCase()}${locale.slice(1)}` as keyof Chokepoint;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 text-xs"
                      style={{ color: 'var(--text2)' }}
                    >
                      <Anchor className="w-3 h-3" style={{ color: 'var(--cyan)' }} />
                      {(cp[cpNameField] as string) || cp.nameEn}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

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
      `}</style>
    </div>
  );
}
