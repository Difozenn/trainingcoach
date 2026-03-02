"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type GpsPoint = {
  lat: number;
  lng: number;
};

export function ActivityMap({
  gpsPoints,
  color = "#3b82f6",
}: {
  gpsPoints: GpsPoint[];
  color?: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || gpsPoints.length < 2) return;

    // Prevent double init
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
      dragging: true,
      doubleClickZoom: true,
    });

    mapInstanceRef.current = map;

    // Dark CartoDB tiles
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        maxZoom: 19,
        subdomains: "abcd",
      }
    ).addTo(map);

    // Route polyline
    const latLngs = gpsPoints.map((p) => [p.lat, p.lng] as [number, number]);
    const polyline = L.polyline(latLngs, {
      color,
      weight: 3,
      opacity: 0.9,
      smoothFactor: 1,
    }).addTo(map);

    // Start/end markers
    const startIcon = L.divIcon({
      className: "",
      html: `<div style="width:10px;height:10px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.5);"></div>`,
      iconSize: [10, 10],
      iconAnchor: [5, 5],
    });
    const endIcon = L.divIcon({
      className: "",
      html: `<div style="width:10px;height:10px;border-radius:50%;background:#ef4444;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.5);"></div>`,
      iconSize: [10, 10],
      iconAnchor: [5, 5],
    });

    L.marker(latLngs[0], { icon: startIcon }).addTo(map);
    L.marker(latLngs[latLngs.length - 1], { icon: endIcon }).addTo(map);

    // Fit bounds with padding
    map.fitBounds(polyline.getBounds(), { padding: [30, 30] });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [gpsPoints, color]);

  return (
    <div
      ref={mapRef}
      className="h-[300px] w-full rounded-lg overflow-hidden"
    />
  );
}
