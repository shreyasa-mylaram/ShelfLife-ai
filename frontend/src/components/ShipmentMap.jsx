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
      const locData = (containers && containers.length > 0)
        ? CONTAINER_LOCATIONS.map(base => {
            const live = containers.find(c => c.id === base.id);
            return live ? { 
              ...base, 
              status: live.status, 
              prediction: live.prediction, 
              temp: live.temp,
              confidence: live.confidence || 94
            } : base;
          })
        : CONTAINER_LOCATIONS;

      locData.forEach(container => {
        const color = STATUS_COLORS[container.status] || '#10b981';

        // Pulsing circle icon with confidence glow
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
                box-shadow:0 0 12px ${color};"></div>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([container.lat, container.lng], { icon: pulse }).addTo(map);
        marker.bindPopup(`
          <div style="background:#0a2b3e;color:#fff;padding:12px;border-radius:12px;min-width:200px;font-family:Inter,sans-serif;border:1px solid ${color}44;">
            <div style="display:flex;justify-between;align-center;margin-bottom:8px;">
               <span style="font-weight:900;font-size:14px;color:#fff;letter-spacing:-0.5px;">📦 ${container.id}</span>
               <span style="margin-left:auto;font-size:10px;color:#00d4aa;font-weight:900;">AI ACTIVE</span>
            </div>
            <div style="font-size:12px;color:#94a3b8;margin-bottom:4px;"> Cargo: <b style="color:white;">${container.cargo}</b></div>
            <div style="font-size:11px;color:#94a3b8;margin-bottom:8px;">📍 ${container.location}</div>
            
            <div style="border-top:1px solid #1e3a4e;padding-top:8px;">
               <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px;">
                  <span>Health Index</span>
                  <span style="color:#10b981;font-weight:800;">${container.confidence || 94}% Confidence</span>
               </div>
               <div style="height:3px;width:100%;background:#1e3a4e;border-radius:99px;overflow:hidden;">
                  <div style="height:100%;width:${container.confidence || 94}%;background:#10b981;"></div>
               </div>
            </div>
          </div>
        `, { closeButton: false });

        // Step 3 Feature: Draw Red "Predictive Breach Arcs" for containers in risk
        if (container.status !== 'normal') {
            // Predict a 100km "Deviation" path
            const offsetLat = container.lat + (container.status === 'critical' ? 0.8 : 0.4);
            const offsetLng = container.lng + (container.status === 'critical' ? 1.2 : 0.6);
            
            L.polyline([[container.lat, container.lng], [offsetLat, offsetLng]], {
                color: '#ef4444',
                weight: 3,
                opacity: 0.8,
                dashArray: '5, 8',
                className: 'predictive-path',
                interactive: false
            }).addTo(map);

            // Add "Predictive Zone" circle
            L.circle([offsetLat, offsetLng], {
                color: '#ef4444',
                fillColor: '#ef4444',
                fillOpacity: 0.1,
                radius: 40000,
                weight: 1
            }).addTo(map);
        }
      });

      // Default Shipping Channel
      const coords = locData.map(c => [c.lat, c.lng]);
      L.polyline(coords, {
        color: '#00d4aa',
        weight: 1.5,
        opacity: 0.25,
        dashArray: '8, 12',
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
  }, [containers]); // Re-render when containers update

  return (
    <div className="relative border border-white/5 shadow-2xl glass rounded-3xl" style={{ overflow: 'hidden', height: '400px' }}>
      {/* Pulse animation style */}
      <style>{`
        @keyframes pulse {
          0%   { transform: scale(1); opacity: 0.25; }
          50%  { transform: scale(2.2); opacity: 0;   }
          100% { transform: scale(1); opacity: 0.25; }
        }
        @keyframes flow {
          to { stroke-dashoffset: -20; }
        }
        .predictive-path {
          animation: flow 1s linear infinite;
        }
        .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .leaflet-popup-tip { display: none; }
      `}</style>

      {/* Map header overlay */}
      <div className="flex items-center gap-3" style={{
        position: 'absolute', top: 16, left: 16, zIndex: 1000,
        background: 'rgba(10,43,62,0.85)',
        backdropFilter: 'blur(12px)',
        padding: '10px 18px',
        borderRadius: '16px',
        border: '1px solid rgba(0,212,170,0.3)',
        color: '#fff',
        fontSize: '13px',
      }}>
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="font-bold tracking-tighter uppercase">Predictive Route Overlays</span>
      </div>

       {/* AI Confidence Meter */}
       <div style={{
        position: 'absolute', top: 16, right: 16, zIndex: 1000,
        background: 'rgba(10,43,62,0.85)',
        backdropFilter: 'blur(12px)',
        padding: '10px 18px',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.1)',
        color: '#00d4aa',
        fontSize: '11px',
        fontWeight: '900',
        letterSpacing: '0.1em'
      }}>
        <span style={{ color: '#94a3b8' }}>AI CONFIDENCE:</span> 94.2%
      </div>

      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default ShipmentMap;
