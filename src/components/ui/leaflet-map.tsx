import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

export interface MapMarker {
  id?: string;
  latitude: number;
  longitude: number;
  title?: string;
  popupHtml?: string;
  iconColor?: string;
}

interface LeafletMapProps {
  // Single-marker compat
  latitude?: number;
  longitude?: number;
  popupText?: string;
  // Multi-marker
  markers?: MapMarker[];
  zoom?: number;
  className?: string;
  fitBounds?: boolean;
}

const buildColoredIcon = (color: string) =>
  L.divIcon({
    className: 'custom-pin-marker',
    html: `<div style="position:relative;width:30px;height:42px;">
      <div style="position:absolute;left:50%;top:0;transform:translateX(-50%);width:30px;height:30px;border-radius:50% 50% 50% 0;background:${color};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);transform-origin:center;transform:translateX(-50%) rotate(-45deg);"></div>
      <div style="position:absolute;left:50%;top:8px;transform:translateX(-50%);width:12px;height:12px;border-radius:50%;background:white;"></div>
    </div>`,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -38],
  });

const LeafletMap = ({
  latitude,
  longitude,
  zoom = 6,
  className = 'h-full w-full',
  popupText,
  markers,
  fitBounds = true,
}: LeafletMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const effectiveMarkers: MapMarker[] =
    markers && markers.length
      ? markers
      : latitude != null && longitude != null
      ? [{ latitude, longitude, popupHtml: popupText }]
      : [];

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const center: [number, number] =
      effectiveMarkers.length > 0
        ? [effectiveMarkers[0].latitude, effectiveMarkers[0].longitude]
        : [24.7136, 46.6753];

    const map = L.map(mapRef.current).setView(center, zoom);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    if (effectiveMarkers.length === 0) return;

    const latLngs: L.LatLngTuple[] = [];
    effectiveMarkers.forEach((m) => {
      const icon = buildColoredIcon(m.iconColor || '#630d5f');
      const marker = L.marker([m.latitude, m.longitude], {
        icon,
        title: m.title,
        alt: m.title ? `Map marker: ${m.title}` : 'Map marker',
        keyboard: true,
      }).addTo(layer);
      if (m.popupHtml) {
        marker.bindPopup(m.popupHtml);
        marker.on('popupopen', (e: any) => {
          const el = e.popup?.getElement()?.querySelector('[role="dialog"]') as HTMLElement | null;
          if (el) setTimeout(() => el.focus(), 0);
        });
      }
      if (m.title) marker.bindTooltip(m.title, { direction: 'top', offset: [0, -36] });
      latLngs.push([m.latitude, m.longitude]);
    });

    if (fitBounds && latLngs.length > 1) {
      map.fitBounds(L.latLngBounds(latLngs), { padding: [40, 40], maxZoom: 12 });
    } else if (latLngs.length === 1) {
      map.setView(latLngs[0], zoom);
    }
  }, [JSON.stringify(effectiveMarkers), zoom, fitBounds]);

  return <div ref={mapRef} className={className} />;
};

export default LeafletMap;
