import React, { useEffect, useRef, useCallback } from 'react';

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

const ShipmentMap = ({ containers, blockedZone, rerouteData, selectedRouteId }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);
  const isInitializedRef = useRef(false);

  // Memoized function that draws all dynamic layers
  const updateLayers = useCallback(() => {
    const L = window.L;
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!L || !map || !layerGroup) return;

    // Clear ALL dynamic layers before re-adding
    layerGroup.clearLayers();

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
              box-shadow:0 0 10px ${color};"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([container.lat, container.lng], { icon: pulse });
      marker.bindPopup(`
        <div style="background:#ffffff;color:#0f172a;padding:14px;border-radius:16px;min-width:210px;font-family:Inter,sans-serif;border:1px solid #e2e8f0;box-shadow:0 10px 25px rgba(0,0,0,0.08);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
             <span style="font-weight:900;font-size:14px;color:#0f172a;letter-spacing:-0.5px;">📦 ${container.id}</span>
             <span style="font-size:10px;color:#0d9488;font-weight:800;background:#f0fdfa;padding:2px 6px;border-radius:6px;border:1px solid #99f6e4;">AI ACTIVE</span>
          </div>
          <div style="font-size:12px;color:#64748b;margin-bottom:4px;"> Cargo: <b style="color:#0f172a;">${container.cargo}</b></div>
          <div style="font-size:11px;color:#64748b;margin-bottom:8px;">📍 ${container.location}</div>
          
          <div style="border-top:1px solid #f1f5f9;padding-top:8px;">
             <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px;">
                <span style="color:#64748b;font-weight:600;">Health Index</span>
                <span style="color:#059669;font-weight:800;">${container.confidence || 94}% Confidence</span>
             </div>
             <div style="height:4px;width:100%;background:#f1f5f9;border-radius:99px;overflow:hidden;">
                <div style="height:100%;width:${container.confidence || 94}%;background:#059669;"></div>
             </div>
          </div>
        </div>
      `, { closeButton: false });
      layerGroup.addLayer(marker);

      // Draw Red "Predictive Breach Arcs" for containers in risk
      if (container.status !== 'normal') {
          const offsetLat = container.lat + (container.status === 'critical' ? 0.8 : 0.4);
          const offsetLng = container.lng + (container.status === 'critical' ? 1.2 : 0.6);
          
          const breachLine = L.polyline([[container.lat, container.lng], [offsetLat, offsetLng]], {
              color: '#e11d48',
              weight: 3,
              opacity: 0.8,
              dashArray: '5, 8',
              className: 'predictive-path',
              interactive: false
          });
          layerGroup.addLayer(breachLine);

          // Add "Predictive Zone" circle
          const zone = L.circle([offsetLat, offsetLng], {
              color: '#e11d48',
              fillColor: '#ffe4e6',
              fillOpacity: 0.25,
              radius: 40000,
              weight: 1
          });
          layerGroup.addLayer(zone);
      }
    });

    // Default Shipping Channel
    const coords = locData.map(c => [c.lat, c.lng]);
    const channelLine = L.polyline(coords, {
      color: '#0d9488',
      weight: 2,
      opacity: 0.35,
      dashArray: '8, 12',
    });
    layerGroup.addLayer(channelLine);

    // Geopolitical Blocked Chokepoint Hazard Zone Overlay
    if (blockedZone && blockedZone.polygon && blockedZone.polygon.length > 0) {
      const hazardPoly = L.polygon(blockedZone.polygon, {
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: 0.35,
        weight: 2,
        dashArray: '4, 6'
      });

      hazardPoly.bindTooltip(`⚠️ ${blockedZone.name || 'WAR RISK / BLOCKED CHOKEPOINT'}`, {
        permanent: true,
        direction: 'center',
        className: 'bg-rose-600 text-white text-xs font-bold px-2 py-1 rounded shadow-md border-0'
      });
      layerGroup.addLayer(hazardPoly);

      // Auto-center towards hazard zone
      try {
        map.panTo(blockedZone.polygon[0], { animate: true });
      } catch (e) { /* ignore */ }
    }

    // Alternate Reroute Lines
    if (rerouteData && rerouteData.length > 0) {
      rerouteData.forEach(route => {
        const isSelected = selectedRouteId ? route.id === selectedRouteId : route.recommended;
        const polyline = L.polyline(route.waypoints, {
          color: route.color || (isSelected ? '#0d9488' : '#64748b'),
          weight: isSelected ? 4 : 2,
          opacity: isSelected ? 0.9 : 0.45,
          dashArray: isSelected ? '6, 8' : '4, 4',
        });

        polyline.bindPopup(`
          <div style="font-family: sans-serif; min-width: 160px;">
            <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 4px;">${route.name}</div>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">${route.description}</div>
            <div style="display: flex; gap: 8px; font-size: 11px;">
              <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-weight: 600;">+${route.extra_days}d ETA</span>
              <span style="background: #fef2f2; color: #dc2626; padding: 2px 6px; border-radius: 4px; font-weight: 600;">+${route.spoilage_risk_delta}% Risk</span>
            </div>
          </div>
        `);
        layerGroup.addLayer(polyline);
      });
    }
  }, [containers, blockedZone, rerouteData, selectedRouteId]);

  // UseEffect #1: Initialize the map ONCE — never destroy on prop changes
  useEffect(() => {
    if (isInitializedRef.current) return;

    const initMap = () => {
      if (!window.L || !mapRef.current) return;
      const L = window.L;

      // Prevent double-init
      if (mapInstanceRef.current) return;
      isInitializedRef.current = true;

      const map = L.map(mapRef.current, {
        center: [15, 80],
        zoom: 3,
        zoomControl: true,
        attributionControl: true,
      });

      // Free OpenStreetMap tile layer (no API key required)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
      layerGroupRef.current = L.layerGroup().addTo(map);

      // Draw initial layers
      updateLayers();
    };

    if (window.L) {
      initMap();
    } else {
      const checkTimer = setInterval(() => {
        if (window.L) {
          clearInterval(checkTimer);
          initMap();
        }
      }, 100);
      return () => clearInterval(checkTimer);
    }

    // Cleanup only on component UNMOUNT
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) { /* ignore removal errors */ }
        mapInstanceRef.current = null;
        layerGroupRef.current = null;
        isInitializedRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // UseEffect #2: Update layers when props change (map stays alive)
  useEffect(() => {
    updateLayers();
  }, [updateLayers]);

  return (
    <div className="relative border border-slate-200 shadow-sm bg-white rounded-3xl" style={{ overflow: 'hidden', height: '400px' }}>
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
      <div className="flex items-center gap-2.5" style={{
        position: 'absolute', top: 16, left: 16, zIndex: 1000,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        padding: '8px 16px',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        color: '#0f172a',
        fontSize: '12px',
        fontWeight: '700',
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
      }}>
        <div className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
        <span className="tracking-tight uppercase text-slate-800">Predictive Route Overlays</span>
      </div>

       {/* AI Confidence Meter */}
       <div style={{
        position: 'absolute', top: 16, right: 16, zIndex: 1000,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        padding: '8px 16px',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        color: '#0d9488',
        fontSize: '11px',
        fontWeight: '800',
        letterSpacing: '0.05em',
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
      }}>
        <span style={{ color: '#64748b' }}>AI CONFIDENCE:</span> 94.2%
      </div>

      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default ShipmentMap;
