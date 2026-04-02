import React, { useEffect, useRef } from 'react';

// Using Leaflet via CDN - no API key needed, completely free
const CONTAINER_LOCATIONS = [
  { id: "DPW-1024A", lat: 18.9400, lng: 66.5000, status: "normal",   cargo: "Pharmaceuticals", location: "Arabian Sea" },
  { id: "DPW-1024B", lat: 12.5000, lng: 75.5000, status: "warning",  cargo: "Fresh Produce",   location: "Indian Ocean" },
  { id: "DPW-1024C", lat: 18.9388, lng: 72.8354, status: "critical", cargo: "Seafood",         location: "DPW Mumbai Terminal" },
  { id: "DPW-1024D", lat: 14.0000, lng: 115.000, status: "normal",   cargo: "Vaccines",        location: "South China Sea" },
  { id: "DPW-1024E", lat: 1.35200, lng: 103.820, status: "normal",   cargo: "Dairy",           location: "Singapore Port" },
];

const STATUS_COLORS = {
  normal:   '#10b981',
  warning:  '#f59e0b',
  critical: '#ef4444',
};

const ShipmentMap = ({ containers }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    // Inject Leaflet CSS if not already present
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load Leaflet JS only once
    const initMap = () => {
      if (!window.L || mapInstanceRef.current) return;
      const L = window.L;

      const map = L.map(mapRef.current, {
        center: [15, 85],
        zoom: 4,
        zoomControl: true,
        attributionControl: true,
      });

      // Dark nautical tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 18,
      }).addTo(map);

      // Merge live containers prop with fallback locations
      const locData = containers && containers.length > 0
        ? CONTAINER_LOCATIONS.map(base => {
            const live = containers.find(c => c.id === base.id);
            return live ? { ...base, status: live.status, temp: live.temp } : base;
          })
        : CONTAINER_LOCATIONS;

      locData.forEach(container => {
        const color = STATUS_COLORS[container.status] || '#10b981';

        // Pulsing circle for each container
        const pulse = L.divIcon({
          className: '',
          html: `
            <div style="position:relative;width:24px;height:24px;">
              <div style="
                position:absolute;top:0;left:0;width:24px;height:24px;
                border-radius:50%;background:${color};opacity:0.25;
                animation:pulse 2s infinite;"></div>
              <div style="
                position:absolute;top:4px;left:4px;width:16px;height:16px;
                border-radius:50%;background:${color};border:2px solid #fff;
                box-shadow:0 0 8px ${color};"></div>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([container.lat, container.lng], { icon: pulse }).addTo(map);
        marker.bindPopup(`
          <div style="background:#1e2f3a;color:#fff;padding:10px;border-radius:8px;min-width:180px;font-family:Inter,sans-serif;">
            <div style="font-weight:700;font-size:14px;color:#00d4aa;margin-bottom:6px;">📦 ${container.id}</div>
            <div style="font-size:12px;margin-bottom:3px;">🌡️ Cargo: <b>${container.cargo}</b></div>
            <div style="font-size:12px;margin-bottom:3px;">📍 ${container.location}</div>
            <div style="font-size:12px;margin-top:6px;">
              <span style="
                background:${color};color:#fff;padding:2px 8px;
                border-radius:12px;font-size:11px;font-weight:600;
                text-transform:uppercase;">
                ${container.status}
              </span>
            </div>
          </div>
        `, { closeButton: false });
      });

      // Draw shipping route lines between containers
      const coords = locData.map(c => [c.lat, c.lng]);
      L.polyline(coords, {
        color: '#00d4aa',
        weight: 1.5,
        opacity: 0.4,
        dashArray: '6, 8',
      }).addTo(map);

      mapInstanceRef.current = map;
    };

    if (window.L) {
      initMap();
    } else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = initMap;
      document.body.appendChild(script);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative" style={{ borderRadius: '16px', overflow: 'hidden', height: '400px' }}>
      {/* Pulse animation style */}
      <style>{`
        @keyframes pulse {
          0%   { transform: scale(1); opacity: 0.25; }
          50%  { transform: scale(2); opacity: 0;    }
          100% { transform: scale(1); opacity: 0.25; }
        }
        .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .leaflet-popup-tip { display: none; }
      `}</style>

      {/* Map header overlay */}
      <div style={{
        position: 'absolute', top: 12, left: 12, zIndex: 1000,
        background: 'rgba(10,43,62,0.85)',
        backdropFilter: 'blur(8px)',
        padding: '8px 14px',
        borderRadius: '10px',
        border: '1px solid rgba(0,212,170,0.3)',
        color: '#fff',
        fontSize: '13px',
        fontWeight: '600',
        letterSpacing: '0.5px',
      }}>
        🌐 Live Fleet Tracking — DP World
      </div>

      {/* Status legend */}
      <div style={{
        position: 'absolute', bottom: 12, right: 12, zIndex: 1000,
        background: 'rgba(10,43,62,0.85)',
        backdropFilter: 'blur(8px)',
        padding: '8px 12px',
        borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', flexDirection: 'column', gap: '5px',
      }}>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#ccc' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </div>
        ))}
      </div>

      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default ShipmentMap;
